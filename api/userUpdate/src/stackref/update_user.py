import json
import logging
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.grant_functions import *
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    update_user
        Update User
'''
def update_user(event, payload_json):
    log.info(":: update_user")

    action = payload_json['action']
    user = payload_json['user']

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    if action == 'update':
        authorization = (
            'user_write' in grants,
            get_user_uuid(event) == user['user_uuid']
        )
        if any(authorization):
            return process_update_user(user)
        else:
            return return_error(401, 'Not authorized')
    elif action == 'update_roles':
        if 'user_write' in grants:
            return update_user_roles(user)
        else:
            return return_error(401, 'Not authorized')
    elif action == 'remove_from_org':
        # TODO: Check that User is not the only Organization owner first
        if 'user_write' in grants:
            try:
                remove_user_from_org(user)
                remove_user_from_org_roles(user)
                #remove_user_from_participants(user)
            except BaseException as error:
                return return_error(500, error)
        else:
            return return_error(401, 'Not authorized')

        try:
            incr_key_prefix('user')
            incr_key_prefix('user_role_member')
            incr_key_prefix('participant')
            incr_key_prefix('team_member')
        except:
            log.error('>> incr_key_prefix')

        response_payload = {
            "status_code": 200,
            "user_uuid": str(user['user_uuid']),
            "organization_uuid": str(user['organization_uuid'])
        }
        response_body = json.dumps(response_payload)

        return {
            'statusCode': 200,
            'body': response_body
        }

'''
    process_update_user
        Update User-configurable details and settings
'''
def process_update_user(user):
    log.info(':: process_update_user')

    user_uuid = user['user_uuid']

    sql_parameters = {'user_uuid': user_uuid}

    row_updates = []

    if 'first_name' in user:
        first_name = user['first_name']
        sql_parameters['first_name'] = first_name
        row_updates.append('first_name = %(first_name)s')
    if 'last_name' in user:
        last_name = user['last_name']
        sql_parameters['last_name'] = last_name
        row_updates.append('last_name = %(last_name)s')
    if 'email_address' in user:
        email_address = user['email_address']
        sql_parameters['email_address'] = email_address
        row_updates.append('email_address = %(email_address)s')
    if 'phone' in user:
        phone = user['phone']
        sql_parameters['phone'] = phone
        row_updates.append('phone = %(phone)s')
    if 'job_title' in user:
        job_title = user['job_title']
        sql_parameters['job_title'] = job_title
        row_updates.append('job_title = %(job_title)s')
    if 'settings' in user:
        user_settings = json.dumps(user['settings'])
        sql_parameters['user_settings'] = user_settings
        row_updates.append('settings = %(user_settings)s::JSONB')
    if 'tags' in user:
        tags = json.dumps(user['tags'])
        sql_parameters['tags'] = tags
        row_updates.append('tags = %(tags)s::JSONB')

    sql_statement = (f"""
        -- Update User settings object
        UPDATE
            sr.user
        SET
            {', '.join(row_updates)}
        WHERE
            user_uuid = %(user_uuid)s::UUID
    """)
    log.debug(str(sql_statement))
    log.debug(str(sql_parameters))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> process_update_user: {error}")
        return False

    try:
        incr_key_prefix('user')
        incr_key_prefix('participant')
        incr_key_prefix('team_member')
    except:
        log.error('>> incr_key_prefix')

    response_payload = {
        "status_code": 200,
        "user_uuid": str(user['user_uuid'])
    }

    if 'settings' in user:
        response_payload['settings'] = json.dumps(user['settings'])

    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'body': response_body
    }

'''
    update_user_roles
        Update a user's roles
'''
def update_user_roles(user):
    log.info(':: update_user_roles')

    user_uuid = user['user_uuid']
    organization_uuid = user['organization_uuid']
    user_roles = None

    # If the user has no roles set, remove them from everything
    where_clause = ""
    if user['user_roles'] and len(user['user_roles']) > 0:
        user_roles = list(map(int, user['user_roles']))
        where_clause = f"AND user_role_id NOT IN ({str(user_roles)[1:-1]});"

    sql_statement = (f"""
        -- Remove user from any roles not in list
        DELETE
        FROM
            sr.user_role_member
        WHERE
            user_uuid = %(user_uuid)s::UUID
            {where_clause};
    """)
    sql_parameters = {'user_uuid': user_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_user_roles: {error}")
        return return_error(503, error)

    if user_roles:
        for role_id in user_roles:
            user_role_member_uuid = uuid.uuid4()
            sql_statement = ("""
                -- Add user to role if not already present
                INSERT
                    INTO
                    sr.user_role_member (
                        user_role_member_uuid,
                        user_uuid,
                        organization_uuid,
                        user_role_id,
                        ts_modified
                    )
                    SELECT
                        %(user_role_member_uuid)s::UUID,
                        %(user_uuid)s::UUID,
                        %(organization_uuid)s::UUID,
                        %(role_id)s,
                        NOW()
                    WHERE
                        NOT EXISTS (
                            SELECT
                                user_role_member_uuid
                            FROM
                                sr.user_role_member
                            WHERE
                                user_uuid = %(user_uuid)s::UUID
                                AND user_role_id = %(role_id)s
                        );
            """)
            log.info(str(sql_statement))
            sql_parameters = {
                'user_role_member_uuid': user_role_member_uuid,
                'user_uuid': user_uuid,
                'organization_uuid': organization_uuid,
                'role_id': int(role_id)
            }
            try:
                with settings.db_conn() as db_conn:
                    with db_conn.cursor() as cur:
                        cur.execute(sql_statement, sql_parameters)
            except Exception as error:
                log.error(f">> update_user_roles: {error}")
                return return_error(503, error) 

            log.info(f":: update_user_roles user_uuid: {user_uuid}")

    response_payload = {
        "status_code": 200,
        "user_uuid": str(user_uuid)
    }

    try:
        incr_key_prefix('user_role_member')
        incr_key_prefix('user')
    except:
        log.error('>> incr_key_prefix')

    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'body': response_body
    }

'''
    remove_user_from_org
        Remove User from attachment to Organization
'''
def remove_user_from_org(user):
    log.info(':: remove_user_from_org')

    user_uuid = user['user_uuid']
    organization_uuid = user['organization_uuid']

    sql_statement = ("""
        -- Remove User from Organization
        UPDATE
            sr.user
        SET
            organization_uuid = NULL
        WHERE
            user_uuid = %(user_uuid)s::UUID
            AND organization_uuid = %(organization_uuid)s::UUID;
    """)
    sql_parameters = {
        'user_uuid': user_uuid,
        'organization_uuid': organization_uuid
    }
    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> remove_user_from_org: {error}")
        raise error

    log.info(f":: remove_user_from_org user_uuid: {user_uuid}")

'''
    remove_user_from_org_roles
        Remove User from Organization roles
'''
def remove_user_from_org_roles(user):
    log.info(':: remove_user_from_org_roles')

    user_uuid = user['user_uuid']
    organization_uuid = user['organization_uuid']

    sql_statement = ("""
        -- Remove User's Organization role membership
        DELETE
        FROM
            sr.user_role_member
        WHERE
            user_uuid = %(user_uuid)s::UUID
            AND organization_uuid = %(organization_uuid)s::UUID;
    """)
    sql_parameters = {
        'user_uuid': user_uuid,
        'organization_uuid': organization_uuid
    }
    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> remove_user_from_org_roles: {error}")
        raise error

    log.info(f":: remove_user_from_org_roles user_uuid: {user_uuid}")

'''
    remove_user_from_participants
        Remove User from Organization roles
        TODO: Need to find all events the User was part of to find this
'''
def remove_user_from_participants(user):
    log.info(':: remove_user_from_participants')

    user_uuid = user['user_uuid']
    organization_uuid = user['organization_uuid']

    sql_statement = ("""
        -- Remove User's Organization Participant membership
        DELETE
        FROM
            sr.participant
        WHERE
            user_uuid = %(user_uuid)s::UUID
            AND organization_uuid = %(organization_uuid)s::UUID;
    """)
    sql_parameters = {
        'user_uuid': user_uuid,
        'organization_uuid': organization_uuid
    }
    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> remove_user_from_participants: {error}")
        return return_error(503, error)

    log.info(f":: remove_user_from_participants user_uuid: {user_uuid}")

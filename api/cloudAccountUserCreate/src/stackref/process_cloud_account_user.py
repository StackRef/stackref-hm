import hashlib
import json
import logging
from pydash import get
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.aws_account_access import aws_account_access

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_cloud_account_user
        Check user_uuid assignment to configured cloud_account and create user access
'''
def process_cloud_account_user(payload_json):
    log.info(':: process_cloud_account_user')

    user_uuid = str(payload_json['cloud_account_user']['user_uuid'])

    if 'team_uuid' in payload_json['cloud_account_user']:
        cloud_account_owner_uuid = str(payload_json['cloud_account_user']['team_uuid'])
        cloud_account_owner_type = 'team'
    elif 'event_uuid' in payload_json['cloud_account_user']:
        cloud_account_owner_uuid = str(payload_json['cloud_account_user']['event_uuid'])
        cloud_account_owner_type = 'event'
    else:
        return return_error(500, 'Malformed request')

    if 'access_level' in payload_json['cloud_account_user']:
        cloud_account_access_level_id = str(payload_json['cloud_account_user']['access_level'])
    else:
        cloud_account_access_level_id = 1

    try:
        assigned_account = assigned_cloud_account(cloud_account_owner_uuid)
    except Exception as error:
        return return_error(503, error)

    if assigned_account:
        try:
            if user_can_join_account(user_uuid, cloud_account_owner_uuid, cloud_account_owner_type):
                return create_cloud_account_user(user_uuid, assigned_account, cloud_account_access_level_id)
        except Exception as error:
            log.error(f">> process_cloud_account_user: {error}")
            return return_error(503, error)
    else:
        return return_error(500, 'No available cloud account exists')

'''
    assigned_cloud_account
        Return a single cloud_account_uuid of an assigned cloud_account for cloud_account_owner_uuid
'''
def assigned_cloud_account(cloud_account_owner_uuid):
    log.info(':: assigned_cloud_account')

    sql_statement = ("""
        -- Return cloud_account_uuid of cloud_account if one exists
        SELECT
            cloud_account_uuid
        FROM
            sr.cloud_account
        WHERE
            cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID
            AND cloud_account_status_id in (1, 4)
        LIMIT 1;
    """)
    sql_parameters = {'cloud_account_owner_uuid': cloud_account_owner_uuid}

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('cloud_account', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> assigned_cloud_account: {error}")
            raise error

        if response and response[0]:
            payload = response[0]
        else:
            payload = ''

        cache_query_response('cloud_account', hashed_query, payload)

    if payload != '':
        return payload
    else:
        return None

'''
    user_can_join_account
        Checks if user_uuid is active for account_owner_type
'''
def user_can_join_account(user_uuid, cloud_account_owner_uuid, cloud_account_owner_type):
    log.info(':: user_can_join_account')

    if cloud_account_owner_type == 'event':
        sql_statement = (f"""
            -- Return > 0 if user_uuid is in active role for event
            SELECT
                COUNT(*)
            FROM
                sr.participant AS p
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(prm) AS count
                FROM
                    sr.participant_role_member AS prm
                WHERE
                    prm.participant_uuid = p.participant_uuid
                    AND prm.participant_role_id IN (2, 5, 6)
            ) AS prm ON TRUE
            WHERE
                prm.count > 0
                AND p.user_uuid = %(user_uuid)s::UUID
                AND p.event_uuid = %(event_uuid)s::UUID;
        """)
        sql_parameters = {
            'user_uuid': user_uuid,
            'event_uuid': cloud_account_owner_uuid
        }

    elif cloud_account_owner_type == 'team':
        sql_statement = (f"""
            -- Return > 0 if user_uuid is in active role for team
            SELECT
                end_result.count
            FROM
                (
                    SELECT
                        COUNT(*) AS count
                    FROM
                        sr.participant AS p
                    LEFT JOIN LATERAL (
                        SELECT
                            tm.participant_uuid,
                            tm.team_uuid,
                            tm.team_member_uuid
                        FROM
                            sr.team_member AS tm
                        WHERE
                            p.participant_uuid = tm.participant_uuid
                    ) AS tm ON
                    TRUE
                    LEFT JOIN LATERAL (
                        SELECT
                            COUNT(tmrm)
                        FROM
                            sr.team_member_role_member AS tmrm
                        WHERE
                            tm.team_member_uuid = tmrm.team_member_uuid
                            AND tmrm.team_member_role_id IN (1, 2)
                    ) AS tmrm ON
                    TRUE
                    WHERE
                        tmrm.count > 0
                        AND p.user_uuid = %(user_uuid)s::UUID
                        AND tm.team_uuid = %(team_uuid)s::UUID
                )
            AS end_result;
        """)
        sql_parameters = {
            'user_uuid': user_uuid,
            'team_uuid': cloud_account_owner_uuid
        }
    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> user_can_join_account: {error}")
        raise error

    if response and response[0] and response[0] > 0:
        return True
    else:
        return None

'''
    create_cloud_account_user
        Create a Cloud Account User for specified Cloud Account with specified access_level_id
'''
def create_cloud_account_user(user_uuid, cloud_account_uuid, cloud_account_access_level_id=1):
    log.info(':: create_cloud_account_user')

    cloud_account_user_uuid = uuid.uuid4()

    sql_statement = ("""
        -- Create new cloud_account_user
        INSERT
            INTO
            sr.cloud_account_user (
                cloud_account_user_uuid,
                user_uuid,
                cloud_account_uuid
            )
        VALUES (
            %(cloud_account_user_uuid)s::UUID,
            %(user_uuid)s::UUID,
            %(cloud_account_uuid)s::UUID
        );
    """)
    sql_parameters = {
        'cloud_account_user_uuid': cloud_account_user_uuid,
        'user_uuid': user_uuid,
        'cloud_account_uuid': cloud_account_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_cloud_account_user: {error}")
        return return_error(500, error)

    try:
        incr_key_prefix('cloud_account')
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

    # Now add them as an appropriate cloud_account_group_member
    try:
        cloud_account_group = add_user_to_cloud_account_group(cloud_account_user_uuid, cloud_account_uuid, cloud_account_access_level_id)
    except Exception as error:
        log.error(f">> add_user_to_cloud_account_group: {error}")
        try:
            rollback_cloud_account_user(cloud_account_user_uuid, cloud_account_uuid)
        except Exception as error:
            return return_error(500, error)
        return return_error(500, error)

    # Now add the account in AWS
    try:
        cloud_account_id = aws_account_access(cloud_account_group, user_details(user_uuid))
    except Exception as error:
        log.error(f">> create_cloud_account_user: {error}")
        try:
            rollback_cloud_account_user(cloud_account_user_uuid, cloud_account_uuid)
        except Exception as error:
            return return_error(500, error)
        return return_error(500, error)

    # Update the cloud_account_user table with the cloud_account_id
    try:
        update_cloud_account_user_id(cloud_account_user_uuid, cloud_account_id)
    except Exception as error:
        log.error(f">> create_cloud_account_user: {error}")
        return return_error(500, error)

    response_payload = {
        'status_code': 200,
        'cloud_account_user_uuid': str(cloud_account_user_uuid)
    }
    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

'''
    add_user_to_cloud_account_group
        Add the user_uuid to the appropriate cloud_account_group and return cloud_account_group details
'''
def add_user_to_cloud_account_group(cloud_account_user_uuid, cloud_account_uuid, cloud_account_access_level_id=1):
    log.info(':: add_user_to_cloud_account_group')

    cloud_account_group_member_uuid = uuid.uuid4()

    sql_statement = ("""
        -- Add user to cloud_account_group
        INSERT
            INTO
            sr.cloud_account_group_member (
                cloud_account_group_member_uuid,
                cloud_account_user_uuid,
                cloud_account_group_uuid
            )
        VALUES (
            %(cloud_account_group_member_uuid)s::UUID,
            %(cloud_account_user_uuid)s::UUID,
            (
                SELECT
                    cloud_account_group_uuid
                FROM
                    sr.cloud_account_group
                WHERE
                    cloud_account_uuid = %(cloud_account_uuid)s::UUID
                    AND cloud_account_access_level_id = %(cloud_account_access_level_id)s
                LIMIT 1
            )
        );
    """)
    sql_parameters = {
        'cloud_account_group_member_uuid': cloud_account_group_member_uuid,
        'cloud_account_user_uuid': cloud_account_user_uuid,
        'cloud_account_uuid': cloud_account_uuid,
        'cloud_account_access_level_id': int(cloud_account_access_level_id)
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> add_user_to_cloud_account_group: {error}")
        raise error

    try:
        incr_key_prefix('cloud_account_group_member')
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('cloud_account')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

    return assigned_cloud_account_group(str(cloud_account_group_member_uuid))

'''
    user_details
        Return details of a user_uuid
'''
def user_details(user_uuid):
    log.info(':: user_details')

    sql_statement = ("""
        -- Return details of a user
        SELECT
            row_to_json(u) AS user
        FROM
            (
                SELECT
                    user_uuid,
                    email_address,
                    first_name,
                    last_name,
                    organization_uuid,
                    settings
                FROM
                    sr.user
                WHERE
                    user_uuid = %(user_uuid)s::UUID
            ) AS u;
    """)
    sql_parameters = {'user_uuid': user_uuid}

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('user', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> user_details: {error}")
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        cache_query_response('user', hashed_query, payload)

    return json.loads(payload)

'''
    assigned_cloud_account_group
        Return details of cloud_account_user assigned cloud_account_group
'''
def assigned_cloud_account_group(cloud_account_group_member_uuid):
    log.info(':: assigned_cloud_account_group')

    sql_statement = ("""
        -- Return details of cloud_account_group for cloud_account_group_member_uuid
        SELECT
            row_to_json(end_result)
        FROM
            (
                SELECT
                    cag.cloud_account_group_uuid AS cloud_account_group_uuid,
                    cag.cloud_account_uuid AS cloud_account_uuid,
                    cag.cloud_account_group_id AS cloud_account_group_id,
                    cag.cloud_account_group_name AS cloud_account_group_name
                FROM
                    (
                        SELECT
                            cloud_account_group_uuid,
                            cloud_account_uuid,
                            cloud_account_group_id,
                            cloud_account_group_name
                        FROM
                            sr.cloud_account_group
                    ) AS cag
                LEFT JOIN LATERAL (
                    SELECT
                        cloud_account_group_uuid,
                        cloud_account_group_member_uuid
                    FROM
                        sr.cloud_account_group_member
                    WHERE
                        cloud_account_group_uuid = cag.cloud_account_group_uuid
                ) AS cagm ON
                TRUE
                WHERE
                    cagm.cloud_account_group_member_uuid = %(cloud_account_group_member_uuid)s::UUID
            ) AS end_result;
    """)
    sql_parameters = {'cloud_account_group_member_uuid': cloud_account_group_member_uuid}

    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> assigned_cloud_account_group: {error}")
        raise error

    if response and response[0]:
        return response[0]
    else:
        return None

'''
    update_cloud_account_user_id
        Add the cloud_account_user_id to the cloud_account_user_uuid
'''
def update_cloud_account_user_id(cloud_account_user_uuid, cloud_account_user_id):
    log.info(':: update_cloud_account_user_id')

    sql_statement = ("""
        -- Update cloud_account_user_id for cloud_account_user_uuid
        UPDATE
            sr.cloud_account_user
        SET
            cloud_account_user_id = %(cloud_account_user_id)s
        WHERE
            cloud_account_user_uuid = %(cloud_account_user_uuid)s::UUID;
    """)
    sql_parameters = {
        'cloud_account_user_id': cloud_account_user_id,
        'cloud_account_user_uuid': cloud_account_user_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_cloud_account_user_id: {error}")
        raise error

    try:
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('cloud_account_group_member')
        incr_key_prefix('cloud_account_group')
        incr_key_prefix('cloud_account')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

'''
    rollback_cloud_account_user
        Delete all of the inserts/updates if a previous step failed
'''
def rollback_cloud_account_user(cloud_account_user_uuid, cloud_account_uuid):
    log.info(':: rollback_cloud_account_user')

    sql_statement_1 = ("""
        -- Remove user from cloud_account_group_member
        DELETE
        FROM
            sr.cloud_account_group_member
        WHERE
            cloud_account_user_uuid = %(cloud_account_user_uuid)s::UUID
            AND cloud_account_group_uuid =
            (
                SELECT
                    cloud_account_group_uuid
                FROM
                    sr.cloud_account_group
                WHERE
                    cloud_account_uuid = %(cloud_account_uuid)s::UUID
                LIMIT 1
            );
    """)
    sql_statement_2 = ("""
        -- Delete cloud_account_user
        DELETE
        FROM
            sr.cloud_account_user
        WHERE
            cloud_account_user_uuid = %(cloud_account_user_uuid)s::UUID
            AND cloud_account_uuid = %(cloud_account_uuid)s::UUID
        ;
    """)
    sql_parameters = {
        'cloud_account_user_uuid': cloud_account_user_uuid,
        'cloud_account_uuid': cloud_account_uuid
    }
    log.debug(sql_statement_1)
    log.debug(sql_statement_2)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement_1, sql_parameters)
                cur.execute(sql_statement_2, sql_parameters)
    except Exception as error:
        log.error(f">> rollback_cloud_account_user: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('cloud_account')
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('cloud_account_group')
        incr_key_prefix('cloud_account_group_member')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

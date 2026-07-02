import botocore.exceptions
import hashlib
import json
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.aws_account_access import delete_cloud_user

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_cloud_account_user
        Check user_uuid assignment to configured cloud_account and remove user access
'''
def process_cloud_account_user(payload_json):
    log.info(':: process_cloud_account_user')

    user_uuid = user_uuid_from_team_member_uuid(str(payload_json['cloud_account_user']['team_member_uuid']))
    if not user_uuid:
        return return_error(500, 'Team member not found')

    if 'team_uuid' in payload_json['cloud_account_user']:
        cloud_account_owner_uuid = str(payload_json['cloud_account_user']['team_uuid'])
    elif 'event_uuid' in payload_json['cloud_account_user']:
        cloud_account_owner_uuid = str(payload_json['cloud_account_user']['event_uuid'])
    else:
        return return_error(500, 'Malformed request')

    try:
        assigned_accounts = assigned_cloud_accounts(cloud_account_owner_uuid)
    except Exception as error:
        return return_error(503, error)

    if assigned_accounts != '[]':
        try:
            return delete_cloud_account_user(user_uuid, assigned_accounts)
        except Exception as error:
            log.error(f">> process_cloud_account_user: {error}")
            return return_error(503, error)
    else:
        return return_error(500, 'No available cloud account exists')

'''
    assigned_cloud_accounts
        Return all cloud_account_uuids of an assigned cloud_accounts for cloud_account_owner_uuid
'''
def assigned_cloud_accounts(cloud_account_owner_uuid):
    log.info(':: assigned_cloud_accounts')

    sql_statement = ("""
        -- Return account_uuids of cloud_accounts if one exists
        SELECT
            ARRAY
                (
                    SELECT
                        cloud_account_uuid
                    FROM
                        sr.cloud_account
                    WHERE
                        cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID
                ) AS accounts;
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
            log.error(f">> assigned_cloud_accounts: {error}")
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        cache_query_response('cloud_account', hashed_query, payload)

    return payload

'''
    delete_cloud_account_user
        Delete a Cloud Account User specified Cloud Accounts
'''
def delete_cloud_account_user(user_uuid, cloud_accounts):
    log.info(':: delete_cloud_account_user')

    # We first need to remove the user from the cloud_account_group table
    try:
        # Postgres needs the array to be in the form of {uuid1,uuid2} and not ['uuid1','uuid2']
        cloud_account_array = cloud_accounts.replace('[','{').replace(']','}').replace("'","")
        delete_user_from_cloud_account_groups(user_uuid, cloud_account_array)
    except Exception as error:
        log.error(f">> delete_cloud_account_user: {error}")
        raise error

    # Now delete the user from the cloud_account_user table
    sql_statement = (f"""
        -- Delete a cloud_account_user
        DELETE
            FROM
                sr.cloud_account_user
            WHERE
                user_uuid = %(user_uuid)s::UUID
                AND cloud_account_uuid = ANY(%(cloud_accounts)s::UUID[])
            RETURNING
                cloud_account_user_id;
    """)
    log.debug(sql_statement)
    sql_parameters = {
        'user_uuid': user_uuid,
        'cloud_accounts': cloud_account_array
    }
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> delete_cloud_account_user: {error}")
        return return_error(500, error)

    if response and response[0]:
        cloud_account_user_id = response[0]
    else:
        cloud_account_user_id = None

    try:
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('cloud_account_group')
        incr_key_prefix('cloud_account')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

    if not cloud_account_user_id or cloud_account_user_id is None:
        log.info(f':: cloud_account_user does not exist')
        return return_error(200, 'No Cloud Account User exists')

    # Now delete the account from AWS
    try:
        delete_cloud_user(cloud_account_user_id, user_details(user_uuid), cloud_accounts)
    except Exception as error:
        log.error(f">> delete_cloud_account_user: {error}")
        return return_error(500, error)

    response_payload = {
        'status_code': 200,
        'user_uuid': str(user_uuid),
        'cloud_account_user_id': str(cloud_account_user_id)
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
    delete_user_from_cloud_account_groups
        Delete the user_uuid to the appropriate cloud_account_groups and return cloud_account_groups details
'''
def delete_user_from_cloud_account_groups(user_uuid, cloud_accounts):
    log.info(':: delete_user_from_cloud_account_groups')

    sql_statement = ("""
        -- Delete User from cloud_account_group table
        DELETE
        FROM
            sr.cloud_account_group_member
        WHERE
            cloud_account_user_uuid = ANY(
                ARRAY(
                    SELECT
                        cloud_account_user_uuid
                    FROM
                        sr.cloud_account_user
                    WHERE
                        user_uuid = %(user_uuid)s::UUID
                        AND cloud_account_uuid = ANY(%(cloud_accounts)s::UUID[])
                )::UUID[]
            )
        RETURNING *; 
    """)
    sql_parameters = {
        'user_uuid': user_uuid,
        'cloud_accounts': cloud_accounts
    }
    log.debug(sql_statement)
    log.debug(sql_parameters)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> delete_user_from_cloud_account_groups: {error}")
        raise error

    try:
        incr_key_prefix('cloud_account_group_member')
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('cloud_account')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

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

    log.debug(f':: payload type: {type(payload)}')
    return json.loads(payload)

'''
    user_uuid_from_team_member_uuid
        Return the user_uuid when given team_member_uuid
'''
def user_uuid_from_team_member_uuid(team_member_uuid):
    log.info(':: user_uuid_from_team_member_uuid')

    sql_statement = (f"""
    -- Get user_uuid from team_member_uuid
    SELECT
        u.user_uuid
    FROM
        (
            SELECT
                participant_uuid
            FROM
                sr.team_member
            WHERE
                team_member_uuid = %(team_member_uuid)s::UUID
        ) AS p
            LEFT JOIN LATERAL (
                SELECT
                    user_uuid
                FROM
                    sr.participant
                WHERE
                    participant_uuid = p.participant_uuid
            ) AS u
            ON TRUE;
    """)
    log.debug(sql_statement)

    sql_parameters = {'team_member_uuid': team_member_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team_member', hashed_query)
    if cached_data:
        log.info(':: user_uuid_from_team_member_uuid: Using cached data')
        return cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> user_uuid_from_team_member_uuid: {error}")
            return None

        if response and response[0]:
            user_uuid = response[0]
        else:
            user_uuid = None

        cache_query_response('team_member', hashed_query, user_uuid)

        return user_uuid

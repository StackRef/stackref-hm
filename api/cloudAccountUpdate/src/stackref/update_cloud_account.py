from datetime import datetime
import json
import logging
import psycopg
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.aws_account_access import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    assign_cloud_account
        Assign an available Cloud Account to an entity_uuid and return its details
'''
def assign_cloud_account(payload_json):
    log.info(":: assign_cloud_account")

    entity_uuid = str(payload_json['cloud_account']['entity_uuid'])

    try:
        cloud_account_uuid = str(available_cloud_account())
        if not cloud_account_uuid:
            log.error('>> No available cloud accounts for provider')
            return return_error('No available cloud accounts for provider')
    except Exception as error:
        log.error(f'>> {error}')
        return return_error(error)

    # First deal with AWS

    try:
        remove_deny_all_policy(cloud_account_uuid)
    except Exception as error:
        log.error(f'>> assign_cloud_account: {error}')
        raise error

    # Now modify our database

    sql_statement = ("""
        -- Assign Cloud Account
        UPDATE
            sr.cloud_account
        SET
            cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID,
            cloud_account_status_id = 4,
            ts_modified = NOW()
        WHERE
            cloud_account_uuid = %(cloud_account_uuid)s::UUID
            AND cloud_account_status_id = 1
        RETURNING
            json_build_object(
                'cloud_account_uuid', cloud_account_uuid,
                'cloud_account_cloud_id', cloud_account_cloud_id,
                'cloud_account_name', cloud_account_name,
                'cloud_account_owner_uuid', cloud_account_owner_uuid
            );
    """)
    sql_parameters = {
        'cloud_account_owner_uuid': entity_uuid,
        'cloud_account_uuid': cloud_account_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> assign_cloud_account: {error}")
        return return_error(503, error)

    try:
        incr_key_prefix('cloud_account')
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

    if response and response[0]:
        payload = json.dumps(response[0])
    else:
        payload = '[]'

    log.debug(payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

'''
    unassign_cloud_account
        Unassign a Cloud Account from an entity_uuid and return its details
'''
def unassign_cloud_account(payload_json):
    log.info(":: unassign_cloud_account")

    entity_uuid = str(payload_json['cloud_account']['entity_uuid'])

    if 'cloud_account_uuid' in payload_json['cloud_account']:
        cloud_account_uuid = payload_json['cloud_account']['cloud_account_uuid']
    else:
        cloud_account_uuid = assigned_cloud_account(entity_uuid)

    # First deal with AWS

    try:
        add_deny_all_policy(cloud_account_uuid)
        cloud_account_groups = get_cloud_account_groups(cloud_account_uuid)
        if cloud_account_groups:
            for cloud_account_group in cloud_account_groups:
                remove_users_from_group(cloud_account_group)
    except Exception as error:
        log.error(f'>> unassign_cloud_account: {error}')
        raise error

    # Now modify our database

    sql_statement_1 = (f"""
        -- Remove Users from cloud_account_group table
        DELETE
            FROM
                sr.cloud_account_group_member
            WHERE
                cloud_account_group_uuid =
                    (
                        SELECT
                            cloud_account_group_uuid
                        FROM
                            sr.cloud_account_group
                        WHERE
                            cloud_account_uuid = %(cloud_account_uuid)s::UUID
                    )::UUID;
    """)
    sql_statement_2 = (f"""
        -- Unassign Cloud Account(s)
        WITH cloud_accounts AS (
            UPDATE
                sr.cloud_account
            SET
                cloud_account_status_id = (
                        SELECT
                            cloud_account_status_id
                        FROM
                            sr.cloud_account_status
                        WHERE
                            cloud_account_status_name = 'Hold'
                ),
                ts_modified = NOW()
            WHERE
                cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID
                AND cloud_account_uuid = %(cloud_account_uuid)s::UUID
            RETURNING
                cloud_account_uuid,
                cloud_account_cloud_id,
                cloud_account_name
        )
        SELECT
            json_agg(row_to_json(cloud_accounts)) AS cloud_accounts
        FROM
            cloud_accounts;
    """)
    sql_parameters = {
        'cloud_account_owner_uuid': entity_uuid,
        'cloud_account_uuid': cloud_account_uuid
    }
    log.debug(sql_statement_1)
    log.debug(sql_statement_2)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement_1, sql_parameters)
                cur.execute(sql_statement_2, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> unassign_cloud_account: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('cloud_account')
        incr_key_prefix('cloud_account_group')
        incr_key_prefix('cloud_account_group_member')
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

    if response and response[0]:
        payload = json.dumps(response[0])
    else:
        payload = '[]'

    log.debug(payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

'''
    account_owner_type
        Return the entity_type value of the Cloud Account entity_uuid
'''
def account_owner_type(account_owner_uuid):
    log.info(':: account_owner_type')

    sql_statement = ("""
        -- Return Cloud cloud_account_owner_type
        SELECT
            cloud_account_owner_type::VARCHAR
        FROM
            sr.cloud_account
        WHERE
            cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID
        LIMIT 1;
    """)

    sql_parameters = {'cloud_account_owner_uuid': account_owner_uuid}

    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> account_owner_type: {error}")
        raise error

    if response and response[0]:
        return response[0]
    else:
        return None

'''
    available_cloud_account
        Return the account_uuid of an available and usable Cloud Account of the given
        account_provider_id
'''
def available_cloud_account(account_provider_id=1):
    log.info(":: available_cloud_account")

    sql_parameters = {'cloud_account_provider_id': account_provider_id}

    sql_statement = ("""
        -- Retrieve cloud_account_uuid of one available cloud account
        SELECT
            cloud_account_uuid
        FROM
            sr.cloud_account
        WHERE
            cloud_account_status_id = (
                SELECT
                    cloud_account_status_id
                FROM
                    sr.cloud_account_status
                WHERE
                    cloud_account_status_name = 'Ready'
            ) AND
            cloud_account_provider_id = %(cloud_account_provider_id)s AND
            cloud_account_uuid != UUID('00000000-0000-0000-0000-000000000000')
        LIMIT 1;
    """)
    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> available_cloud_account: {error}")
        raise error

    if response and response[0]:
        return response[0]
    else:
        return None

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

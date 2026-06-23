import json
import logging
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
    unassign_cloud_accounts
        Unassign all Cloud Accounts from an entity_uuid and return its details
'''
def unassign_cloud_accounts(event_uuid):
    log.info(":: unassign_cloud_accounts")

    cloud_accounts = event_cloud_accounts(event_uuid)
    response = None

    for cloud_account in cloud_accounts:
        cloud_account_uuid = cloud_account['cloud_account_uuid']
        cloud_account_owner_uuid = cloud_account['cloud_account_owner_uuid']

        # First deal with AWS
        try:
            add_deny_all_policy(cloud_account_uuid)
            cloud_account_groups = get_cloud_account_groups(cloud_account_uuid)
            if cloud_account_groups:
                for cloud_account_group in cloud_account_groups:
                    remove_users_from_group(cloud_account_group)
        except Exception as error:
            log.error(f'>> unassign_cloud_accounts: {error}')
            raise error

        # Now modify our database
        sql_statement_1 = ("""
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
        sql_statement_2 = ("""
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
            'cloud_account_owner_uuid': cloud_account_owner_uuid,
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
            log.error(f">> unassign_cloud_accounts: {error}")
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

'''
    event_cloud_accounts
        Return array of cloud accounts assigned to teams in the Event
'''
def event_cloud_accounts(event_uuid):
    log.info(':: event_cloud_accounts')

    sql_statement = ("""
        -- Return array of cloud_accounts assigned to Event Teams
        SELECT
            json_agg(row_to_json(ca)) AS cloud_accounts
        FROM
            (
                SELECT
                    cloud_account_uuid,
                    cloud_account_owner_uuid
                FROM
                    sr.cloud_account
                WHERE
                    cloud_account_owner_uuid = ANY(
                        SELECT
                            team_uuid
                        FROM
                            sr.team
                        WHERE
                            event_uuid = %(event_uuid)s::UUID
                    )
            ) AS ca; 
    """)
    sql_parameters = {'event_uuid': event_uuid}

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('cloud_account', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        response = None
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> assign_cloud_account: {error}")
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        cache_query_response('cloud_account', hashed_query, payload)

        return json.loads(payload)

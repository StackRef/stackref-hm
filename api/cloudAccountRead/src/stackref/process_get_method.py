import botocore.exceptions
import hashlib
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_get_method
        Process GET method requests
'''
def process_get_method(event):
    log.info(":: process_get_method")

    entity_uuid = None

    # For now we only allow querying specific UUIDs
    if 'x-sr-entity-uuid' in event['headers']:
        entity_uuid = event['headers']['x-sr-entity-uuid']
    elif 'queryStringParameters' in event and 'entity_uuid' in event['queryStringParameters']:
        entity_uuid = event['queryStringParameters']['entity_uuid']

    if not entity_uuid:
        return return_error(500, 'Malformed request')

    owner_type = account_owner_type(entity_uuid)
    if not owner_type:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': f'{{"message":"No accounts found for {entity_uuid}"}}'
        }

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    log.debug(f":: owner_type: {owner_type}")

    if owner_type == 'team':
        authorized = (
            'platform_read' in grants,
            len(get_team_member_grants(get_user_uuid(event), entity_uuid)) > 0
        )
        if not any(authorized):
            return return_error(401, "Not authorized")

    sql_parameters = {
        'cloud_account_owner_uuid': entity_uuid,
        'cloud_account_owner_type': owner_type
    }

    log.debug(f":: sql_parameters: {sql_parameters}")

    sql_statement = (f"""
        -- Retrieve cloud account(s) and its users
        SELECT
            json_agg(row_to_json(cloud_accounts))
        FROM
            (
                SELECT
                    ca.cloud_account_uuid,
                    ca.cloud_account_cloud_id,
                    ca.cloud_account_provider_id,
                    ca.cloud_account_name,
                    ca.cloud_account_status_id,
                    cau.cloud_account_users
                FROM
                    (
                        SELECT
                            cloud_account_uuid,
                            cloud_account_cloud_id,
                            cloud_account_provider_id,
                            cloud_account_name,
                            cloud_account_status_id
                        FROM
                            sr.cloud_account
                        WHERE
                            cloud_account_status_id != 999
                            AND cloud_account_owner_type = (%(cloud_account_owner_type)s)::sr.cloud_account_owner_type
                            AND cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID
                    ) AS ca
                LEFT JOIN LATERAL (
                    SELECT
                        json_agg(row_to_json(cloud_account_users)) AS cloud_account_users
                    FROM
                        (
                            SELECT
                                user_uuid
                            FROM
                                sr.cloud_account_user AS cau
                            WHERE
                                cau.cloud_account_uuid = ca.cloud_account_uuid
                        ) AS cloud_account_users
                ) AS cau ON
                TRUE
            ) AS cloud_accounts;
    """)
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
            log.error(f">> process_get_method: {error}")
            return return_error(503, error)

        if response:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('cloud_account', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

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
        -- Return Cloud account_owner_type
        SELECT
            cloud_account_owner_type::VARCHAR
        FROM
            sr.cloud_account
        WHERE
            cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID
        LIMIT 1;
    """)

    sql_parameters = {'cloud_account_owner_uuid': account_owner_uuid}
    log.debug(f":: sql_parameters: {sql_parameters}")
    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> account_owner_type: {error}")
        return return_error(503, error)

    if not response:
        return None
    else:
        return response[0]

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

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    sql_parameters = []

    try:
        entity_type = bank_entity_type(entity_uuid)
    except Exception as error:
        return return_error(500, 'bank_entity_type')

    # No bank account exists
    if entity_type == 'notfound':
        return {
            'statusCode': 204,
            'headers': {
                'Content-Type': 'application/json'
            }
        }

    authorized = (
        'platform_read' in grants,
        entity_type == 'organization' and 'bank_read' in grants,
        entity_type == 'event' and (
            'event_read' in grants or
            len(get_participant_grants(get_user_uuid(event), entity_uuid)) > 0
        ),
        entity_type == 'team' and (
            'team_read' in grants or
            len(get_team_member_grants(get_user_uuid(event), entity_uuid)) > 0
        )
    )
    if not any(authorized):
        return return_error(401, "Not authorized")

    sql_statement = (f"""
        SELECT
            bank_transactions
        FROM
            sr.fn_bank_transactions(%(entity_uuid)s::UUID);
    """)
    log.debug(sql_statement)

    sql_parameters = {'entity_uuid': entity_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('coin_ledger', hashed_query)
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
            return return_error(500, error)

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('coin_ledger', hashed_query, payload, 1)
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
    bank_entity_type
        Return the entity_type value of the Coin Bank entity_uuid
'''
def bank_entity_type(entity_uuid):
    log.info(':: bank_entity_type')

    sql_statement = ("""
        -- Return Coin Bank entity_type
        SELECT
            entity_type::VARCHAR
        FROM
            sr.fn_entity_type(%(entity_uuid)s::UUID);
    """)

    sql_parameters = {'entity_uuid': entity_uuid}

    log.debug(sql_statement)
    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('entity_type', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> bank_entity_type: {error}")
            raise error 

        if response and response[0]:
            payload = response[0]
        else:
            payload = 'notfound'

        try:
            if payload != 'notfound':
                cache_query_response('entity_type', hashed_query, payload, 30)
        except:
            log.error(f">> cache_query_response")

    return payload

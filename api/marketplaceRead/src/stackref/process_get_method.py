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

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    if not 'event_read' in grants:
        return return_error(401, "Not authorized")

    sql_statement = ("""
        -- Retrieve Marketplace items and details
        SELECT
            json_agg(row_to_json(mp))
        FROM
            (
                SELECT
                    marketplace_item_id,
                    marketplace_item_name,
                    marketplace_item_description,
                    marketplace_item_type_id,
                    (
                        SELECT
                            marketplace_item_type_name
                        FROM
                            sr.marketplace_item AS mi,
                            sr.marketplace_item_type AS mit
                        WHERE
                            mi.marketplace_item_id = mit.marketplace_item_type_id
                    ) AS marketplace_item_type_name,
                    stackcash_cost
                FROM
                    sr.marketplace_item
            ) AS mp;
    """)
    log.debug(sql_statement)
    sql_parameters = {}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('marketplace', hashed_query)
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

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('marketplace', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

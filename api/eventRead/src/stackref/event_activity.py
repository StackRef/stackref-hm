import hashlib
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    event_activity
        Return paginated Event activity log
'''
def event_activity(event_uuid, offset=0, count=25):
    log.info(":: event_activity")

    sql_parameters = {
        'event_uuid': event_uuid,
        'offset': offset,
        'count': count
    }

    sql_statement = ("""
        -- Retrieve Event activity
        SELECT
            *
        FROM
            sr.fn_event_activity(%(event_uuid)s::UUID, %(offset)s, %(count)s);
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    # TODO: Temp disable so we always get latest activity
    #cached_data = retrieve_query_response('event', hashed_query)
    cached_data = None
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
            log.error(f">> event_activity: {error}")
            return return_error(503, error) 

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        try:
            cache_query_response('event', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

import hashlib
import logging

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

    organization_uuid = None
    event_uuid = None
    judging_criterion_uuid = None

    if 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']
    if 'x-sr-event-uuid' in event['headers'] and event['headers']['x-sr-event-uuid'] != "undefined":
        event_uuid = event['headers']['x-sr-event-uuid']
    elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
        event_uuid = event['queryStringParameters']['event_uuid']
    if 'x-sr-judging-criterion-uuid' in event['headers'] and event['headers']['x-sr-judging-criterion-uuid'] != "undefined":
        judging_criterion_uuid = event['headers']['x-sr-judging-criterion-uuid']
    elif 'queryStringParameters' in event and 'judging_criterion_uuid' in event['queryStringParameters']:
        judging_criterion_uuid = event['queryStringParameters']['judging_criterion_uuid']

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    if event_uuid:
        if 'event_read' in grants:
            return get_judging_criterion(organization_uuid, event_uuid, judging_criterion_uuid)
        else:
            return return_error(401, "Not authorized")
    elif organization_uuid:
        if 'organization_read' in grants:
            return get_judging_criterion(organization_uuid, event_uuid, judging_criterion_uuid)
        else:
            return return_error(401, "Not authorized")
    else:
        return return_error(500, 'Malformed request')

'''
    get_judging_criterion
        Return the judging criterion defined for the organization_uuid and/or event_uuid
        and/or judging_criterion_uuid
'''
def get_judging_criterion(organization_uuid, event_uuid, judging_criterion_uuid):

    where_clause = 'AND jc.judging_criterion_status_id = 1'

    sql_parameters = {'organization_uuid': organization_uuid}

    if event_uuid:
        where_clause += ' AND event_uuid = %(event_uuid)s::UUID'
        sql_parameters['event_uuid'] = event_uuid

    if judging_criterion_uuid:
        where_clause += ' AND judging_criterion_uuid = %(judging_criterion_uuid)s::UUID'
        sql_parameters['judging_criterion_uuid'] = judging_criterion_uuid

    sql_statement = (f"""
        -- Retrieve judging criterion
        SELECT
            json_agg(row_to_json(criterion))
        FROM
            (
                SELECT
                    jc.judging_criterion_uuid,
                    jc.event_uuid,
                    jc.criterion_weight,
                    jc.judging_criterion_status_id,
                    jcs.judging_criterion_status_name,
                    jc.judging_criterion_category_id,
                    jcc.judging_criterion_category_name,
                    jcc.judging_criterion_category_icon,
                    jc.criterion_details,
                    (
                        SELECT
                            json_agg(row_to_json(x))
                        FROM
                            (
                                SELECT
                                    judging_criterion_status_id,
                                    judging_criterion_status_name
                                FROM
                                    sr.judging_criterion_status
                            ) x
                    ) AS judging_criterion_statuses,
                    (
                        SELECT
                            json_agg(row_to_json(x))
                        FROM
                            (
                                SELECT
                                    judging_criterion_category_id,
                                    judging_criterion_category_name,
                                    judging_criterion_category_icon
                                FROM
                                    sr.judging_criterion_category
                            ) x
                    ) AS judging_criterion_categories
                FROM
                    sr.judging_criterion AS jc
                LEFT JOIN sr.judging_criterion_status jcs ON
                    jc.judging_criterion_status_id = jcs.judging_criterion_status_id
                LEFT JOIN sr.judging_criterion_category jcc ON
                    jc.judging_criterion_category_id = jcc.judging_criterion_category_id
                WHERE
                    organization_uuid = %(organization_uuid)s::UUID
                    {where_clause}
            ) criterion; 
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('judging_criterion', hashed_query)
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
            log.error(f">> get_judging_criterion: {error}")
            return return_error(503, error) 

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('judging_criterion', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

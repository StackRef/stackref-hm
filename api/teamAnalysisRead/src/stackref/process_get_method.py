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

    team_uuid = None

    if 'x-sr-team-uuid' in event['headers'] and event['headers']['x-sr-team-uuid'] != "undefined":
        team_uuid = event['headers']['x-sr-team-uuid']
    elif 'queryStringParameters' in event and 'team_uuid' in event['queryStringParameters']:
        team_uuid = event['queryStringParameters']['team_uuid']

    if not team_uuid:
        return return_error(500, "Malformed request")

    user_uuid = get_user_uuid(event)
    grants = get_user_grants(user_uuid,get_organization_uuid(event)) + get_be_auth0_scope(event)

    sql_parameters = {'team_uuid': team_uuid}

    # Check if requester's grant permits either:
    #   - Able to read all Teams in the Event (team_read)
    #   - Is a Participant in the queried Event
    # TODO: May need to instead make sure scores are viewable by other teams when allowed or set to viewable somehow
    authorized = (
        'team_read' in grants,
        len(get_participant_grants(user_uuid, get_event_by_team(team_uuid))) > 0
    )
    if not any(authorized):
        return return_error(401, "Not authorized")

    sql_statement = ("""
        -- Retrieve most recent Team analysis results per unique result source
        SELECT
            json_agg(row_to_json(tar)) AS team_analysis_results
        FROM
            (
                SELECT
                    tar1.team_analysis_result_uuid,
                    tar1.team_analysis_result_source,
                    tar1.ts_created,
                    tar1.team_analysis_result_json
                FROM
                    sr.team_analysis_result tar1
                INNER JOIN (
                    SELECT
                        team_analysis_result_source, MAX(ts_modified) AS max_modified
                    FROM
                        sr.team_analysis_result
                    WHERE
                        team_uuid = %(team_uuid)s
                    GROUP BY team_analysis_result_source
                ) tar2
                ON tar1.team_analysis_result_source = tar2.team_analysis_result_source
                AND tar1.ts_modified = tar2.max_modified
            ) AS tar;
    """)

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team_analysis_result', hashed_query)
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
            cache_query_response('team_analysis_result', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

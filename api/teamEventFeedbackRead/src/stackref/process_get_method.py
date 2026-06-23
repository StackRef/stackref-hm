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

    participant_uuid = None
    team_uuid = None
    event_uuid = None

    if 'x-sr-participant-uuid' in event['headers'] and event['headers']['x-sr-participant-uuid'] != "undefined":
        participant_uuid = event['headers']['x-sr-participant-uuid']
    elif 'queryStringParameters' in event and 'participant_uuid' in event['queryStringParameters']:
        participant_uuid = event['queryStringParameters']['participant_uuid']
    if 'x-sr-team-uuid' in event['headers'] and event['headers']['x-sr-team-uuid'] != "undefined":
        team_uuid = event['headers']['x-sr-team-uuid']
    elif 'queryStringParameters' in event and 'team_uuid' in event['queryStringParameters']:
        team_uuid = event['queryStringParameters']['team_uuid']
    if 'x-sr-event-uuid' in event['headers'] and event['headers']['x-sr-event-uuid'] != "undefined":
        event_uuid = event['headers']['x-sr-event-uuid']
    elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
        event_uuid = event['queryStringParameters']['event_uuid']

    user_uuid = get_user_uuid(event)
    grants = get_user_grants(user_uuid,get_organization_uuid(event)) + get_be_auth0_scope(event)

    where_clause = 'WHERE 1=1'
    sql_parameters = {}

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

    # Only allow Users or BE with 'team_read' access to see all Team feedback
    if not participant_uuid and 'team_read' not in grants:
        return return_error(401, "Not authorized")
    if not team_uuid and 'event_read' not in grants:
        return return_error(401, "Not authorized")

    if participant_uuid:
        where_clause += ' AND participant_uuid = %(participant_uuid)s::UUID'
        sql_parameters['participant_uuid'] = participant_uuid

    if team_uuid:
        where_clause += ' AND team_uuid = %(team_uuid)s::UUID'
        sql_parameters['team_uuid'] = team_uuid

    if event_uuid:
        where_clause += ' AND event_uuid = %(event_uuid)s::UUID'
        sql_parameters['event_uuid'] = event_uuid

    sql_statement = (f"""
        -- Retrieve Team or Event feedback items
        SELECT
            json_agg(row_to_json(team_event_feedback)) AS team_event_feedback
        FROM
            (
                SELECT
                    team_event_feedback_uuid,
                    participant_uuid,
                    event_uuid,
                    team_uuid,
                    feedback_text
                FROM
                    sr.team_event_feedback
                {where_clause}
            ) AS team_event_feedback;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team_event_feedback', hashed_query)
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
            cache_query_response('team_event_feedback', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

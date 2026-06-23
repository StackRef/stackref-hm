import botocore.exceptions
import hashlib
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *
from stackref.get_user_participants import get_user_participants

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
    user_uuid = None
    where_clause = ''
    sql_parameters = {}

    if 'x-sr-user-uuid' in event['headers']:
        user_uuid = event['headers']['x-sr-user-uuid']
    elif 'queryStringParameters' in event and 'user_uuid' in event['queryStringParameters']:
        user_uuid = event['queryStringParameters']['user_uuid']

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    authorization = (
        'event_read' in grants,
        len(get_participant_grants(get_user_uuid(event), event_uuid)) > 0
    )
    if not any(authorization):
        return return_error(401, "Not authorized")

    if 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']

    if 'x-sr-event-uuid' in event['headers']:
        event_uuid = event['headers']['x-sr-event-uuid']
    elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
        event_uuid = event['queryStringParameters']['event_uuid']

    if user_uuid:
        if 'event_read' in grants or get_user_uuid(event) == user_uuid:
            return get_user_participants(user_uuid, event_uuid)
        else:
            return return_error(401, 'Not authorized')
    elif organization_uuid:
        # Only allow Users or BE with 'platform_read' access to see all Organization Participants
        if 'event_read' not in grants:
            return return_error(401, "Not authorized")
        where_clause = 'AND organization_uuid = %(organization_uuid)s::UUID'
        sql_parameters['organization_uuid'] = organization_uuid
    elif event_uuid:
        authorization = (
            'event_read' in grants,
            len(get_participant_grants(get_user_uuid(event), event_uuid)) > 0
        )
        if not any(authorization):
            return return_error(401, "Not authorized")
        where_clause = 'AND event_uuid = %(event_uuid)s::UUID'
        sql_parameters['event_uuid'] = event_uuid
    else:
        return return_error(400, "Missing parameters")

    sql_statement = (f""" 
        -- Retrieve Participant(s)
        SELECT
            json_agg(row_to_json(participants)) AS participants
        FROM
            (
                SELECT
                    e1.participant_uuid AS participant_uuid,
                    e1.user_uuid AS user_uuid,
                    e1.event_uuid AS event_uuid,
                    e1.is_active AS is_active,
                    e1.first_name AS first_name,
                    e1.last_name AS last_name,
                    e1.email_address AS email_address,
                    e1.ts_last_login AS ts_last_login,
                    e1.tags AS user_tags,
                    e2.participant_roles AS participant_roles,
                    e3.participant_teams AS participant_teams
                FROM
                    (
                        SELECT
                            p.participant_uuid,
                            p.user_uuid,
                            p.event_uuid,
                            p.is_active,
                            u.first_name,
                            u.last_name,
                            u.email_address,
                            u.ts_last_login,
                            u.tags
                        FROM
                            sr.participant AS p
                        LEFT JOIN sr.user u ON
                            p.user_uuid = u.user_uuid
                        WHERE 1=1
                            {where_clause}
                    ) AS e1
                LEFT JOIN LATERAL (
                        SELECT
                            json_agg(a) AS participant_roles
                        FROM
                            (
                                SELECT
                                    DISTINCT prm.participant_role_id AS participant_role_id,
                                    pr.participant_role_name AS participant_role_name
                                FROM
                                    sr.participant_role_member AS prm
                                LEFT JOIN sr.participant_role pr ON
                                    prm.participant_role_id = pr.participant_role_id
                                WHERE
                                    prm.participant_uuid = e1.participant_uuid
                                    {where_clause}
                            ) AS a
                    ) AS e2 ON
                    TRUE
                LEFT JOIN LATERAL (
                        SELECT
                            json_agg(b) AS participant_teams
                        FROM
                            (
                                SELECT
                                    tm.team_uuid AS team_uuid
                                FROM
                                    sr.team_member AS tm
                                LEFT JOIN sr.participant p ON
                                    p.participant_uuid = tm.participant_uuid
                                WHERE
                                    tm.participant_uuid = e1.participant_uuid
                            ) AS b
                    ) AS e3 ON
                    TRUE
            ) AS participants;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('participant', hashed_query)
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
            log.error(f">> process_get_method: {error}")
            return return_error(503, error)

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('participant', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

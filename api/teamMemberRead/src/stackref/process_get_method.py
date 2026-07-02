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

    event_uuid = None
    team_uuid = None
    where_clause = ''
    sql_parameters = []

    if 'x-sr-team-uuid' in event['headers']:
        team_uuid = event['headers']['x-sr-team-uuid']
    elif 'queryStringParameters' in event and 'team_uuid' in event['queryStringParameters']:
        team_uuid = event['queryStringParameters']['team_uuid']

    if not team_uuid:
        return return_error(500, 'team_uuid not set')

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    authorization = (
        'event_read' in grants,
        len(get_team_member_grants(get_user_uuid(event), team_uuid)) > 0
    )
    if not any(authorization):
        return return_error(401, "Not authorized")

    sql_statement = (""" 
        -- Retrieve Team Members
        SELECT
            json_agg(row_to_json(team_members)) AS team_members
        FROM
            (
                SELECT
                    t1.team_member_uuid AS team_member_uuid,
                    t1.team_uuid AS team_uuid,
                    t1.participant_uuid AS participant_uuid,
                    t2.first_name AS first_name,
                    t2.last_name AS last_name,
                    t2.email_address AS email_address,
                    t2.ts_last_login AS ts_last_login,
                    t3.team_member_roles AS team_member_roles
                FROM
                    (
                        SELECT
                            tm.team_member_uuid,
                            tm.team_uuid,
                            tm.participant_uuid
                        FROM
                            sr.team_member AS tm
                        WHERE
                            team_uuid = %(team_uuid)s::UUID
                    ) AS t1
                LEFT JOIN LATERAL (
                        SELECT
                            u.first_name,
                            u.last_name,
                            u.email_address,
                            u.ts_last_login
                        FROM
                            sr.participant AS p
                        LEFT JOIN sr.user u ON
                            p.user_uuid = u.user_uuid
                        WHERE
                            p.participant_uuid = t1.participant_uuid
                    ) AS t2 ON TRUE
                LEFT JOIN LATERAL (
                        SELECT
                            json_agg(team_member_roles) AS team_member_roles
                        FROM
                            (
                                SELECT
                                    DISTINCT tmrm.team_member_role_id AS team_member_role_id,
                                    tmr.team_member_role_name AS team_member_role_name
                                FROM
                                    sr.team_member_role_member AS tmrm
                                LEFT JOIN sr.team_member_role tmr ON
                                    tmrm.team_member_role_id = tmr.team_member_role_id
                                WHERE
                                    tmrm.team_member_uuid = t1.team_member_uuid
                            ) AS team_member_roles
                    ) AS t3 ON TRUE
            ) AS team_members;
    """)
    log.debug(sql_statement)

    sql_parameters = {'team_uuid': team_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team_member', hashed_query)
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
            cache_query_response('team_member', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

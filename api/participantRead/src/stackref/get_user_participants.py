import hashlib
import json
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import cache_query_response, retrieve_query_response

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    get_user_participants
        Return User's Participant information for one or all Events
'''
def get_user_participants(user_uuid, event_uuid=None):
    log.info(":: get_user_participants")

    # TODO: Check that the authenticating user is authorized to read this info

    sql_parameters = {'user_uuid': user_uuid}

    where_clause = ''

    if event_uuid:
        where_clause = "AND event_uuid = %(event_uuid)s::UUID"
        sql_parameters['event_uuid'] = event_uuid

    sql_statement = (f""" 
        -- Retrieve User's Participation for all Events
        SELECT
            json_agg(row_to_json(participants)) AS participants
        FROM
            (
                SELECT
                    e1.participant_uuid AS participant_uuid,
                    e1.event_uuid AS event_uuid,
                    e1.is_active AS is_active,
                    e2.participant_roles AS participant_roles,
                    e3.participant_teams AS participant_teams
                FROM
                    (
                        SELECT
                            participant_uuid,
                            event_uuid,
                            is_active
                        FROM
                            sr.participant
                        WHERE
                            user_uuid = %(user_uuid)s::UUID
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
            log.error(f">> get_user_participants: {error}")
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

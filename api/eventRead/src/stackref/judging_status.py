import hashlib
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    judging_status
        Return judging status for the Event
'''
def judging_status(event_uuid):
    log.info(":: judging_status")

    sql_parameters = {'event_uuid': event_uuid}

    sql_statement = ("""
        -- Retrieve Event Team scoring/judging status
        SELECT
            json_agg(row_to_json(z)) AS teams_scoring_status
        FROM
            (
                (
                    SELECT
                        team_uuid
                    FROM
                        sr.team
                    WHERE
                        event_uuid = %(event_uuid)s::UUID AND
                        team_status_id = (
                            SELECT
                                team_status_id
                            FROM
                                sr.team_status
                            WHERE
                                team_status_name = 'Ready'
                        )
                ) AS team
                LEFT JOIN LATERAL (
                    SELECT
                        json_agg(row_to_json(judging_status)) AS judging_status
                    FROM
                    (
                        (
                            SELECT
                                participant_uuid AS judge_uuid
                            FROM
                                sr.participant AS p
                            WHERE
                                event_uuid = %(event_uuid)s::UUID
                                AND
                                    (
                                        SELECT
                                            1
                                        FROM
                                            sr.participant_role_member AS prm
                                        WHERE
                                            prm.participant_uuid = p.participant_uuid
                                            AND prm.participant_role_id =
                                                (
                                                    SELECT
                                                        participant_role_id
                                                    FROM
                                                        sr.participant_role
                                                    WHERE
                                                        participant_role_name = 'Judge'
                                                )
                                    ) = 1
                        ) AS judge
                        LEFT JOIN LATERAL (
                            SELECT
                                json_agg(row_to_json(tsis)) AS team_score_items
                            FROM
                                (
                                    (
                                        SELECT
                                            judging_criterion_uuid
                                        FROM
                                            sr.judging_criterion AS jc
                                        WHERE
                                            jc.event_uuid = %(event_uuid)s::UUID
                                    ) AS event_judging_criterion
                                    LEFT JOIN LATERAL (
                                        SELECT
                                            team_score_item_uuid,
                                            team_score_item_value
                                        FROM
                                            sr.team_score_item AS tsi
                                        WHERE
                                            tsi.judge_uuid = judge.judge_uuid
                                            AND tsi.judging_criterion_uuid = event_judging_criterion.judging_criterion_uuid
                                            AND tsi.team_uuid = team.team_uuid
                                    ) AS x ON TRUE
                                ) AS tsis
                        ) AS judge_team_scores ON TRUE
                    ) AS judging_status
                ) AS y ON TRUE
            ) AS z;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team_score_item', hashed_query)
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
            log.error(f">> judging_status: {error}")
            return return_error(503, error) 

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('team_score_item', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

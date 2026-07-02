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

    team_uuid = None
    team_score_item_uuid = None
    where_clause = ''

    if 'x-sr-team-uuid' in event['headers'] and event['headers']['x-sr-team-uuid'] != "undefined":
        team_uuid = event['headers']['x-sr-team-uuid']
    elif 'queryStringParameters' in event and 'team_uuid' in event['queryStringParameters']:
        team_uuid = event['queryStringParameters']['team_uuid']
    if 'x-sr-team-score-item-uuid' in event['headers'] and event['headers']['x-sr-team-score-item-uuid'] != "undefined":
        team_score_item_uuid = event['headers']['x-sr-team-score-item-uuid']
    elif 'queryStringParameters' in event and 'team_score_item_uuid' in event['queryStringParameters']:
        team_score_item_uuid = event['queryStringParameters']['team_score_item_uuid']

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

    if team_score_item_uuid:
        where_clause += ' AND tsi.team_score_item_uuid = %(team_score_item_uuid)s::UUID'
        sql_parameters['team_score_item_uuid'] = team_score_item_uuid

    sql_statement = (f"""
        -- Retrieve team score items
        SELECT
            row_to_json(team_scoring_details) AS team_scoring_details
        FROM
            (
                SELECT
                    team_score_items,
                    team_score_category_totals,
                    team_score_total.total_score AS team_score_total
                FROM
                    (
                        SELECT
                            json_agg(row_to_json(team_score_items)) AS team_score_items
                        FROM
                            (
                                SELECT
                                    e1.team_score_item_uuid AS team_score_item_uuid,
                                    e1.team_score_item_value AS team_score_item_value,
                                    e1.judge_uuid,
                                    e1.judging_criterion_uuid AS judging_criterion_uuid,
                                    e1.judging_criterion_details AS judging_criterion_details,
                                    e1.criterion_weight AS judging_criterion_weight,
                                    e1.weighted_score AS weighted_score,
                                    e2.judging_criterion_category_name AS judging_criterion_category_name,
                                    e2.judging_criterion_category_icon AS judging_criterion_category_icon
                                FROM
                                    (
                                        SELECT
                                            tsi.team_score_item_uuid,
                                            tsi.team_score_item_value,
                                            tsi.team_uuid,
                                            tsi.judge_uuid,
                                            jc.judging_criterion_uuid,
                                            jc.judging_criterion_category_id,
                                            jc.criterion_weight,
                                            jc.criterion_weight * tsi.team_score_item_value AS weighted_score,
                                            jc.criterion_details AS judging_criterion_details
                                        FROM
                                            sr.team_score_item AS tsi
                                        LEFT JOIN sr.team AS t ON
                                            t.team_uuid = tsi.team_uuid
                                        LEFT JOIN sr.judging_criterion AS jc ON
                                            jc.judging_criterion_uuid = tsi.judging_criterion_uuid
                                        WHERE
                                            1=1
                                            AND tsi.team_uuid = %(team_uuid)s::UUID
                                        ORDER BY
                                            tsi.team_score_item_uuid
                                    ) AS e1
                                LEFT JOIN LATERAL (
                                    SELECT
                                        jcc.judging_criterion_category_name,
                                        jcc.judging_criterion_category_icon
                                    FROM
                                        sr.judging_criterion_category AS jcc
                                    WHERE
                                        jcc.judging_criterion_category_id = e1.judging_criterion_category_id
                                ) AS e2 ON
                                TRUE
                            ) AS team_score_items
                    ) AS team_score_items,
                    (
                        SELECT
                            json_agg(team_score_category_totals) AS team_score_category_totals
                        FROM
                            (
                                SELECT
                                    *
                                FROM
                                    (
                                        SELECT
                                            jc.judging_criterion_category_id AS judging_criterion_category_id,
                                            COALESCE(SUM(tsi.team_score_item_value),0) AS category_total_score,
                                            COALESCE(SUM(jc.criterion_weight * tsi.team_score_item_value),0) AS category_weighted_total_score
                                        FROM
                                            sr.team_score_item AS tsi
                                        LEFT JOIN sr.judging_criterion AS jc ON
                                            tsi.judging_criterion_uuid = jc.judging_criterion_uuid
                                        WHERE
                                            team_uuid = %(team_uuid)s::UUID
                                            {where_clause}
                                        GROUP BY
                                            jc.judging_criterion_category_id,
                                            criterion_details
                                    ) AS e1
                                    LEFT JOIN LATERAL (
                                        SELECT
                                            jcc.judging_criterion_category_name
                                        FROM
                                            sr.judging_criterion_category AS jcc
                                        WHERE
                                            jcc.judging_criterion_category_id = e1.judging_criterion_category_id
                                    ) AS e2 ON
                                    TRUE
                            ) AS team_score_category_totals
                    ) AS team_score_category_totals,
                    (
                        SELECT
                            COALESCE(SUM(jc.criterion_weight * tsi.team_score_item_value),0) AS total_score
                        FROM
                            sr.team_score_item AS tsi
                        LEFT JOIN sr.judging_criterion AS jc ON
                            jc.judging_criterion_uuid = tsi.judging_criterion_uuid
                        WHERE
                            team_uuid = %(team_uuid)s::UUID
                            {where_clause}
                    ) AS team_score_total
            ) AS team_scoring_details;
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
            log.error(f">> process_get_method: {error}")
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

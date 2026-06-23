import json
import logging
from pydash import get
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.grant_functions import get_event_by_team
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    update_team_score_item
        Create the initial team score from a judge if it does not exist
'''
def update_team_score_item(payload_json):
    log.info(":: update_team_score_item")

    team_score_item_uuid = uuid.uuid4()

    team_score_item_value = float(payload_json['team_score_item']['team_score_item_value'])
    team_uuid = str(payload_json['team_score_item']['team_uuid'])

    sql_parameters = {
        'team_score_item_uuid': team_score_item_uuid,
        'team_uuid': team_uuid,
        'team_score_item_value': team_score_item_value
    }

    # Judge and Judging Criterion values are optional
    # TODO: Only allow non-judges to score without judge_uuid
    # TODO: Check criterion value and be sure we're not exceeding it
    judge_column_name = ''
    judge_column_value = ''
    if 'judge_uuid' in payload_json['team_score_item']:
        judge_uuid = str(payload_json['team_score_item']['judge_uuid'])
        judge_column_name = 'judge_uuid,'
        judge_column_value = '%(judge_uuid)s::UUID,'
        sql_parameters['judge_uuid'] = judge_uuid

    judging_criterion_column_name = ''
    judging_criterion_column_value = ''
    if 'judging_criterion_uuid' in payload_json['team_score_item']:
        judging_criterion_uuid = str(payload_json['team_score_item']['judging_criterion_uuid'])
        judging_criterion_column_name = 'judging_criterion_uuid,'
        judging_criterion_column_value = '%(judging_criterion_uuid)s::UUID,'
        sql_parameters['judging_criterion_uuid'] = judging_criterion_uuid

    sql_statement = (f"""
        -- Create or Update a team score item
        WITH transaction AS
        (
            INSERT
                INTO
                sr.team_score_item (
                    team_score_item_uuid,
                    team_uuid,
                    {judge_column_name}
                    {judging_criterion_column_name}
                    team_score_item_value 
                )
            VALUES (
                %(team_score_item_uuid)s::UUID,
                %(team_uuid)s::UUID,
                {judge_column_value}
                {judging_criterion_column_value}
                %(team_score_item_value)s
            )
            ON
            CONFLICT (team_uuid, judge_uuid, judging_criterion_uuid) DO
            UPDATE
            SET
                team_score_item_value = EXCLUDED.team_score_item_value,
                ts_modified = NOW()
                    RETURNING team_score_item_uuid
        )
        SELECT
            team_score_item_uuid
        FROM
            transaction;
    """)

    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> update_team_score_item: {error}")
        return return_error(503, error) 
    
    if response and response[0]:
        response = response[0]
    else:
        response = ''

    try:
        incr_key_prefix('team')
        incr_key_prefix('team_score_item')
        incr_key_prefix('judging_criterion')
        incr_key_prefix('judging_criterion_category')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        event_uuid = get_event_by_team(team_uuid)
        tator_message = {
            "command": "initializeEventActivity",
            "args": str(event_uuid),
            "type": "command"
        }
        tator_notify(tator_message, str(event_uuid))
    except Exception as error:
        log.error(f'>> update_team_score_item: {error}')

    response_payload = {
        'status_code': 200,
        'team_score_item_uuid': str(response)
    }
    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

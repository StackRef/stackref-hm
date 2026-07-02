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
    update_team_event_feedback
        Create a feedback item for an Event or Team
'''
def update_team_event_feedback(payload_json):
    log.info(":: update_team_event_feedback")

    team_event_feedback_uuid = uuid.uuid4()
    participant_uuid = str(payload_json['team_event_feedback']['participant_uuid'])
    feedback_text = str(payload_json['team_event_feedback']['feedback_text'])
    team_or_event_columns = ', '
    team_or_event_values = ', '
    team_uuid = None
    event_uuid = None

    sql_parameters = {
        'team_event_feedback_uuid': team_event_feedback_uuid,
        'participant_uuid': participant_uuid,
        'feedback_text': feedback_text
    }

    if 'team_uuid' in payload_json['team_event_feedback']:
        team_uuid = str(payload_json['team_event_feedback']['team_uuid'])
        team_or_event_columns = f"{team_or_event_columns} team_uuid, "
        team_or_event_values = f"{team_or_event_values} %(team_uuid)s::UUID, "
        sql_parameters['team_uuid'] = team_uuid

    if 'event_uuid' in payload_json['team_event_feedback']:
        event_uuid = str(payload_json['team_event_feedback']['event_uuid'])
        team_or_event_columns = f"{team_or_event_columns} event_uuid, "
        team_or_event_values = f"{team_or_event_values} %(event_uuid)s::UUID, "
        sql_parameters['event_uuid'] = event_uuid

    if not team_uuid and not event_uuid:
        return return_error(503, 'A team_uuid or an event_uuid must be provided')

    sql_statement = (f"""
        -- Create/update new Team/Event feedback
        WITH transaction AS
        (
            INSERT
                INTO
                sr.team_event_feedback (
                    team_event_feedback_uuid,
                    participant_uuid
                    {team_or_event_columns}
                    feedback_text
                )
            VALUES (
                %(team_event_feedback_uuid)s::UUID,
                %(participant_uuid)s::UUID
                {team_or_event_values}
                %(feedback_text)s
            )
            ON
            CONFLICT (participant_uuid, team_uuid, event_uuid) DO
            UPDATE
            SET
                feedback_text = EXCLUDED.feedback_text,
                ts_modified = NOW()
            RETURNING team_event_feedback_uuid
        )
        SELECT
            team_event_feedback_uuid
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
        log.error(f">> update_team_event_feedback: {error}")
        return return_error(503, error) 

    if response and response[0]:
        payload = response[0]
    else:
        payload = ''

    try:
        if event_uuid:
            incr_key_prefix('event')
        if team_uuid:
            incr_key_prefix('team')
        incr_key_prefix('team_event_feedback')
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
        log.error(f'>> update_team_event_feedback: {error}')

    response_payload = {
        'status_code': 200,
        'team_event_feedback_uuid': str(payload)
    }
    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

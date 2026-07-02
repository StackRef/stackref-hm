import json
import logging
from pydash import get
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_participant
        Create an Event Participant and return its details
'''
def create_participant(payload_json):
    log.info(":: create_participant")

    participant_uuid = uuid.uuid4()

    # TODO: Make sure this user_uuid event_uuid are part of the Organization
    user_uuid = str(payload_json['participant']['user_uuid'])
    event_uuid = str(payload_json['participant']['event_uuid'])

    sql_statement = ("""
        -- Create new Participant for an Event
        WITH s AS (
            SELECT
                participant_uuid
            FROM
                sr.participant
            WHERE
                user_uuid = %(user_uuid)s::UUID
                AND event_uuid = %(event_uuid)s::UUID
        ),
        i AS (
            INSERT
                INTO
                    sr.participant (
                        participant_uuid,
                        user_uuid,
                        event_uuid
                    )
                    SELECT
                        %(participant_uuid)s::UUID,
                        %(user_uuid)s::UUID,
                        %(event_uuid)s::UUID
                    WHERE
                        -- User not already in this Event
                        NOT EXISTS (
                            SELECT
                                participant_uuid AS pid
                            FROM
                                sr.participant
                            WHERE
                                user_uuid = %(user_uuid)s::UUID
                                AND event_uuid = %(event_uuid)s::UUID
                        ) RETURNING participant_uuid
        )
        SELECT
            participant_uuid
        FROM
            i
        UNION ALL
            SELECT
                participant_uuid
            FROM
                s;
    """)
    sql_parameters = {
        'participant_uuid': participant_uuid,
        'user_uuid': user_uuid,
        'event_uuid': event_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> create_participant: {error}")
        return return_error(503, error) 

    if not response or not response[0]:
        payload = ''
        status_code = 500
    else:
        payload = response[0]
        status_code = 200
        participant_uuid = str(payload)
        if 'participant_role_id' in payload_json['participant']:
            try:
                initial_participant_role(participant_uuid, payload_json['participant']['participant_role_id'])
            except Exception as error:
                log.error(f'>> create_participant: {error}')

    response_payload = {
        'status_code': status_code,
        'participant_uuid': str(payload)
    }

    try:
        incr_key_prefix('participant')
        incr_key_prefix('participant_role_member')
        incr_key_prefix('team_score_item')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeUserParticipants",
            "type": "command"
        }
        tator_notify(tator_message, str(user_uuid))
    except Exception as error:
        log.error(f'>> create_participant: {error}')

    response_body = json.dumps(response_payload)

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

'''
    initial_participant_role
        Update a Participant's roles
'''
def initial_participant_role(participant_uuid, initial_role_id):
    log.info(':: initial_participant_role')

    participant_role_member_uuid = uuid.uuid4()

    sql_statement = ("""
        -- Add Participant to initial role
        INSERT
            INTO
            sr.participant_role_member (
                participant_role_member_uuid,
                participant_uuid,
                participant_role_id
            )
        VALUES (
            %(participant_role_member_uuid)s::UUID,
            %(participant_uuid)s::UUID,
            %(role_id)s
        );
    """)
    log.info(str(sql_statement))
    sql_parameters = {
        'participant_role_member_uuid': participant_role_member_uuid,
        'participant_uuid': participant_uuid,
        'role_id': int(initial_role_id)
    }
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> initial_participant_role: {error}")
        raise error

    log.info(f":: initial_participant_role participant_uuid: {participant_uuid}")

import hashlib
import json
import logging
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    event_attend_request
        Send an event attendance request to the Organization channel
'''
def event_attend_request(payload_json):
    log.info(":: event_attend_request")

    # TODO: Make sure this user_uuid event_uuid are part of the Organization
    user_uuid = str(payload_json['participant']['user_uuid'])
    event_uuid = str(payload_json['participant']['event_uuid'])

    participant_uuid = uuid.uuid4()

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

    response_payload = {
        'status_code': status_code,
        'participant_uuid': str(payload)
    }

    try:
        incr_key_prefix('participant')
    except:
        log.error('>> incr_key_prefix')

    event_details = {}
    event_name = None
    message_description = "A new request to attend the event. Add their participant roles or remove them to deny the request."

    try:
        event_details = get_event_details(event_uuid)
        log.debug(event_details)
    except Exception as error:
        log.error(f'>> request_attend_event: {error}')

    if (
        'event_details' in event_details and
        'event_name' in event_details['event_details']
    ):
        event_name = event_details['event_details']['event_name']
        if event_name:
            message_description = f"A new request to attend the event '{event_name}'. Add their participant roles or remove them to deny the request."

    # Send Tator message to Event channel
    try:
        tator_message = {
            "title": "New event attendance request!",
            "description": message_description,
            "status": "success",
            "type": "event_status"
        }
        tator_notify(tator_message, event_uuid)
    except Exception as error:
        log.error(f'>> event_attend_request: {error}')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeParticipants",
            "args": event_uuid,
            "type": "command"
        }
        tator_notify(tator_message, str(user_uuid))
    except Exception as error:
        log.error(f'>> event_attend_request: {error}')

    try:
        tator_message = {
            "command": "initializeUserParticipants",
            "type": "command"
        }
        tator_notify(tator_message, user_uuid)
    except Exception as error:
        log.error(f'>> event_attend_request: {error}')

    response_body = json.dumps(response_payload)

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }


'''
'''
def get_event_details(event_uuid):

    log.info(':: get_event_details')

    sql_statement = ("""
        -- Retrieve details from Event
        SELECT
            row_to_json(event)
        FROM
            (
                SELECT
                    event_details
                FROM
                    sr.event
                WHERE
                    event_uuid = %(event_uuid)s::UUID
                LIMIT 1
            ) AS event;
    """)

    sql_parameters = {
        'event_uuid': event_uuid
    }

    payload = {}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('event', hashed_query)
    cached_data = None
    if cached_data:
        log.info(':: Using cached data')
        payload = json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_event_details: {error}")

        if response and response[0]:
            payload = response[0]
        else:
            payload = {}

        try:
            cache_query_response('event', hashed_query, json.dumps(payload))
        except:
            log.error(f">> cache_query_response")

    return payload

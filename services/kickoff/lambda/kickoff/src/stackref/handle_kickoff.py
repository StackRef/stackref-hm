import hashlib
import json
import logging

import stackref.settings as settings
from stackref.cache_functions import *
from example.complete_event import complete_event
from stackref.form_event_teams import form_event_teams
from stackref.handle_messages import process_message
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    event_warn
        Send notifications of Kickoff event
'''
def event_warn(action, event_obj):
    log.info(":: event_warn")

    if 'event_details' in event_obj:
        organization_uuid = event_obj['organization_uuid']
        event_name = event_obj['event_details']['event_name']

        message = {}
        if action == 'start':
            message['title'] = "Event has started!"
            message['description'] = f"The event '{event_name}' has started"
            message['status'] = "success"
            message['type'] = "event_status"
        elif action == 'end':
            message['title'] = "Event judging has started!"
            message['description'] = f"Judging for event '{event_name}' has started"
            message['status'] = "warning"
            message['type'] = "judging_status"
        elif action == 'start_warn':
            message['title'] = "Event is starting soon!"
            message['description'] = f"The event '{event_name}' is starting soon"
            message['status'] = "success"
            message['type'] = "event_status"
        elif action == 'end_warn':
            message['title'] = "Event judging starting soon!"
            message['description'] = f"Judging for event '{event_name}' is starting soon"
            message['status'] = "warning"
            message['type'] = "judging_status"
        elif action == 'judging_warn':
            message['title'] = "Event judging ending soon!"
            message['description'] = f"Judging for event '{event_name}' is ending soon"
            message['status'] = "warning"
            message['type'] = "judging_status"
        elif action == 'judging_end':
            message['title'] = "Event judging has ended!"
            message['description'] = f"Scoreboard! Judging for event '{event_name}' has ended"
            message['status'] = "warning"
            message['type'] = "judging_status"

        try:
            process_message(message, organization_uuid)
        except Exception as error:
            log.error(f'>> event_warn: {error}')
            raise error

'''
    event_start
        Start the Event Kickoff process
'''
def event_start(event_obj):
    log.info(":: event_start")
    log.debug(json.dumps(event_obj))

    if event_obj['event_status_name'] == 'Ready':

        if event_obj['event_team_form_mode_name'] == 'Automatic':
            try:
                form_event_teams(event_obj)
            except Exception as error:
                log.error(f'>> event_start, form_event_teams: {error}')
                #raise error

        event_uuid = event_obj['event_uuid']
        organization_uuid = event_obj['organization_uuid']

        sql_statement = ("""
            -- Update the Event status to Running
            UPDATE
                sr.event
            SET
                event_status_id = event_status.event_status_id,
                ts_modified = NOW()
            FROM
                (
                    SELECT
                        event_status_id
                    FROM
                        sr.event_status
                    WHERE
                        event_status_name = 'Running'
                ) AS event_status
            WHERE
                event_uuid = %(event_uuid)s::UUID;
        """)
        sql_parameters = {'event_uuid': event_uuid}

        log.debug(sql_statement)
        try:
            with settings.db_conn() as db_conn: 
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
        except Exception as error:
            log.error(f">> event_start: {error}")
            raise error

        try:
            incr_key_prefix('event')
        except:
            log.error('>> incr_key_prefix')

        # Send Tator command to update UI
        try:
            tator_message = {
                "command": "initializeOrgEvents",
                "type": "command"
            }
            tator_notify(tator_message, organization_uuid)
        except Exception as error:
            log.error(f'>> event_start: {error}')

        return True
    else:
        log.info(':: Event is not in Ready status, so will not start')
        return False

'''
    event_end
        End the Event Kickoff process
'''
def event_end(event_obj):
    log.info(":: event_end")
    log.debug(json.dumps(event_obj))

    if event_obj['event_status_name'] == 'Running':

        event_uuid = event_obj['event_uuid']
        organization_uuid = event_obj['organization_uuid']

        sql_statement = ("""
            -- Update the Event status to Judging
            UPDATE
                sr.event
            SET
                event_status_id = event_status.event_status_id,
                ts_modified = NOW()
            FROM
                (
                    SELECT
                        event_status_id
                    FROM
                        sr.event_status
                    WHERE
                        event_status_name = 'Judging'
                ) AS event_status
            WHERE
                event_uuid = %(event_uuid)s::UUID;
        """)
        sql_parameters = {'event_uuid': event_uuid}

        log.debug(sql_statement)
        try:
            with settings.db_conn() as db_conn: 
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
        except Exception as error:
            log.error(f">> event_end: {error}")
            raise error

        try:
            incr_key_prefix('event')
        except:
            log.error('>> incr_key_prefix')

        # Send Tator command to update UI
        try:
            tator_message = {
                "command": "initializeOrgEvents",
                "type": "command"
            }
            tator_notify(tator_message, organization_uuid)
        except Exception as error:
            log.error(f'>> event_end: {error}')

        return True
    else:
        log.info(':: Event is not in Running status, so will not end')
        return False

'''
    event_complete
        Complete the Event Kickoff process
'''
def event_complete(event_obj):
    log.info(":: event_complete")
    log.debug(json.dumps(event_obj))

    if event_obj['event_status_name'] == 'Judging':
        try:
            complete_event(event_obj['event_uuid'])
        except Exception as error:
            log.error(f'>> event_complete: {error}')
        return True
    else:
        log.info(':: Event is not in Judging status, so will not complete')
        return False

'''
    get_event_obj
        Retrieve Event object
'''
def get_event_obj(event_uuid):
    log.info(':: event_obj')

    sql_statement = ("""
    -- Retrieve Event
    SELECT
        row_to_json(event)
    FROM
        (
            SELECT
                e.event_uuid,
                e.organization_uuid,
                to_char(e.ts_event_start, 'YYYY-MM-DD HH24:MI:SS') AS ts_event_start,
                to_char(e.ts_event_end, 'YYYY-MM-DD HH24:MI:SS') AS ts_event_end,
                e.event_details,
                es.event_status_id AS event_status_id,
                es.event_status_name AS event_status_name,
                et.event_type_id AS event_type_id,
                et.event_type_name AS event_type_name,
                tfm.event_team_form_mode_id AS event_team_form_mode_id,
                tfm.event_team_form_mode_name AS event_team_form_mode_name,
                NOW() > e.ts_event_end AS event_time_elapsed
            FROM
                sr.event AS e
            LEFT JOIN sr.event_status es ON 
                e.event_status_id = es.event_status_id
            LEFT JOIN sr.event_type et ON 
                e.event_type_id = et.event_type_id
            LEFT JOIN sr.event_team_form_mode tfm ON 
                e.event_team_form_mode_id = tfm.event_team_form_mode_id
            WHERE
                event_uuid = %(event_uuid)s::UUID
            ORDER BY
                e.event_status_id
        ) AS event; 
    """)
    log.debug(sql_statement)
    sql_parameters = {'event_uuid': event_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('event', hashed_query)
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
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        try:
            cache_query_response('event', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return json.loads(payload)

from datetime import datetime, timedelta
import hashlib
import json
import logging

import stackref.settings as settings
from stackref.active_event_update import unset_active_event
from stackref.archive_event import delete_kickoff
from stackref.cache_functions import *
from stackref.settings import return_error
from stackref.tator_notify import tator_notify
from stackref.unassign_cloud_accounts import unassign_cloud_accounts
from stackref.update_kickoff import update_kickoff

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    format_datetime
        Format various time formats returned from React for PostgreSQL use
'''
def format_datetime(date_time):
    try:
        t = datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S.%fZ").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S.%f").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%dT%H:%M:%S").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%d %H:%M:%S.%f").replace(second=0,microsecond=0)
        return t
    except:
        pass
    try:
        t = datetime.strptime(date_time, "%Y-%m-%d %H:%M:%S").replace(second=0,microsecond=0)
        return t
    except:
        pass

    return date_time

'''
    update_event
        Update an Event and return event_uuid and status
'''
def update_event(payload_json):
    log.info(":: update_event")

    ts_event_start = format_datetime(payload_json['event']['ts_event_start'])
    ts_event_end = format_datetime(payload_json['event']['ts_event_end'])
    event_judging_minutes = payload_json['event']['event_judging_minutes']

    if event_judging_minutes > 1440: # 24 hours
        log.error(f">> update_event: Judging time cannot be greater than 24 hours")
        return return_error(200, 'Judging time cannot be greater than 24 hours')

    if ts_event_start > ts_event_end:
        log.error(f">> update_event: Start date cannot be greater than End date")
        return return_error(200, 'Start date cannot be greater than End date')

    if ts_event_end < datetime.utcnow():
        log.error(f">> update_event: End date cannot be less than than Today")
        return return_error(200, 'End date cannot be earlier than than Today')

    log.debug(f':: Days difference: {(ts_event_end.date() - ts_event_start.date()).days}')

    if (ts_event_end.date() - ts_event_start.date()).days > 14: # 2 Weeks
        log.error(">> update_event: Events cannot be longer than two (2) weeks in duration")
        return return_error(200, 'Events cannot be longer than two (2) weeks in duration')

    organization_uuid = str(payload_json['event']['organization_uuid'])
    event_uuid = str(payload_json['event']['event_uuid'])
    event_details = json.dumps(payload_json['event']['event_details'])
    event_status_id = int(json.dumps(payload_json['event']['event_status']))
    cloud_accounts_enabled = str(payload_json['event']['cloud_accounts_enabled'])
    event_type_id = int(json.dumps(payload_json['event']['event_type_id']))
    event_team_form_mode_id = int(json.dumps(payload_json['event']['event_team_form_mode_id']))

    try:
        updating_event = get_event(event_uuid)
    except Exception as error:
        log.error(f'>> update_event: {error}')
        raise error

    if 'event_status_id' not in updating_event:
        log.error(f'>> Updating Event does not exist')
        return return_error(200, 'Updating Event does not exist')

    # Don't allow certain Event updates
    if (
        updating_event['event_time_elapsed'] or
        updating_event['event_status_name'] in ["Complete", "Archived"]
    ):
        log.info(':: Event has completed or is archived and cannot be updated')
        return return_error(200, 'Event has completed or is archived and cannot be updated')

    # Once an Event has been Running or is in Judging mode, certain things should not change
    if updating_event['event_status_name'] in ["Running", "Judging"]:
        if (
            str(ts_event_start) != updating_event['ts_event_start'] or
            str(ts_event_end) != updating_event['ts_event_end'] or
            event_type_id != updating_event['event_type_id'] or
            event_team_form_mode_id != updating_event['event_team_form_mode_id'] or
            # TODO: These status_ids could change at any time in the DB
            event_status_id != updating_event['event_status_id'] and event_status_id not in [3, 4, 5, 6, 34]
        ):
            log.info(':: Event change of this type not allowed')
            return return_error(200, 'Event change of this type not allowed')

    sql_statement = ("""
        -- Update the Event
        UPDATE
            sr.event
        SET
            ts_event_start = %(ts_event_start)s,
            ts_event_end = %(ts_event_end)s,
            cloud_accounts_enabled = %(cloud_accounts_enabled)s::BOOLEAN,
            event_details = %(event_details)s::JSONB,
            event_status_id = %(event_status_id)s,
            event_type_id = %(event_type_id)s,
            event_team_form_mode_id = %(event_team_form_mode_id)s,
            event_judging_minutes = %(event_judging_minutes)s,
            ts_modified = NOW()
        WHERE
            organization_uuid = %(organization_uuid)s::UUID
            AND event_uuid = %(event_uuid)s::UUID;
    """)
    sql_parameters = {
        'event_uuid': event_uuid,
        'organization_uuid': organization_uuid,
        'ts_event_start': ts_event_start,
        'ts_event_end': ts_event_end,
        'cloud_accounts_enabled': cloud_accounts_enabled,
        'event_details': event_details,
        'event_status_id': event_status_id,
        'event_type_id': event_type_id,
        'event_team_form_mode_id': event_team_form_mode_id,
        'event_judging_minutes': event_judging_minutes
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_event: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    # Check if event update is to "Complete" status
    if event_status_id == 4:
        return complete_event(payload_json)
    else:
        try:
            update_kickoff(payload_json)
        except Exception as error:
            log.error(f'>> update_event: {error}')

        # Send Tator commands to update UI
        try:
            tator_message = {
                "command": "initializeOrgEvents",
                "type": "command"
            }
            tator_notify(tator_message, str(payload_json['event']['organization_uuid']))
            tator_message = {
                "command": "initializeEventActivity",
                "args": str(event_uuid),
                "type": "command"
            }
            tator_notify(tator_message, event_uuid)
        except Exception as error:
            log.error(f'>> update_event: {error}')

        response_payload = {
            'status_code': 200,
            'event_uuid': str(event_uuid)
        }
        response_body = json.dumps(response_payload)

        log.info(response_body)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': response_body
        }

'''
    complete_event
        Update an Event to status of Complete
'''
def complete_event(payload_json, int_fn_name=None):
    log.info(":: complete_event")

    event_uuid = str(payload_json['event']['event_uuid'])

    try:
        updating_event = get_event(event_uuid)
        event_name = updating_event['event_details']['event_name']
    except Exception as error:
        log.error(f'>> complete_event: {error}')
        raise error

    sql_statement = ("""
        -- Mark Event completed
        UPDATE
            sr.event
        SET
            event_status_id = (
                SELECT
                    event_status_id
                FROM
                    sr.event_status
                WHERE
                    event_status_name = 'Complete'
            ),
            ts_modified = NOW()
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
        log.error(f">> complete_event: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    # Unset active event
    try:
        unset_active_event(event_uuid)
    except Exception as error:
        log.error(f'>> complete_event: {error}')

    # Unassign all cloud accounts for the event
    try:
        unassign_cloud_accounts(event_uuid)
    except Exception as error:
        log.error(f'>> complete_event: {error}')

    # Delete the event kickoffs
    try:
        delete_kickoff(event_uuid)
    except Exception as error:
        log.error(f'>> complete_event: {error}')

    if int_fn_name != 'Kickoff':
        # Send Tator notification of Event end and winner
        try:
            tator_message = {
                "title": "Event judging has ended!",
                "description": f"Scoreboard! Judging for {repr(event_name) if event_name else 'Event'} has ended!",
                "status": "success",
                "type": "judging_status"
            }
            tator_notify(tator_message, str(updating_event['organization_uuid']))
        except Exception as error:
            log.error(f'>> complete_event: {error}')

    # Send Tator commands to update UI
    try:
        tator_message = {
            "command": "initializeOrgEvents",
            "type": "command"
        }
        tator_notify(tator_message, str(updating_event['organization_uuid']))
        tator_message = {
            "command": "initializeEventActivity",
            "type": "command"
        }
        tator_notify(tator_message, event_uuid)
    except Exception as error:
        log.error(f'>> update_event: {error}')

    response_payload = {
        'status_code': 200,
        'event_uuid': str(event_uuid)
    }
    response_body = json.dumps(response_payload)

    log.info(response_body)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

'''
'''
def get_event(event_uuid):
    sql_statement = ("""
        -- Retrieve event
        SELECT
            row_to_json(event)
        FROM
            (
                SELECT
                    event.organization_uuid,
                    event.ts_event_start,
                    event.ts_event_end,
                    event.event_details,
                    bank.balance_value AS bank_balance,
                    event.event_status_id,
                    event.event_status_name,
                    event.event_type_id,
                    event.event_type_name,
                    event.event_team_form_mode_id,
                    event.event_team_form_mode_name,
                    event.event_is_judging,
                    event.event_time_elapsed
                FROM
                    (
                        SELECT
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
                            e.ts_event_end + INTERVAL '1 minute' * e.event_judging_minutes < NOW() AND e.ts_event_end > NOW() AS event_is_judging,
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
                            e.event_uuid = %(event_uuid)s::UUID
                    ) AS event
                LEFT JOIN LATERAL (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(%(event_uuid)s::UUID) AS balance_value
                ) AS bank ON
                TRUE
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
        response = None
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_event: {error}")
            return return_error(503, error) 

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        try:
            cache_query_response('event', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return json.loads(payload)

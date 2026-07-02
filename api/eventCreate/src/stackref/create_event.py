from datetime import datetime, timedelta
import json
import logging
import uuid

import stackref.settings as settings
from stackref.assign_asset import assign_asset
from stackref.cache_functions import incr_key_prefix
from stackref.coin_bank_transaction import coin_bank_transaction, has_required_funds
from stackref.create_participants import create_participants
from stackref.exceptions import InsufficientFunds

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
    create_event
        Create an Event and return its details
'''
def create_event(payload_json):
    log.info(":: create_event")

    organization_uuid = str(payload_json['event']['organization_uuid'])
    event_type_id = int(json.dumps(payload_json['event']['event_type_id']))

    try:
        organization_status, marketplace_item_name, can_create_event, funds_required = has_required_funds(organization_uuid, event_type_id)
    except InsufficientFunds as error:
        log.error(f'>> create_event InsufficientFunds: {error}')
        coin_bank_transaction(organization_uuid, None, 'N/A', 'Not executed')
        raise
    except Exception as error:
        log.error(f'>> create_event: {error}')
        raise

    if not can_create_event:
        coin_bank_transaction(organization_uuid, None, marketplace_item_name, 'Not executed')
        raise InsufficientFunds(f"Insufficient funds to create Event. Requires {funds_required} StackCash.")

    event_uuid = uuid.uuid4()

    ts_event_start = format_datetime(payload_json['event']['ts_event_start'])
    ts_event_end = format_datetime(payload_json['event']['ts_event_end'])
    event_judging_minutes = int(payload_json['event']['event_judging_minutes'])

    if event_judging_minutes > 1440: # 24 hours
        log.error(f">> update_event: Judging time cannot be greater than 24 hours")
        raise ValueError('Judging time cannot be greater than 24 hours')

    if ts_event_start > ts_event_end:
        log.error(">> create_event: Start date cannot be greater than End date")
        raise ValueError("Start date cannot be greater than End date")

    if ts_event_end < datetime.utcnow():
        log.error(">> update_event: End date cannot be less than than Today")
        raise ValueError('End date cannot be earlier than than Today')

    log.debug(f':: Days difference: {(ts_event_end.date() - ts_event_start.date()).days}')

    if (ts_event_end.date() - ts_event_start.date()).days > 14: # 2 Weeks
        log.error(">> update_event: Events cannot be longer than two (2) weeks in duration")
        raise ValueError('Events cannot be longer than two (2) weeks in duration')

    ts_event_start = str(ts_event_start)
    ts_event_end = str(ts_event_end)
    cloud_accounts_enabled = str(payload_json['event']['cloud_accounts_enabled'])
    event_team_form_mode_id = int(json.dumps(payload_json['event']['event_team_form_mode_id']))
    event_details = json.dumps(payload_json['event']['event_details'])

    sql_statement = ("""
        -- Create new Event for the Organization
        INSERT
        INTO
            sr.event (
                event_uuid,
                organization_uuid,
                event_status_id,
                event_judging_minutes,
                ts_event_start,
                ts_event_end,
                cloud_accounts_enabled,
                event_type_id,
                event_team_form_mode_id,
                event_details
            )
        VALUES (
            %(event_uuid)s::UUID,
            %(organization_uuid)s::UUID,
            (
                SELECT
                    event_status_id
                FROM
                    sr.event_status
                WHERE
                    event_status_name = 'Ready'
            ),
            %(event_judging_minutes)s,
            %(ts_event_start)s,
            %(ts_event_end)s,
            %(cloud_accounts_enabled)s::BOOLEAN,
            %(event_type_id)s,
            %(event_team_form_mode_id)s,
            %(event_details)s::JSONB
        );
    """)
    sql_parameters = {
        'event_uuid': event_uuid,
        'organization_uuid': organization_uuid,
        'event_judging_minutes': event_judging_minutes,
        'ts_event_start': ts_event_start,
        'ts_event_end': ts_event_end,
        'cloud_accounts_enabled': cloud_accounts_enabled,
        'event_type_id': event_type_id,
        'event_team_form_mode_id': event_team_form_mode_id,
        'event_details': event_details
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_event: {error}")
        raise error

    # Make the StackCash transaction, if organization_status != "Unlimited"
    if organization_status and organization_status != 'Unlimited':
        try:
            transaction_value = coin_bank_transaction(organization_uuid, event_uuid, marketplace_item_name)
            log.info(f':: create_event: Transaction value = {transaction_value}')
        except Exception as error:
            log.error(f'>> create_event: {error}')

    # Attempt to add all Organization Users as Player participants
    if 'add_all_users' in payload_json['event'] and payload_json['event']['add_all_users'] == 'true':
        try:
            create_participants(organization_uuid, event_uuid)
        except Exception as error:
            log.error(f'>> create_event: {error}')

    # Set the Event image asset if one was set
    if 'entity_asset' in payload_json['event']:
        entity_asset = json.loads(payload_json['event']['entity_asset'])
        try:
            assign_asset(organization_uuid, event_uuid, entity_asset)
            incr_key_prefix('entity_asset')
        except Exception as error:
            log.error(f'>> create_event: {error}')

    # Everything worked
    try:
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    return str(event_uuid)

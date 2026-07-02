import boto3
import json
import logging
from botocore.exceptions import ClientError

import stackref.settings as settings
from stackref.active_event_update import unset_active_event
from stackref.archive_teams import archive_teams
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.tator_notify import tator_notify
from stackref.unassign_cloud_accounts import unassign_cloud_accounts

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    archive_event
        Archive an Event and return event_uuid and status
'''
def archive_event(payload_json):
    log.info(":: archive_event")

    organization_uuid = str(payload_json['event']['organization_uuid'])
    event_uuid = str(payload_json['event']['event_uuid'])

    try:
        unset_active_event(event_uuid)
    except Exception as error:
        log.error(f'>> archive_event: {error}')
        raise error

    try:
        archive_teams(event_uuid)
    except Exception as error:
        log.error(f'>> archive_event: {error}')
        raise error

    sql_statement = ("""
        -- Archive the Event
        UPDATE
            sr.event
        SET
            event_status_id = (
                SELECT
                    event_status_id
                FROM
                    sr.event_status
                WHERE
                    event_status_name = 'Archived'
            ),
            ts_modified = NOW()
        WHERE
            organization_uuid = %(organization_uuid)s::UUID
            AND event_uuid = %(event_uuid)s::UUID;
    """)
    sql_parameters = {
        'event_uuid': event_uuid,
        'organization_uuid': organization_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> archive_event: {error}")
        return return_error(503, error)

    try:
        incr_key_prefix('kanban_item')
        incr_key_prefix('team_score_item')
        incr_key_prefix('team_member_role_member')
        incr_key_prefix('team_member')
        incr_key_prefix('team_codecommit')
        incr_key_prefix('team')
        incr_key_prefix('participant')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    # Unassign all cloud accounts for the event
    try:
        unassign_cloud_accounts(event_uuid)
    except Exception as error:
        log.error(f'>> archive_event: {error}')

    # Delete the event kickoffs
    try:
        delete_kickoff(event_uuid)
    except Exception as error:
        log.error(f'>> archive_event: {error}')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeOrgEvents",
            "type": "command"
        }
        tator_notify(tator_message, str(payload_json['event']['organization_uuid']))
    except Exception as error:
        log.error(f'>> archive_event: {error}')

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
    delete_kickoff
        Delete any set Kickoff events for event_uuid
'''
def delete_kickoff(event_uuid):
    log.info(":: delete_kickoff")

    scheduler_client = boto3.client('scheduler')

    try:
        response = scheduler_client.delete_schedule_group(
            Name=f'sr_event_{event_uuid}'
        )
        log.debug(f':: delete_kickoff: {response}')
    except ClientError as error:
        if error.response['Error']['Code'] == 'ResourceNotFoundException':
            log.warning(f'>> delete_kickoff: {error}')
        else:
            log.error(f'>> delete_kickoff: {error}')
            raise error

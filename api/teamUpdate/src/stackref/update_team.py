import json
import logging

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
    update_team
        Update a Team and return team_uuid and status
'''
def update_team(payload_json):
    log.info(":: update_team")

    team_uuid = str(payload_json['team']['team_uuid'])
    team_details = json.dumps(payload_json['team']['team_details'])
    event_uuid = get_event_by_team(team_uuid)

    sql_statement = ("""
        -- Update the Team
        UPDATE
            sr.team
        SET
            team_details = %(team_details)s::JSONB,
            ts_modified = NOW()
        WHERE
            team_uuid = %(team_uuid)s::UUID;
    """)
    sql_parameters = {
        'team_uuid': str(team_uuid),
        'team_details': team_details
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_team: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('event')
        incr_key_prefix('team')
        incr_key_prefix('team_score_item')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    if event_uuid:
        try:
            tator_message = {
                "command": "initializeEventActivity",
                "args": str(event_uuid),
                "type": "command"
            }
            tator_notify(tator_message, event_uuid)
            tator_message = {
                "command": "initializeUserParticipants",
                "type": "command"
            }
            tator_notify(tator_message, event_uuid)
            tator_message = {
                "command": "initializeTeams",
                "args": str(event_uuid),
                "type": "command"
            }
            tator_notify(tator_message, event_uuid)
            tator_message = {
                "command": "initializeTeamMembers",
                "args": str(team_uuid),
                "type": "command"
            }
            tator_notify(tator_message, team_uuid)
            tator_message = {
                "command": "setActiveTeam",
                "type": "command"
            }
            tator_notify(tator_message, event_uuid)
            tator_message = {
                "command": "setActiveTeamMember",
                "type": "command"
            }
            tator_notify(tator_message, event_uuid)
        except Exception as error:
            log.error(f'>> update_team: {error}')

    response_payload = {
        'status_code': 200,
        'team_uuid': str(team_uuid)
    }
    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

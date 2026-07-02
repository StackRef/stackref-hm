import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.delete_team_analysis import delete_team_analysis
from stackref.grant_functions import get_event_by_team
from stackref.send_kickoff_action import send_kickoff_action
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    archive_team
        Archive an Event Team and return team_uuid and status
'''
def archive_team(payload_json):
    log.info(":: archive_team")

    team_uuid = str(payload_json['team']['team_uuid'])
    event_uuid = str(get_event_by_team(team_uuid))

    try:
        delete_kanban_items(team_uuid)
        remove_team_members_from_roles(team_uuid)
        delete_team_members(team_uuid)
    except Exception as error:
        log.error(f'>> archive_team: ${error}')
        raise error

    sql_statement = ("""
        -- Archive the Team
        UPDATE
            sr.team
        SET
            team_status_id = (
                SELECT
                    team_status_id
                FROM
                    sr.team_status
                WHERE
                    team_status_name = 'Archived'
            ),
            ts_modified = NOW()
        WHERE
            team_uuid = %(team_uuid)s::UUID;
    """)
    sql_parameters = {'team_uuid': team_uuid}

    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> archive_team: {error}")
        return return_error(503, error) 

    try:
        #delete_team_analysis(str(team_uuid))
        send_kickoff_action(str(team_uuid))
    except Exception as error:
        log.error(f'>> archive_team: {error}')

    try:
        incr_key_prefix('kanban_item')
        incr_key_prefix('team_score_item')
        incr_key_prefix('team_member_role_member')
        incr_key_prefix('team_member')
        incr_key_prefix('team')
        incr_key_prefix('team_codecommit')
        incr_key_prefix('participant')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeUserParticipants",
            "type": "command"
        }
        tator_notify(tator_message, event_uuid)
        tator_message = {
            "command": "initializeTeams",
            "args": event_uuid,
            "type": "command"
        }
        tator_notify(tator_message, event_uuid)
        tator_message = {
            "command": "initializeTeamMembers",
            "args": team_uuid,
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
        log.error(f'>> archive_team: {error}')

    response_payload = {
        'status_code': 200,
        'team_uuid': team_uuid
    }
    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

'''
    delete_team_members
        Delete Team Members
'''
def delete_team_members(team_uuid):
    log.info(':: delete_team_members')

    sql_statement = ("""
        -- Remove all Team Members from Team
        DELETE
        FROM
            sr.team_member
        WHERE
            team_uuid = %(team_uuid)s::UUID;
    """)
    sql_parameters = {'team_uuid': team_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> delete_team_members: {error}")
        raise error

    log.info(f":: delete_team_members team_uuid: {team_uuid}")

'''
    remove_team_members_from_roles
        Remove Team Members from all roles of Team
'''
def remove_team_members_from_roles(team_uuid):
    log.info(':: remove_team_members_from_roles')

    sql_statement = ("""
        -- Remove Team Member roles from Team
        DELETE
        FROM
            sr.team_member_role_member
        WHERE
            team_member_uuid IN (
                SELECT
                    team_member_uuid
                FROM
                    sr.team_member
                WHERE
                    team_uuid = %(team_uuid)s::UUID
            );
    """)
    sql_parameters = {'team_uuid': team_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> remove_team_members_from_roles: {error}")
        raise error

    log.info(f":: remove_team_members_from_roles team_uuid: {team_uuid}")

'''
    delete_kanban_items
        Delete all kanban items for the Team
'''
def delete_kanban_items(team_uuid):
    log.info(':: delete_kanban_items')

    sql_statement = ("""
        -- Delete all kanban items for Team
        DELETE
        FROM
            sr.kanban_item
        WHERE
            team_uuid = %(team_uuid)s::UUID;
    """)
    sql_parameters = {'team_uuid': team_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> delete_kanban_items: {error}")
        raise error

    log.info(f":: delete_kanban_items team_uuid: {team_uuid}")

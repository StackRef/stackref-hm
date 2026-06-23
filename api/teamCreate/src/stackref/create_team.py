import json
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import incr_key_prefix
from stackref.create_kanban_item import create_kanban_item
from stackref.create_team_analysis import create_team_analysis
from stackref.grant_functions import get_participant_from_user_event
from stackref.send_kickoff_action import send_kickoff_action
from stackref.settings import return_error
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_team
        Create an Event Team and return its details
'''
def create_team(user_uuid, payload_json):
    log.info(":: create_team")

    team_uuid = uuid.uuid4()

    event_uuid = str(payload_json['team']['event_uuid'])
    team_details = json.dumps(payload_json['team']['team_details'])

    sql_statement = ("""
        -- Create new Team for the Event
        INSERT
            INTO
            sr.team (
                team_uuid,
                event_uuid,
                team_status_id,
                team_details
            )
        VALUES (
            %(team_uuid)s::UUID,
            %(event_uuid)s::UUID,
            (
                SELECT
                    team_status_id
                FROM
                    sr.team_status
                WHERE
                    team_status_name = 'Ready'
            ),
            %(team_details)s::JSONB
        );
    """)
    sql_parameters = {
        'team_uuid': team_uuid,
        'event_uuid': event_uuid,
        'team_details': team_details
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_team: {error}")
        return return_error(503, error)

    if 'team_form_mode' in payload_json['team'] and payload_json['team']['team_form_mode'] == 34:
        try:
            team_member_uuid = assign_team_captain(user_uuid, team_uuid, event_uuid)
        except Exception as error:
            log.error(f">> create_team: {error}")

        try:
            create_kanban_item(team_member_uuid, str(team_uuid), 'Set team mission statement')
            create_kanban_item(team_member_uuid, str(team_uuid), 'Set team banner')
            create_kanban_item(team_member_uuid, str(team_uuid), 'Set team avatar')
        except Exception as error:
            log.error(f">> create_team: {error}")

    try:
        incr_key_prefix('team_score_item')
        incr_key_prefix('team_member')
        incr_key_prefix('team')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeTeams",
            "args": event_uuid,
            "type": "command"
        }
        tator_notify(tator_message, event_uuid)
    except Exception as error:
        log.error(f'>> create_team: {error}')

    try:
        #create_team_analysis(str(team_uuid))
        send_kickoff_action(str(team_uuid))
    except Exception as error:
        log.error(f'>> create_team: {error}')

    response_payload = {
        'status_code': 200,
        'team_uuid': str(team_uuid)
    }
    response_body = json.dumps(response_payload)

    log.debug(response_body)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

'''
'''
def assign_team_captain(user_uuid, team_uuid, event_uuid):
    team_member_uuid = uuid.uuid4()
    participant_uuid = get_participant_from_user_event(user_uuid, event_uuid)

    sql_statement = ("""
        -- Create new Team member
        WITH s AS (
            SELECT
                team_member_uuid
            FROM
                sr.team_member
            WHERE
                participant_uuid = %(participant_uuid)s::UUID
                AND team_uuid = %(team_uuid)s::UUID
        ),
        i AS (
            INSERT
                INTO
                    sr.team_member (
                        team_member_uuid,
                        participant_uuid,
                        team_uuid
                    )
                    SELECT
                        %(team_member_uuid)s::UUID,
                        %(participant_uuid)s::UUID,
                        %(team_uuid)s::UUID
                    WHERE
                        -- Participant is in Event
                        EXISTS (SELECT
                            p.event_uuid AS event_uuid
                        FROM
                            sr.participant AS p
                        LEFT JOIN sr.team t ON
                            p.event_uuid = t.event_uuid
                        WHERE
                            p.participant_uuid = %(participant_uuid)s::UUID
                            AND t.event_uuid = p.event_uuid
                        )
                        -- Participant not already in a Team
                        AND NOT EXISTS (
                            SELECT
                                team_member_uuid AS tmid
                            FROM
                                sr.team_member
                            WHERE
                                participant_uuid = %(participant_uuid)s::UUID
                                    -- AND team_uuid = %(team_uuid)s::UUID
                        ) RETURNING team_member_uuid 
                        
        )
        SELECT
            team_member_uuid
        FROM
            i
        UNION ALL
            SELECT
                team_member_uuid
            FROM
                s;
    """)
    sql_parameters = {
        'team_member_uuid': team_member_uuid,
        'participant_uuid': participant_uuid,
        'team_uuid': team_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> create_team_member: {error}")
        return return_error(503, error) 

    if not response or not response[0]:
        raise Exception("Team Captain assignment failed")
    else:
        payload = response[0]
        team_member_uuid = str(payload)
        try:
            initial_team_member_role(team_member_uuid, 'Captain')
        except Exception as error:
            log.error(f">> assign_team_captain: {error}")

    try:
        incr_key_prefix('team_member_role_member')
        incr_key_prefix('team_member')
        incr_key_prefix('team_score_item')
        incr_key_prefix('team')
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
        log.error(f'>> create_team_member: {error}')

    return str(team_member_uuid)

'''
    initial_team_member_role
        Update a Participant's roles
'''
def initial_team_member_role(team_member_uuid, initial_role_name):
    log.info(':: initial_team_member_role')

    team_member_role_member_uuid = uuid.uuid4()

    sql_statement = ("""
        -- Add Team Member to initial role
        INSERT
            INTO
            sr.team_member_role_member (
                team_member_role_member_uuid,
                team_member_uuid,
                team_member_role_id
            )
        VALUES (
            %(team_member_role_member_uuid)s::UUID,
            %(team_member_uuid)s::UUID,
            (
                SELECT
                    team_member_role_id
                FROM
                    sr.team_member_role
                WHERE
                    team_member_role_name = %(role_name)s
            )
        );
    """)
    log.info(str(sql_statement))
    sql_parameters = {
        'team_member_role_member_uuid': team_member_role_member_uuid,
        'team_member_uuid': team_member_uuid,
        'role_name': initial_role_name
    }
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> initial_team_member_role: {error}")
        raise error

    log.info(f":: initial_team_member_role team_member_uuid: {team_member_uuid}")

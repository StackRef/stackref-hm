import hashlib
import json
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.settings import return_error
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_team_member
        Create an Event Participant and return its details
'''
def create_team_member(payload_json):
    log.info(":: create_team_member")

    team_member_uuid = uuid.uuid4()

    participant_uuid = str(payload_json['team_member']['participant_uuid'])
    team_uuid = str(payload_json['team_member']['team_uuid'])

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
        payload = ''
        status_code = 500
    else:
        payload = response[0]
        status_code = 200
        team_member_uuid = str(payload)
        if payload_json['action'] != 'request_join' and 'team_member_role_id' in payload_json['team_member']:
            try:
                initial_team_member_role(team_member_uuid, payload_json['team_member']['team_member_role_id'])
            except Exception as error:
                log.error(f'>> create_team_member: {error}')

    response_payload = {
        'status_code': status_code,
        'team_member_uuid': str(payload)
    }

    try:
        incr_key_prefix('team_member_role_member')
        incr_key_prefix('team_member')
        incr_key_prefix('team')
        incr_key_prefix('participant')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        event_uuid = str(get_event_by_team_member(team_member_uuid))
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
        ''' Something isn't right with these and may not be necessary
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
        '''
    except Exception as error:
        log.error(f'>> create_team_member: {error}')

    if payload_json['action'] == 'request_join':
        # Send Tator message to Team channel
        try:
            message_description = f"A new request to join this team. The team captain can add their team member role(s) or remove them to deny the request."
            tator_message = {
                "title": "New team join request!",
                "description": message_description,
                "status": "success",
                "type": "team_status"
            }
            tator_notify(tator_message, team_uuid)
        except Exception as error:
            log.error(f'>> create_team_member: {error}')

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
    initial_team_member_role
        Update a Participant's roles
'''
def initial_team_member_role(team_member_uuid, initial_role_id):
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
            %(role_id)s
        );
    """)
    log.info(str(sql_statement))
    sql_parameters = {
        'team_member_role_member_uuid': team_member_role_member_uuid,
        'team_member_uuid': team_member_uuid,
        'role_id': int(initial_role_id)
    }
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> initial_team_member_role: {error}")
        raise error

    log.info(f":: initial_team_member_role team_member_uuid: {team_member_uuid}")

'''
    get_event_by_team_member
        Return the event_uuid that the team_member_uuid belongs to
'''
def get_event_by_team_member(team_member_uuid):
    if not team_member_uuid:
        return None

    sql_statement = ("""
    -- Get Event from Team Member
    SELECT
        e2.event_uuid
    FROM
        (
            SELECT
                team_uuid
            FROM
                sr.team_member
            WHERE
                team_member_uuid = %(team_member_uuid)s::UUID
        ) AS e1
        LEFT JOIN LATERAL (
            SELECT
                event_uuid
            FROM
                sr.team
            WHERE
                team_uuid = e1.team_uuid
        ) AS e2
        ON
        TRUE;
    """)
    log.debug(sql_statement)

    sql_parameters = {'team_member_uuid': team_member_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('event', hashed_query)
    if cached_data:
        log.info(':: get_event_by_team_member: Using cached data')
        return cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_event_by_team_member: {error}")
            return None

        if response and response[0]:
            event_uuid = response[0]
        else:
            event_uuid = None

        cache_query_response('event', hashed_query, event_uuid)

        return event_uuid

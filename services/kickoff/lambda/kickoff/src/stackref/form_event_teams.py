import hashlib
import json
import logging
import math
import numpy as np
import random
import uuid

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.create_kanban_item import create_kanban_item
from stackref.create_team_analysis import create_team_analysis
from stackref.send_kickoff_action import send_kickoff_action
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    form_event_teams
        Automatically form event teams by evenly distributing Participants set to Player
'''
def form_event_teams(event_obj):
    log.info(":: form_event_teams")

    event_uuid = event_obj['event_uuid']

    try:
        event_players = get_event_players(event_obj['event_uuid'])
    except Exception as error:
        log.error(f'>> form_event_teams: {error}')
        return

    if len(event_players) < 2:
        log.info(':: Not forming teams: Too few players assigned to Event')
        return

    try:
        if 'event_details' in event_obj and 'event_max_team_size' in event_obj['event_details']:
            event_max_team_size = event_obj['event_details']['event_max_team_size']
            if event_max_team_size <= len(event_players):
                event_max_team_size = 2
            team_count = math.ceil(len(event_players) / event_max_team_size)
        else:
            log.info(':: Not forming teams: Event max Team size not set')
            return
    except Exception as error:
        log.error(f'>> form_event_teams: {error}')
        raise error

    try:
        log.debug(event_players)
        random.shuffle(event_players)
        teams = np.array_split(event_players, team_count)
    except Exception as error:
        log.error(f'>> form_event_teams: {error}');
        raise error

    for team_number, team in enumerate(teams):
        try:
            log.debug(f':: form_event_teams team: {team}')
            team_uuid = create_team(event_uuid, team_number)
            log.info(f':: form_event_teams: Created team #{team_number} as {team_uuid}')
        except Exception as error:
            log.error(f'>> form_event_teams: {error}')
            raise error

        if team_uuid:
            team_member_position = 0
            for team_member in team:
                try:
                    team_member_uuid = create_team_member(team_uuid, team_member)
                    log.info(f':: form_event_teams: Created team_member_uuid {team_member_uuid}')
                except Exception as error:
                    log.error(f'>> form_event_teams: {error}')
                    raise error

                if team_member_uuid:
                    try:
                        log.debug(f':: form_event_teams: Updating Team member roles for team_member {team_member_uuid}')
                        update_team_member_roles(team_member_uuid, team_member_position)
                    except Exception as error:
                        log.error(f'>> form_event_teams: {error}')
                        raise error
                else:
                    log.error('>> form_event_teams: No team_member_uuid')
                    raise Exception

                # Assign initial kanban items to Team captain
                if team_member_position == 0:
                    try:
                        create_kanban_item(team_member_uuid, str(team_uuid), 'Set team mission statement')
                        create_kanban_item(team_member_uuid, str(team_uuid), 'Set team banner')
                        create_kanban_item(team_member_uuid, str(team_uuid), 'Set team avatar')
                    except Exception as error:
                        log.error(f">> create_team: {error}")

                team_member_position = team_member_position + 1
        else:
            log.error('>> form_event_teams: team_uuid not set')
            raise Exception
    
    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeTeams",
            "args": event_uuid,
            "type": "command"
        }
        tator_notify(tator_message, event_uuid)
    except Exception as error:
        log.error(f'>> form_event_teams: {error}')

'''
    get_event_players
        Retrieve all Participants set to Player
'''
def get_event_players(event_uuid):
    log.info(':: get_event_players')

    sql_statement = (""" 
        -- Retrieve Event Participant Players
        SELECT
            json_agg(row_to_json(players)) AS players
        FROM
            (
                SELECT
                    e1.participant_uuid AS participant_uuid,
                    e1.user_uuid AS user_uuid,
                    e1.tags AS user_tags
                FROM
                    (
                        SELECT
                            p.participant_uuid,
                            p.user_uuid,
                            p.event_uuid,
                            u.tags
                        FROM
                            sr.participant AS p
                        LEFT JOIN sr.user u ON
                            p.user_uuid = u.user_uuid
                        WHERE
                            p.event_uuid = %(event_uuid)s::UUID
                    ) AS e1
                LEFT JOIN LATERAL (
                        SELECT
                            a.is_player
                        FROM
                            (
                                SELECT
                                    1 AS is_player
                                FROM
                                    sr.participant_role_member AS prm
                                LEFT JOIN sr.participant_role pr ON
                                    prm.participant_role_id = pr.participant_role_id
                                WHERE
                                    prm.participant_uuid = e1.participant_uuid
                                    AND pr.participant_role_name = 'Player'
                                    AND event_uuid = %(event_uuid)s::UUID
                            ) AS a
                    ) AS e2 ON
                    TRUE
                WHERE
                    e2.is_player = 1
            ) AS players;
    """)
    log.debug(sql_statement)
    sql_parameters = {'event_uuid': event_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('participant', hashed_query)
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
            log.error(f">> get_event_players: {error}")
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('participant', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return json.loads(payload)

'''
    create_team
        Create an Event Team and return its details
'''
def create_team(event_uuid, team_number):
    log.info(":: create_team")

    team_uuid = uuid.uuid4()

    team_details = {
        'team_name': f'Team {team_number}'
    }

    sql_statement = ("""
        -- Create new Team for the Event
        INSERT
            INTO
            sr.team (
                team_uuid,
                event_uuid,
                team_details
            )
        VALUES (
            %(team_uuid)s::UUID,
            %(event_uuid)s::UUID,
            %(team_details)s::JSONB
        );
    """)
    sql_parameters = {
        'team_uuid': team_uuid,
        'event_uuid': event_uuid,
        'team_details': json.dumps(team_details)
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_team: {error}")
        raise error

    try:
        #create_team_analysis(str(team_uuid))
        send_kickoff_action(str(team_uuid))
    except Exception as error:
        log.error(f">> create_team: {error}")

    try:
        incr_key_prefix('team')
        incr_key_prefix('team_codecommit')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    return str(team_uuid)

'''
    create_team_member
        Create an Event Participant and return its details
'''
def create_team_member(team_uuid, team_member):
    log.info(":: create_team_member")

    team_member_uuid = uuid.uuid4()

    participant_uuid = str(team_member['participant_uuid'])

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
        raise error

    if not response or not response[0]:
        raise Exception

    try:
        incr_key_prefix('team_member')
        incr_key_prefix('participant')
    except:
        log.error('>> incr_key_prefix')

    return str(team_member_uuid)

'''
    update_team_member_roles
        Update a Team Member's roles
'''
def update_team_member_roles(team_member_uuid, team_member_position):
    log.info(':: update_team_member_roles')

    team_member_role_member_uuid = uuid.uuid4()

    # Set the first team_member as Captain
    if team_member_position == 0:
        role_id = 2
    else:
        role_id = 1

    sql_statement = ("""
        -- Add Team Member to role if not already present
        INSERT
            INTO
            sr.team_member_role_member (
                team_member_role_member_uuid,
                team_member_uuid,
                team_member_role_id,
                ts_modified
            )
            SELECT
                %(team_member_role_member_uuid)s::UUID,
                %(team_member_uuid)s::UUID,
                %(role_id)s,
                NOW()
            WHERE
                NOT EXISTS (
                    SELECT
                        team_member_role_member_uuid
                    FROM
                        sr.team_member_role_member
                    WHERE
                        team_member_uuid = %(team_member_uuid)s::UUID
                        AND team_member_role_id = %(role_id)s
                )
    """)
    log.info(str(sql_statement))
    sql_parameters = {
        'team_member_role_member_uuid': team_member_role_member_uuid,
        'team_member_uuid': team_member_uuid,
        'role_id': int(role_id)
    }
    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_team_member_roles: {error}")
        raise error

    log.info(f":: update_team_member_roles team_member_uuid: {team_member_uuid}")

    try:
        incr_key_prefix('team_member_role_member')
        incr_key_prefix('team_member')
        incr_key_prefix('team')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

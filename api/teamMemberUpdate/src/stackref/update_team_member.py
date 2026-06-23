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
    update_team_member
        Update Team Member
'''
def update_team_member(action, team_member):
    log.info(":: update_team_member")

    team_uuid = str(get_team_by_team_member(team_member['team_member_uuid']))
    event_uuid = str(get_event_by_team_member(team_member['team_member_uuid']))

    if action == 'update_roles':
        return update_team_member_roles(team_member, event_uuid, team_uuid)
    elif action == 'delete':
        try:
            remove_team_member_from_roles(team_member)
            unassign_kanban_items(team_member)
            delete_team_member(team_member)
        except BaseException as error:
            return return_error(500, error)

        try:
            incr_key_prefix('team_member_role_member')
            incr_key_prefix('team_member')
            incr_key_prefix('participant')
            incr_key_prefix('team')
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
            log.error(f'>> update_team_member: {error}')

        response_payload = {
            'status_code': 200,
            'team_member_uuid': team_member['team_member_uuid']
        }

        response_body = json.dumps(response_payload)
        return {
            'statusCode': 200,
            'body': response_body
        }

'''
    update_team_member_roles
        Update a Team Member's roles
'''
def update_team_member_roles(team_member, event_uuid, team_uuid):
    log.info(':: update_team_member_roles')

    team_member_uuid = team_member['team_member_uuid']
    team_member_roles = None

    # If the team member has no roles set, remove them from everything
    where_clause = ""
    if team_member['team_member_roles'] and len(team_member['team_member_roles']) > 0:
        team_member_roles = list(map(int, team_member['team_member_roles']))
        where_clause = f"AND team_member_role_id NOT IN ({str(team_member_roles)[1:-1]})"

    sql_statement = (f"""
        -- Remove Team Member from any roles not in list
        DELETE
        FROM
            sr.team_member_role_member
        WHERE
            team_member_uuid = %(team_member_uuid)s::UUID
            {where_clause};
    """)
    sql_parameters = {'team_member_uuid': team_member_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_team_member_roles: {error}")
        return return_error(503, error)

    if team_member_roles:
        for role_id in team_member_roles:
            team_member_role_member_uuid = uuid.uuid4()
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
                        );
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
                return return_error(503, error) 

            log.info(f":: update_team_member_roles team_member_uuid: {team_member_uuid}")

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
    except Exception as error:
        log.error(f'>> update_team_member_roles: {error}')

    response_payload = {
        'status_code': 200,
        'team_member_uuid': team_member['team_member_uuid']
    }

    try:
        incr_key_prefix('kanban_item')
        incr_key_prefix('team_member_role_member')
        incr_key_prefix('team_member')
        incr_key_prefix('team')
        incr_key_prefix('participant')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'body': response_body
    }

'''
    delete_team_member
        Delete Team Member
'''
def delete_team_member(team_member):
    log.info(':: delete_team_member')

    team_member_uuid = team_member['team_member_uuid']

    sql_statement = ("""
        -- Remove Team Member from Team
        DELETE
        FROM
            sr.team_member
        WHERE
            team_member_uuid = %(team_member_uuid)s::UUID;
    """)
    sql_parameters = {'team_member_uuid': team_member_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> delete_team_member: {error}")
        raise error

    log.info(f":: delete_team_member team_member_uuid: {team_member_uuid}")

'''
    remove_team_member_from_roles
        Remove Team Member from all roles
'''
def remove_team_member_from_roles(team_member):
    log.info(':: remove_team_member_from_roles')

    team_member_uuid = team_member['team_member_uuid']

    sql_statement = ("""
        -- Remove Team Member's roles
        DELETE
        FROM
            sr.team_member_role_member
        WHERE
            team_member_uuid = %(team_member_uuid)s::UUID;
    """)
    sql_parameters = {'team_member_uuid': team_member_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> remove_team_member_from_roles: {error}")
        raise error

    log.info(f":: remove_team_member_from_roles team_member_uuid: {team_member_uuid}")

'''
    get_team_by_team_member
        Return the team_uuid that the team_member_uuid belongs to
'''
def get_team_by_team_member(team_member_uuid):
    if not team_member_uuid:
        return None

    sql_statement = ("""
    -- Get Team from Team Member
    SELECT
        team_uuid
    FROM
        sr.team_member
    WHERE
        team_member_uuid = %(team_member_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {'team_member_uuid': team_member_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team', hashed_query)
    if cached_data:
        log.info(':: get_team_from_team_member: Using cached data')
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
            log.error(f">> get_team_from_team_member: {error}")
            return None

        if response and response[0]:
            team_uuid = response[0]
        else:
            team_uuid = None

        cache_query_response('team', hashed_query, team_uuid)

        return team_uuid

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

'''
    unassign_kanban_items
        Unset all kanban items the Team Member owns or assigned
'''
def unassign_kanban_items(team_member):
    log.info(':: unassign_kanban_items')

    team_member_uuid = team_member['team_member_uuid']

    sql_statement = ("""
        -- Unset all kanban items for Team Member
        UPDATE
            sr.kanban_item
        SET
            kanban_item_issuer_uuid = CASE
                WHEN kanban_item_issuer_uuid = %(team_member_uuid)s::UUID THEN NULL
                ELSE kanban_item_issuer_uuid
            END,
            kanban_item_owner_uuid = CASE
                WHEN kanban_item_owner_uuid = %(team_member_uuid)s::UUID THEN NULL
                ELSE kanban_item_owner_uuid
            END
        WHERE
            kanban_item_issuer_uuid = %(team_member_uuid)s::UUID
            OR kanban_item_owner_uuid = %(team_member_uuid)s::UUID;
    """)
    sql_parameters = {'team_member_uuid': team_member_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> unassign_kanban_items: {error}")
        raise error

    log.info(f":: unassign_kanban_items team_member_uuid: {team_member_uuid}")

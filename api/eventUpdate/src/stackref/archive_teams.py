import hashlib
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.send_kickoff_action import send_kickoff_action

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    archive_teams
        Archive an Event's Teams
'''
def archive_teams(event_uuid):
    log.info(":: archive_teams")

    event_teams = get_event_teams(event_uuid)

    for event_team in event_teams:
        try:
            delete_kanban_items(str(event_team['team_uuid']))
            remove_team_members_from_roles(str(event_team['team_uuid']))
            delete_team_members(str(event_team['team_uuid']))
        except Exception as error:
            log.error(f'>> archive_teams: ${error}')
            raise error

        try:
            send_kickoff_action(str(event_team['team_uuid']))
            #delete_team_analysis(str(event_team['team_uuid']))
        except Exception as error:
            log.error(f'>> archive_teams: {error}')

    sql_statement = ("""
        -- Archive the Teams
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
            event_uuid = %(event_uuid)s::UUID;
    """)
    sql_parameters = {'event_uuid': event_uuid}

    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> archive_teams: {error}")
        return return_error(503, error) 


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
'''
def get_event_teams(event_uuid):
    sql_statement = ("""
        -- Retrieve Event Team UUIDs
        SELECT
            json_agg(teams) AS teams
        FROM
            (
                SELECT
                    team_uuid
                FROM
                    sr.team
                WHERE
                    event_uuid = %(event_uuid)s::UUID
            ) AS teams;
    """)
    log.debug(sql_statement)
    sql_parameters = {
        'event_uuid': event_uuid
    }

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('event', hashed_query)
    payload = []
    if cached_data:
        log.info(':: Using cached data')
        payload = json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_event_Teams: {error}")

        if response and response[0]:
            payload = response[0]

        try:
            cache_query_response('event', hashed_query, json.dumps(payload))
        except:
            log.error(f">> cache_query_response")

    return payload

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

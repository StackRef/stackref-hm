import json
import logging
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.grant_functions import *
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    update_participant
        Update Participant
'''
def update_participant(action, participant):
    log.info(":: update_participant")

    user_uuid = str(get_user_by_participant(participant['participant_uuid']))
    event_uuid = str(get_event_by_participant(participant['participant_uuid']))

    if action == 'update_roles':
        return update_participant_roles(participant)
    elif action == 'delete':
        try:
            unassign_participant_kanban_items(participant)
            remove_participant_from_team_member_roles(participant)
            delete_team_member(participant)
            remove_participant_from_roles(participant)
            delete_participant(participant)
        except BaseException as error:
            return return_error(500, error)

        try:
            incr_key_prefix('kanban_item')
            incr_key_prefix('team_score_item')
            incr_key_prefix('team_member')
            incr_key_prefix('team_member_role_member')
            incr_key_prefix('participant_role_member')
            incr_key_prefix('participant')
        except:
            log.error('>> incr_key_prefix')

        # Send Tator command to update UI
        try:
            tator_message = {
                "command": "initializeUserParticipants",
                "type": "command"
            }
            tator_notify(tator_message, user_uuid)
            tator_message = {
                "command": "initializeParticipants",
                "args": event_uuid,
                "type": "command"
            }
            tator_notify(tator_message, event_uuid)
        except Exception as error:
            log.error(f'>> update_participant: {error}')

        response_payload = {
            'status_code': 200,
            'participant_uuid': participant['participant_uuid']
        }

        response_body = json.dumps(response_payload)
        return {
            'statusCode': 200,
            'body': response_body
        }

'''
    update_participant_roles
        Update a Participant's roles
'''
def update_participant_roles(participant):
    log.info(':: update_participant_roles')

    participant_uuid = participant['participant_uuid']
    participant_roles = None

    # If the user has no roles set, remove them from everything
    where_clause = ""
    if participant['participant_roles'] and len(participant['participant_roles']) > 0:
        participant_roles = list(map(int, participant['participant_roles']))
        where_clause = f"AND participant_role_id NOT IN ({str(participant_roles)[1:-1]});"

    sql_statement = (f"""
        -- Remove Participant from any roles not in list
        DELETE
        FROM
            sr.participant_role_member
        WHERE
            participant_uuid = %(participant_uuid)s::UUID
            {where_clause};
    """)
    sql_parameters = {'participant_uuid': participant_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_participant_roles: {error}")
        return return_error(503, error) 

    if participant_roles:
        for role_id in participant_roles:
            participant_role_member_uuid = uuid.uuid4()
            sql_statement = ("""
                -- Add user to role if not already present
                INSERT
                    INTO
                    sr.participant_role_member (
                        participant_role_member_uuid, 
                        participant_uuid, 
                        participant_role_id, 
                        ts_modified
                    )
                    SELECT
                        %(participant_role_member_uuid)s::UUID, 
                        %(participant_uuid)s::UUID, 
                        %(role_id)s, 
                        NOW()
                    WHERE
                        NOT EXISTS (
                            SELECT
                                participant_role_member_uuid
                            FROM
                                sr.participant_role_member
                            WHERE
                                participant_uuid = %(participant_uuid)s::UUID
                                AND participant_role_id = %(role_id)s
                        )
            """)
            log.info(str(sql_statement))
            sql_parameters = {
                'participant_role_member_uuid': participant_role_member_uuid,
                'participant_uuid': participant_uuid,
                'role_id': int(role_id)
            }
            try:
                with settings.db_conn() as db_conn:
                    with db_conn.cursor() as cur:
                        cur.execute(sql_statement, sql_parameters)
            except Exception as error:
                log.error(f">> update_participant_roles: {error}")
                return return_error(503, error) 

            log.info(f":: update_participant_roles participant_uuid: {participant_uuid}")

    try:
        incr_key_prefix('participant_role_member')
        incr_key_prefix('participant')
        incr_key_prefix('team_score_item')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeUserParticipants",
            "type": "command"
        }
        tator_notify(tator_message, str(get_user_by_participant(participant_uuid)))
        event_uuid = str(get_event_by_participant(participant_uuid))
        tator_message = {
            "command": "initializeParticipants",
            "args": event_uuid,
            "type": "command"
        }
        tator_notify(tator_message, event_uuid)
    except Exception as error:
        log.error(f'>> update_participant_roles: {error}')

    response_payload = {
        'status_code': 200,
        'participant_uuid': participant_uuid
    }

    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'body': response_body
    }

'''
    delete_participant
        Delete Participant
'''
def delete_participant(participant):
    log.info(':: delete_participant')

    participant_uuid = participant['participant_uuid']

    sql_statement = ("""
        -- Remove Participant
        DELETE
        FROM
            sr.participant
        WHERE
            participant_uuid = %(participant_uuid)s::UUID;
    """)
    sql_parameters = {'participant_uuid': participant_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> delete_participant: {error}")
        raise error

    log.info(f":: delete_participant participant_uuid: {participant_uuid}")

'''
    remove_participant_from_event_roles
        Remove Participant from all roles
'''
def remove_participant_from_roles(participant):
    log.info(':: remove_participant_from_roles')

    participant_uuid = participant['participant_uuid']

    sql_statement = ("""
        -- Remove Participant's roles
        DELETE
        FROM
            sr.participant_role_member
        WHERE
            participant_uuid = %(participant_uuid)s::UUID;
    """)
    sql_parameters = {'participant_uuid': participant_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> remove_participant_from_roles: {error}")
        raise error

    log.info(f":: remove_participant_from_roles participant_uuid: {participant_uuid}")

'''
    delete_team_member
        Remove Participant from any Team memberships
'''
def delete_team_member(participant):
    log.info(':: delete_team_member')

    participant_uuid = participant['participant_uuid']

    sql_statement = ("""
        -- Remove Participant from all Team memberships
        DELETE
        FROM
            sr.team_member
        WHERE
            participant_uuid = %(participant_uuid)s::UUID;
    """)
    sql_parameters = {'participant_uuid': participant_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> delete_team_member: {error}")
        raise error

    log.info(f":: delete_team_member participant_uuid: {participant_uuid}")

'''
    remove_participant_from_team_member_roles
        Remove Participant from all Team Member roles
'''
def remove_participant_from_team_member_roles(participant):
    log.info(':: remove_participant_from_team_member_roles')

    participant_uuid = participant['participant_uuid']

    sql_statement = ("""
        -- Remove Participant's Team Member Roles
        DELETE
        FROM
            sr.team_member_role_member
        WHERE EXISTS (
            SELECT
                1
            FROM
                sr.team_member_role_member AS tmrm
            LEFT JOIN sr.team_member AS tm ON
                tm.team_member_uuid = tmrm.team_member_uuid
            WHERE
                tm.participant_uuid = %(participant_uuid)s::UUID
        ); 
    """)
    sql_parameters = {'participant_uuid': participant_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> remove_participant_from_team_member_roles: {error}")
        raise error

    log.info(f":: remove_participant_from_team_member_roles participant_uuid: {participant_uuid}")

'''
    set_active_event
        Set the current active Event for the Participant
'''
def set_active_event(user_uuid, participant):
    log.info(':: set_active_event')

    add_sql_statement = ''

    sql_parameters = {'user_uuid': user_uuid}

    sql_statement = ("""
        -- Unset current active Event and set active Event
        UPDATE
            sr.participant
        SET
            is_active = FALSE
        WHERE
            user_uuid = %(user_uuid)s::UUID;
    """)

    if 'event_uuid' in participant:
        event_uuid = participant['event_uuid']
        if len(get_participant_grants(user_uuid, event_uuid)) > 0:
            add_sql_statement = ("""
                -- Set new current active Event
                UPDATE
                    sr.participant
                SET
                    is_active = TRUE
                WHERE
                    user_uuid = %(user_uuid)s::UUID
                    AND event_uuid = %(event_uuid)s::UUID;
            """)
            sql_parameters['event_uuid'] = event_uuid
        else:
            return return_error(401, 'Not authorized')

    log.info(str(sql_statement))
    if add_sql_statement:
        log.info(str(add_sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                if add_sql_statement:
                    cur.execute(add_sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> assign_cloud_account: {error}")
        return return_error(503, error)

    try:
        incr_key_prefix('participant')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeUserParticipants",
            "type": "command"
        }
        tator_notify(tator_message, user_uuid)
    except Exception as error:
        log.error(f'>> set_active_event: {error}')

    response_payload = {
        'status_code': 200
    }

    response_body = json.dumps(response_payload)
    return {
        'statusCode': 200,
        'body': response_body
    }

'''
    get_user_by_participant
        Return the user_uuid that the participant_uuid belongs to
'''
def get_user_by_participant(participant_uuid):
    if not participant_uuid:
        return None

    sql_statement = ("""
    -- Get User from Participant UUID
    SELECT
        user_uuid
    FROM
        sr.participant
    WHERE
        participant_uuid = %(participant_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {'participant_uuid': participant_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('participant', hashed_query)
    if cached_data:
        log.info(':: get_user_by_participant: Using cached data')
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
            log.error(f">> get_user_by_participant: {error}")
            return None

        if response and response[0]:
            user_uuid = response[0]
        else:
            user_uuid = None

        cache_query_response('participant', hashed_query, user_uuid)

        return user_uuid

'''
    get_event_by_participant
        Return the event_uuid that the participant_uuid belongs to
'''
def get_event_by_participant(participant_uuid):
    if not participant_uuid:
        return None

    sql_statement = ("""
    -- Get Event from Participant UUID
    SELECT
        event_uuid
    FROM
        sr.participant
    WHERE
        participant_uuid = %(participant_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {'participant_uuid': participant_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('participant', hashed_query)
    if cached_data:
        log.info(':: get_event_by_participant: Using cached data')
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
            log.error(f">> get_event_by_participant: {error}")
            return None

        if response and response[0]:
            event_uuid = response[0]
        else:
            event_uuid = None

        cache_query_response('participant', hashed_query, event_uuid)

        return event_uuid

'''
    unassign_participant_kanban_items
        Unset all kanban items the Participant owns or assigned
'''
def unassign_participant_kanban_items(participant):
    log.info(':: unassign_participant_kanban_items')

    participant_uuid = participant['participant_uuid']

    sql_statement = ("""
        -- Unset all kanban items for Participant
        WITH cte AS (
            SELECT
                team_member_uuid
            FROM
                sr.team_member
            WHERE
                participant_uuid = %(participant_uuid)s::UUID
        )
        UPDATE
            sr.kanban_item
        SET
            kanban_item_issuer_uuid = CASE
                WHEN kanban_item_issuer_uuid = cte.team_member_uuid THEN NULL
                ELSE kanban_item_issuer_uuid
            END,
            kanban_item_owner_uuid = CASE
                WHEN kanban_item_owner_uuid = cte.team_member_uuid THEN NULL
                ELSE kanban_item_owner_uuid
            END
        FROM
            cte
        WHERE
            kanban_item_issuer_uuid = cte.team_member_uuid
            OR kanban_item_owner_uuid = cte.team_member_uuid;
    """)
    sql_parameters = {'participant_uuid': participant_uuid}

    log.info(str(sql_statement))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> unassign_participant_kanban_items: {error}")
        raise error

    log.info(f":: unassign_participant_kanban_items participant_uuid: {participant_uuid}")

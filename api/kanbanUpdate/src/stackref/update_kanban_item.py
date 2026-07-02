import json
import logging

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.grant_functions import get_user_from_team_member
from stackref.settings import return_error
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    move_kanban_item
        Move a kanban item
'''
def move_kanban_item(payload_json):
    log.info(":: move_kanban_item")

    team_uuid = str(payload_json['kanban_item']['team_uuid'])
    kanban_item_uuid = str(payload_json['kanban_item']['kanban_item_uuid'])
    kanban_item_status_id = int(payload_json['kanban_item']['kanban_item_status_id'])
    kanban_item_priority = int(payload_json['kanban_item']['kanban_item_priority'])

    sql_statement = ("""
        -- Update the kanban item
        WITH
            moving_item AS (
                SELECT
                    kanban_item_status_id AS old_status_id,
                    kanban_item_priority AS old_priority
                FROM
                    sr.kanban_item
                WHERE
                    kanban_item_uuid = %(kanban_item_uuid)s::UUID
            ),
            moved_item AS (
                UPDATE
                    sr.kanban_item
                SET
                    kanban_item_priority = CASE
                        WHEN
                            %(kanban_item_priority)s >= 1
                        THEN
                            %(kanban_item_priority)s
                    ELSE 1
                    END,
                    kanban_item_status_id = %(kanban_item_status_id)s,
                    ts_modified = NOW()
                WHERE
                    kanban_item_uuid = %(kanban_item_uuid)s::UUID
            ),
            updated_status_items AS (
                UPDATE
                    sr.kanban_item
                SET
                    kanban_item_priority = CASE
                        WHEN kanban_item_priority > moving_item.old_priority AND kanban_item_priority > 1 THEN kanban_item_priority - 1
                        -- WHEN kanban_item_priority < moving_item.old_priority AND kanban_item_priority > 1 THEN kanban_item_priority - 1
                    ELSE kanban_item_priority
                    END,
                    ts_modified = NOW()
                FROM moving_item
                WHERE
                    kanban_item_status_id = moving_item.old_status_id
                    AND kanban_item_status_id <> %(kanban_item_status_id)s
                    AND kanban_item_uuid <> %(kanban_item_uuid)s::UUID
            )
            UPDATE
                sr.kanban_item AS ki
            SET
                kanban_item_priority = CASE
                    WHEN kanban_item_priority >= %(kanban_item_priority)s THEN kanban_item_priority + 1
                    -- WHEN kanban_item_priority < %(kanban_item_priority)s AND kanban_item_priority > 1 THEN kanban_item_priority - 1
                ELSE kanban_item_priority
                END,
                ts_modified = NOW()
            WHERE
                ki.kanban_item_status_id = %(kanban_item_status_id)s
                AND ki.kanban_item_priority BETWEEN LEAST(kanban_item_priority, %(kanban_item_priority)s) AND GREATEST(kanban_item_priority, %(kanban_item_priority)s)
                AND ki.kanban_item_uuid <> %(kanban_item_uuid)s::UUID;
    """)
    sql_parameters = {
        'kanban_item_uuid': kanban_item_uuid,
        'kanban_item_status_id': kanban_item_status_id,
        'kanban_item_priority': kanban_item_priority
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> move_kanban_item: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('kanban_item')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeKanban",
            "type": "command"
        }
        tator_notify(tator_message, team_uuid)
    except Exception as error:
        log.error(f'>> move_kanban_item: {error}')

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
    update_kanban_item_owner
        Update a kanban item's owner
'''
def update_kanban_item_owner(payload_json):
    log.info(":: update_kanban_item_owner")

    team_uuid = str(payload_json['kanban_item']['team_uuid'])
    kanban_item_uuid = str(payload_json['kanban_item']['kanban_item_uuid'])
    kanban_item_owner_uuid = payload_json['kanban_item']['kanban_item_owner_uuid']

    if kanban_item_owner_uuid is not None:
        kanban_item_owner_uuid = str(kanban_item_owner_uuid)

    if kanban_item_owner_uuid is None:
        sql_statement = """
            -- Remove the kanban item owner
            UPDATE
                sr.kanban_item
            SET
                kanban_item_owner_uuid = NULL,
                ts_modified = NOW()
            WHERE
                kanban_item_uuid = %(kanban_item_uuid)s::UUID;
        """
    else:
        sql_statement = """
            -- Update the kanban item owner
            UPDATE
                sr.kanban_item
            SET
                kanban_item_owner_uuid = %(kanban_item_owner_uuid)s::UUID,
                ts_modified = NOW()
            WHERE
                kanban_item_uuid = %(kanban_item_uuid)s::UUID
                AND %(kanban_item_owner_uuid)s::UUID IN (
                    SELECT
                        team_member_uuid
                    FROM
                        sr.team_member
                    WHERE
                        team_uuid = %(team_uuid)s::UUID
                );
        """
    sql_parameters = {
        'kanban_item_uuid': kanban_item_uuid,
        'kanban_item_owner_uuid': kanban_item_owner_uuid,
        'team_uuid': team_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_kanban_item_owner: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('kanban_item')
    except:
        log.error('>> incr_key_prefix')

    try:
        user_uuid = get_user_from_team_member(kanban_item_owner_uuid)
        if user_uuid:
            tator_message ={
                "title": "Kanban item update",
                "description": "A team kanban item has been assigned to you",
                "status": "info",
                "type": "kanban"
            }
            tator_notify(tator_message, user_uuid)
    except Exception as error:
        log.error(f'>> update_kanban_item_owner: {error}')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeKanban",
            "type": "command"
        }
        tator_notify(tator_message, team_uuid)
    except Exception as error:
        log.error(f'>> update_kanban_item_owner: {error}')

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
    rename_kanban_item
        Update a kanban item's title
'''
def rename_kanban_item(payload_json):
    log.info(":: rename_kanban_item")

    team_uuid = str(payload_json['kanban_item']['team_uuid'])
    kanban_item_uuid = str(payload_json['kanban_item']['kanban_item_uuid'])
    kanban_item_title = str(payload_json['kanban_item']['kanban_item_details']['item_title'])

    sql_statement = ("""
        -- Update the kanban item title
        UPDATE
            sr.kanban_item
        SET
            kanban_item_details = jsonb_set(
                kanban_item_details::JSONB,
                '{item_title}',
                to_jsonb(%(kanban_item_title)s::TEXT)
            ),
            ts_modified = NOW()
        WHERE
            kanban_item_uuid = %(kanban_item_uuid)s::UUID;
    """)
    sql_parameters = {
        'kanban_item_uuid': kanban_item_uuid,
        'kanban_item_title': kanban_item_title,
        'team_uuid': team_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> rename_kanban_item: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('kanban_item')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeKanban",
            "type": "command"
        }
        tator_notify(tator_message, team_uuid)
    except Exception as error:
        log.error(f'>> rename_kanban_item: {error}')

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

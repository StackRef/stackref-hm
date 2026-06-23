import json
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.grant_functions import get_team_member_from_user
from stackref.settings import return_error
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_kanban_item
        Create a kanban item
'''
def create_kanban_item(user_uuid, payload_json):
    log.info(":: create_kanban_item")

    team_uuid = str(payload_json['kanban_item']['team_uuid'])
    kanban_item_uuid = str(uuid.uuid4())
    kanban_item_status_id = int(payload_json['kanban_item']['kanban_item_status_id'])
    kanban_item_details = json.dumps(payload_json['kanban_item']['kanban_item_details'])
    kanban_item_owner_field = "NULL, "

    # TODO: This is being done because sometimes activeTeamUser in the UI is for some reason not always set properly
    if 'kanban_item_issuer_uuid' in payload_json['kanban_item']:
        kanban_item_issuer_uuid = str(payload_json['kanban_item']['kanban_item_issuer_uuid'])
    else:
        try:
            kanban_item_issuer_uuid = get_team_member_from_user(user_uuid, team_uuid)
        except Exception as error:
            log.error(f">> create_kanban_item: {error}")
            return return_error(503, error) 

    if not kanban_item_issuer_uuid:
        return return_error(500, 'No kanban_item_issuer_uuid found') 

    sql_parameters = {
        'kanban_item_uuid': kanban_item_uuid,
        'team_uuid': team_uuid,
        'kanban_item_status_id': kanban_item_status_id,
        'kanban_item_issuer_uuid': kanban_item_issuer_uuid,
        'kanban_item_details': kanban_item_details
    }

    if 'kanban_item_owner_uuid' in payload_json['kanban_item']:
        sql_parameters['kanban_item_owner_uuid'] =  payload_json['kanban_item']['kanban_item_owner_uuid']
        kanban_item_owner_field = "%(kanban_item_owner_uuid)s::UUID, "

    sql_statement = (f"""
        -- Create the kanban item
        INSERT
            INTO
                sr.kanban_item (
                    kanban_item_uuid,
                    team_uuid,
                    kanban_item_status_id,
                    kanban_item_priority,
                    kanban_item_issuer_uuid,
                    kanban_item_owner_uuid,
                    kanban_item_details
                )
        VALUES (
            %(kanban_item_uuid)s::UUID,
            %(team_uuid)s::UUID,
            %(kanban_item_status_id)s,
            (
                SELECT
                    COALESCE(MAX(kanban_item_priority), 1) + 1
                FROM
                    sr.kanban_item
                WHERE
                    kanban_item_status_id = %(kanban_item_status_id)s AND
                    team_uuid = %(team_uuid)s::UUID
            ),
            %(kanban_item_issuer_uuid)s::UUID,
            {kanban_item_owner_field}
            %(kanban_item_details)s::JSONB
        );
    """)
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_kanban_item: {error}")
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
        log.error(f'>> create_kanban_item: {error}')

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

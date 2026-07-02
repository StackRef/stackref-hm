import json
import logging
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    add_external_link
        Add a Team asset link
'''
def add_external_link(payload_json):
    log.info(":: add_external_link")

    if 'external_link' not in payload_json['team']:
        return return_error(500, 'Malformed POST JSON payload')

    team_external_link_uuid = uuid.uuid4()

    external_link_type_id = payload_json['team']['external_link']['external_link_type_id']
    team_external_link_name = str(payload_json['team']['external_link']['external_link_name'])
    team_external_link_url = str(payload_json['team']['external_link']['external_link_url'])
    team_external_link_private = str(payload_json['team']['external_link']['team_private'])
    team_uuid = str(payload_json['team']['team_uuid'])

    sql_statement = ("""
        -- Add an external Team link
        INSERT
            INTO
            sr.team_external_link (
                team_external_link_uuid,
                team_uuid,
                external_link_type_id,
                team_external_link_name,
                team_external_link_url,
                team_private
            )
        VALUES (
            %(team_external_link_uuid)s::UUID,
            %(team_uuid)s::UUID,
            %(external_link_type_id)s,
            %(team_external_link_name)s,
            %(team_external_link_url)s,
            %(team_external_link_private)s::BOOLEAN
        );
    """)
    sql_parameters = {
        'team_external_link_uuid': team_external_link_uuid,
        'team_uuid': team_uuid,
        'external_link_type_id': external_link_type_id,
        'team_external_link_name': team_external_link_name,
        'team_external_link_url': team_external_link_url,
        'team_external_link_private': team_external_link_private
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> add_external_link: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('team')
        incr_key_prefix('team_external_link')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeTeamExternalLinks",
            "type": "command"
        }
        tator_notify(tator_message, team_uuid)
    except Exception as error:
        log.error(f'>> add_external_link: {error}')

    response_payload = {
        'status_code': 200,
        'team_external_link_uuid': str(team_external_link_uuid),
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

'''
    update_external_link
        Update a Team asset link
'''
def update_external_link(payload_json):
    log.info(":: update_external_link")

    if 'external_link' not in payload_json['team']:
        return return_error(500, 'Malformed POST JSON payload')

    external_link_type_id = payload_json['team']['external_link']['external_link_type_id']
    team_external_link_name = str(payload_json['team']['external_link']['external_link_name'])
    team_external_link_url = str(payload_json['team']['external_link']['external_link_url'])
    team_external_link_private = str(payload_json['team']['external_link']['team_private'])
    team_uuid = str(payload_json['team']['team_uuid'])
    team_external_link_uuid = str(payload_json['team']['external_link']['external_link_uuid'])

    sql_statement = ("""
        -- Update the external Team link
        UPDATE
            sr.team_external_link
        SET
            external_link_type_id = %(external_link_type_id)s,
            team_external_link_name = %(team_external_link_name)s,
            team_external_link_url = %(team_external_link_url)s,
            team_private = %(team_external_link_private)s::BOOLEAN,
            ts_modified = NOW()
        WHERE
            team_uuid = %(team_uuid)s::UUID
            AND team_external_link_uuid = %(team_external_link_uuid)s::UUID;
    """)
    sql_parameters = {
        'external_link_type_id': external_link_type_id,
        'team_external_link_name': team_external_link_name,
        'team_external_link_url': team_external_link_url,
        'team_external_link_private': team_external_link_private,
        'team_uuid': team_uuid,
        'team_external_link_uuid': team_external_link_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_external_link: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('team')
        incr_key_prefix('team_external_link')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeTeamExternalLinks",
            "type": "command"
        }
        tator_notify(tator_message, team_uuid)
    except Exception as error:
        log.error(f'>> update_external_link: {error}')

    response_payload = {
        'status_code': 200,
        'team_external_link_uuid': str(team_external_link_uuid),
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

'''
    delete_external_link
        Delete a Team asset link
'''
def delete_external_link(payload_json):
    log.info(":: delete_external_link")

    if 'external_link' not in payload_json['team']:
        return return_error(500, 'Malformed POST JSON payload')

    team_uuid = str(payload_json['team']['team_uuid'])
    team_external_link_uuid = str(payload_json['team']['external_link']['external_link_uuid'])

    sql_statement = ("""
        -- Delete the external Team link
        DELETE
        FROM
            sr.team_external_link
        WHERE
            team_uuid = %(team_uuid)s::UUID
            AND team_external_link_uuid = %(team_external_link_uuid)s::UUID;
    """)
    sql_parameters = {
        'team_uuid': team_uuid,
        'team_external_link_uuid': team_external_link_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> delete_external_link: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('team')
        incr_key_prefix('team_external_link')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeTeamExternalLinks",
            "type": "command"
        }
        tator_notify(tator_message, team_uuid)
    except Exception as error:
        log.error(f'>> delete_external_link: {error}')

    response_payload = {
        'status_code': 200,
        'team_external_link_uuid': str(team_external_link_uuid),
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

from datetime import datetime
import json
import logging
from pydash import get
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.aws_account_eject import aws_account_eject

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_cloud_account_user
        Check user_uuid assignment to configured cloud_account and create user access
'''
def process_cloud_account_user(payload_json):
    log.info(':: process_cloud_account_user')

    if 'action' not in payload_json:
        return return_error(500, 'Malformed request')

    user_uuid = str(payload_json['cloud_account_user']['user_uuid'])

    cloud_account_owner_uuid = str(payload_json['cloud_account_user']['entity_uuid'])

    if 'update_details' in payload_json['cloud_account_user']:
        update_details = payload_json['cloud_account_user']['update_details']

    try:
        assigned_account = assigned_cloud_account(cloud_account_owner_uuid)
    except Exception as error:
        return return_error(503, error)

    if assigned_account:
        try:
            if payload_json['action'] == 'eject':
                if user_in_account(user_uuid, assigned_account):
                    return eject_cloud_account_user(user_uuid, assigned_account)
                else:
                    return return_error(500, 'User is not in this cloud account')
        except Exception as error:
            log.error(f">> process_cloud_account_user: {error}")
            return return_error(503, error)
    else:
        return return_error(500, 'No available cloud account exists')

'''
    assigned_cloud_account
        Return a single cloud_account_uuid of an assigned cloud_account for cloud_account_owner_uuid
'''
def assigned_cloud_account(cloud_account_owner_uuid):
    log.info(':: assigned_cloud_account')

    sql_statement = ("""
        -- Return account_uuid of cloud_account if one exists
        SELECT
            cloud_account_uuid
        FROM
            sr.cloud_account
        WHERE
            cloud_account_owner_uuid = %(cloud_account_owner_uuid)s::UUID
            AND cloud_account_status_id in (1, 4)
        LIMIT 1
    """)
    sql_parameters = {'cloud_account_owner_uuid': cloud_account_owner_uuid}

    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> assigned_cloud_account: {error}")
        raise error

    if response and response[0]:
        return response[0]
    else:
        return None

'''
    user_in_account
        Checks if user_uuid is a member of cloud_account
'''
def user_in_account(user_uuid, cloud_account_owner_uuid):
    log.info(':: user_in_account')
    log.info(f':: {user_uuid}, {cloud_account_owner_uuid}')

    sql_statement = (f"""
        -- Return 1 if user_uuid is a member of cloud_account
        SELECT
            1 AS exists
        FROM
            sr.cloud_account_user
        WHERE
            user_uuid = %(user_uuid)s::UUID
            AND cloud_account_uuid = %(cloud_account_uuid)s::UUID;
    """)
    sql_parameters = {
        'user_uuid': user_uuid,
        'cloud_account_uuid': cloud_account_owner_uuid
    }

    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> user_in_account: {error}")
        raise error

    if response and response[0] and response[0] == 1:
        return True
    else:
        return None

'''
    eject_cloud_account_user
        Remove a Cloud Account User from specified Cloud Account
'''
def eject_cloud_account_user(user_uuid, cloud_account_uuid):
    log.info(':: eject_cloud_account_user')

    # Update the account in AWS first
    try:
        aws_account_eject(user_details(user_uuid), cloud_account_uuid)
    except Exception as error:
        log.error(f">> eject_cloud_account_user: {error}")
        return return_error(500, error)

    # Now eject them from our database
    sql_statement_1 = ("""
        -- Eject User from cloud_account_group table
        DELETE
            FROM
                sr.cloud_account_group_member
            WHERE
                cloud_account_group_uuid = 
                    (
                        SELECT
                            cloud_account_group_uuid
                        FROM
                            sr.cloud_account_group
                        WHERE
                            cloud_account_uuid = %(cloud_account_uuid)s::UUID
                    )::UUID
                AND cloud_account_user_uuid =
                    (
                        SELECT
                            cloud_account_user_uuid
                        FROM
                            sr.cloud_account_user
                        WHERE
                            user_uuid = %(user_uuid)s::UUID
                            AND cloud_account_uuid = %(cloud_account_uuid)s::UUID
                    )::UUID;
    """)
    sql_statement_2 = ("""
        -- Eject them from the cloud_account table for this cloud_account_uuid
        DELETE
        FROM
            sr.cloud_account_user
        WHERE
            user_uuid = %(user_uuid)s::UUID
            AND cloud_account_uuid = %(cloud_account_uuid)s::UUID;
    """)
    sql_parameters = {
        'cloud_account_uuid': cloud_account_uuid,
        'user_uuid': user_uuid
    }
    log.debug(sql_statement_1)
    log.debug(sql_statement_2)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement_1, sql_parameters)
                cur.execute(sql_statement_2, sql_parameters)
    except Exception as error:
        log.error(f">> eject_cloud_account_user: {error}")
        raise error

    try:
        incr_key_prefix('cloud_account')
        incr_key_prefix('cloud_account_group')
        incr_key_prefix('cloud_account_group_member')
        incr_key_prefix('cloud_account_user')
        incr_key_prefix('team')
    except:
        log.error('>> incr_key_prefix')

    response_payload = {
        'status_code': 200,
        'user_uuid': str(user_uuid)
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
    user_details
        Return details of a user_uuid
'''
def user_details(user_uuid):
    log.info(':: user_details')

    sql_statement = ("""
        -- Return details of a user
        SELECT
            row_to_json(u) AS user
        FROM
            (
                SELECT
                    user_uuid,
                    email_address,
                    first_name,
                    last_name,
                    organization_uuid,
                    settings
                FROM
                    sr.user
                WHERE
                    user_uuid = %(user_uuid)s::UUID
            ) AS u;
    """)
    sql_parameters = {'user_uuid': user_uuid}

    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> user_details: {error}")
        raise error

    if response and response[0]:
        return response[0]
    else:
        return None

'''
    assigned_cloud_account_group
        Return details of cloud_account_user assigned cloud_account_group
'''
def assigned_cloud_account_group(cloud_account_group_member_uuid):
    log.info(':: assigned_cloud_account_group')

    sql_statement = ("""
        -- Return details of cloud_account_group for cloud_account_group_member_uuid
        SELECT
            row_to_json(end_result)
        FROM
            (
                SELECT
                    cag.cloud_account_group_uuid AS cloud_account_group_uuid,
                    cag.cloud_account_group_id AS cloud_account_group_id,
                    cag.cloud_account_group_name AS cloud_account_group_name
                FROM
                    (
                        SELECT
                            cloud_account_group_uuid,
                            cloud_account_group_id,
                            cloud_account_group_name
                        FROM
                            sr.cloud_account_group
                    ) AS cag
                LEFT JOIN LATERAL (
                    SELECT
                        cloud_account_group_uuid,
                        cloud_account_group_member_uuid
                    FROM
                        sr.cloud_account_group_member
                    WHERE
                        cloud_account_group_uuid = cag.cloud_account_group_uuid
                ) AS cagm ON
                TRUE
                WHERE
                    cagm.cloud_account_group_member_uuid = %(cloud_account_group_member_uuid)s::UUID
            ) AS end_result;
    """)
    sql_parameters = {'cloud_account_group_member_uuid': cloud_account_group_member_uuid}

    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> assigned_cloud_account_group: {error}")
        raise error

    if response and response[0]:
        return response[0]
    else:
        return None

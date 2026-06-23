import base64
import hashlib
import json
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_post_method
        Process POST method requests
'''
def process_post_method(event):
    log.info(":: process_post_method")

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

        if 'user' in payload_json:
            authorized = (
                'organization_read' in grants,
                (
                    'auth_provider_id' in payload_json['user'] and
                    payload_json['user']['auth_provider_id'] == get_auth_provider_id(event)
                ),
                (
                    'user_uuid' in payload_json['user'] and
                    payload_json['user']['user_uuid'] == get_user_uuid(event)
                )
            )
            if not any(authorized):
                return return_error(401, 'Not authorized')
            # We call this with either auth_provider_id or user_uuid
            if 'auth_provider_id' in payload_json['user']:
                auth_provider_id = str(payload_json['user']['auth_provider_id'])
                where_clause = "auth_provider_id = %(auth_provider_id)s"
                sql_parameters = {'auth_provider_id': auth_provider_id}
                
            elif 'user_uuid' in payload_json['user']:
                user_uuid = str(payload_json['user']['user_uuid'])
                where_clause = "user_uuid = %(user_uuid)s::UUID"
                sql_parameters = {'user_uuid': user_uuid}
            else:
                log.error(f">> process_post_method: Invalid search query")
                return return_error(503, 'Invalid search query')

            sql_statement = (f"""
                -- Retrieve single User
                SELECT
                    row_to_json(t)
                FROM
                    (
                        SELECT
                            u.user_uuid AS user_uuid,
                            u.organization_uuid AS organization_uuid,
                            sr.organization.organization_name AS organization_name,
                            u.email_address AS email_address,
                            u.email_verified AS email_verified,
                            u.first_name AS first_name,
                            u.last_name AS last_name,
                            u.phone AS phone,
                            u.job_title AS job_title,
                            u.registered AS registered,
                            u.ts_last_login AS ts_last_login,
                            u.tags AS tags,
                            u.settings AS settings,
                            (
                                SELECT
                                    json_agg(DISTINCT x.grant) AS user_role_grants
                                FROM
                                    (
                                        SELECT
                                            urm.user_uuid AS user_uuid,
                                            u.auth_provider_id,
                                            row_to_json(jsonb_each(ur.user_role_grants))->>'key' AS grant,
                                            (row_to_json(jsonb_each(ur.user_role_grants))->>'value')::bool AS value
                                        FROM
                                            sr.user u
                                        LEFT JOIN sr.user_role_member urm ON
                                            u.user_uuid = urm.user_uuid
                                            AND u.organization_uuid = urm.organization_uuid
                                        LEFT JOIN sr.user_role ur ON
                                            ur.user_role_id = urm.user_role_id
                                    ) AS x
                                WHERE
                                    x.value
                                    AND x.{where_clause}
                            )
                        FROM
                            sr.user AS u
                        LEFT JOIN sr.organization ON
                            u.organization_uuid = sr.organization.organization_uuid
                        WHERE
                            u.{where_clause}
                        GROUP BY
                            u.user_uuid,
                            organization.organization_name
                    ) AS t;
            """)
            log.debug(sql_statement)

            hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
            cached_data = retrieve_query_response('user', hashed_query)
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
                    log.error(f">> process_post_method: {error}")
                    return return_error(503, error) 

                if response and response[0]:
                    payload = json.dumps(response[0])
                else:
                    payload = ''

                cache_query_response('user', hashed_query, payload)

            log.debug(f":: process_post_method payload: {payload}")

            if payload != '':
                try:
                    payload_json = json.loads(payload)
                    user_uuid = payload_json['user_uuid']
                    update_user_last_login(user_uuid)
                except Exception as error:
                    log.error(f">> process_post_method: {error}")

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': payload
            }
        else:
            return return_error(500, 'Malformed POST JSON payload')
    else:
        return return_error(500, 'process_post_method')

'''
    is_base64
        Test if object is base64 encoded
'''
def is_base64(sb):
    try:
        if isinstance(sb, str):
            # If there's any unicode here, an exception will be thrown and the function will return false
            sb_bytes = bytes(sb, 'ascii')
        elif isinstance(sb, bytes):
            sb_bytes = sb
        else:
            raise ValueError("Argument must be string or bytes")
        # deepcode ignore HandleUnicode: Only care about returning True/False
        return base64.b64encode(base64.b64decode(sb_bytes)) == sb_bytes
    except Exception:
        return False

'''
    update_user_last_login
        Update user Last Login timestamp
'''
def update_user_last_login(user_uuid):
    log.info(':: update_user_last_login')

    sql_parameters = {'user_uuid': user_uuid}

    sql_statement = ("""
        -- Update User ts_last_login
        UPDATE
            sr.user
        SET
            ts_last_login = NOW()
        WHERE
            user_uuid = %(user_uuid)s::UUID
    """)
    log.debug(str(sql_statement))
    log.debug(str(sql_parameters))

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_user_last_login: {error}")
        raise error

    try:
        incr_key_prefix('user')
        incr_key_prefix('participant')
        incr_key_prefix('team_member')
    except:
        log.error('>> incr_key_prefix')

import hashlib
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
    process_get_method
        Process GET method requests
'''
def process_get_method(event):
    log.info(":: process_get_method")

    organization_uuid = None

    if 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']

    grants = get_user_grants(get_user_uuid(event),organization_uuid) + get_be_auth0_scope(event)

    if 'organization_read' not in grants :
        return return_error(401, "Not authorized")

    where_clause = ''
    sql_parameters = []

    # If something passes the grants check above, this can be optional
    # A call to get_user_grants would return empty if organization_uuid does
    # no match what they belong to.
    if organization_uuid:
        where_clause = 'WHERE organization_uuid = %(organization_uuid)s::UUID'
        sql_parameters = {'organization_uuid': organization_uuid}

    sql_statement = (f""" 
        -- Retrieve User(s)
        SELECT
            json_agg(row_to_json(users)) AS users
        FROM
            (
                SELECT
                    e1.user_uuid AS user_uuid,
                    e1.email_address AS email_address,
                    e1.first_name AS first_name,
                    e1.last_name AS last_name,
                    e1.phone AS phone,
                    e1.job_title AS job_title,
                    e1.registered AS registered,
                    e1.ts_last_login AS ts_last_login,
                    e1.tags AS tags,
                    e2.user_roles AS user_roles
                FROM
                    (
                        SELECT
                            user_uuid,
                            email_address,
                            first_name,
                            last_name,
                            phone,
                            job_title,
                            registered,
                            ts_last_login,
                            tags
                        FROM
                            sr.user
                        {where_clause}
                    ) AS e1
                LEFT JOIN LATERAL (
                        SELECT
                            json_agg(a) AS user_roles
                        FROM
                            (
                                SELECT
                                    DISTINCT urm.user_role_id AS user_role_id,
                                    ur.user_role_name AS user_role_name
                                FROM
                                    sr.user_role_member AS urm
                                LEFT JOIN sr.user_role ur ON
                                    urm.user_role_id = ur.user_role_id
                                WHERE
                                    urm.user_uuid = e1.user_uuid
                            ) AS a
                ) AS e2 ON
                TRUE
            ) AS users;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('user', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> process_get_method: {error}")
            return return_error(503, error)

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('user', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

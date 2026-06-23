import botocore.exceptions
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
    process_get_method
        Process GET method requests
'''
def process_get_method(event):
    log.info(":: process_get_method")

    if 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']
    else:
        return return_error('No organization_uuid set', 500)

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) +  get_be_auth0_scope(event)

    if 'invitation_read' not in grants:
        return return_error(401, "Not authorized")

    sql_parameters = []

    sql_statement = (""" 
        -- Retrieve invitations
        SELECT
            json_agg(row_to_json(invitations))
        FROM
            (
                SELECT
                    oi.organization_invitation_uuid,
                    oi.invitation_email,
                    oi.invitation_code,
                    oi.creator_user_uuid,
                    oi.claiming_user_uuid,
                    os.organization_invitation_status_name,
                    to_char(oi.ts_claimed, 'YYYY-MM-DD HH24:MI:SS') AS ts_claimed,
                    to_char(oi.ts_expires, 'YYYY-MM-DD HH24:MI:SS') AS ts_expires,
                    NOW() > oi.ts_expires as invitation_expired,
                    to_char(oi.ts_created, 'YYYY-MM-DD HH24:MI:SS') AS ts_created
                FROM
                    sr.organization_invitation AS oi
                LEFT JOIN sr.organization_invitation_status os ON 
                    oi.organization_invitation_status_id = os.organization_invitation_status_id
                WHERE
                    oi.organization_uuid = %(organization_uuid)s::UUID
                ORDER BY
                    oi.ts_modified
            ) invitations;
    """)
    sql_parameters = {'organization_uuid': organization_uuid}

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('organization_invitation', hashed_query)
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
            log.error(f">> process_get_method: {error}")
            return return_error(503, error) 

        if not response or not response[0]:
            payload = '[]'
        else:
            payload = json.dumps(response[0])

        try:
            cache_query_response('organization_invitation', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

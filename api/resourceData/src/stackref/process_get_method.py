import botocore.exceptions
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
    if 'x-sr-event-uuid' in event['headers'] and event['headers']['x-sr-event-uuid'] != "undefined":
        event_uuid = event['headers']['x-sr-event-uuid']
    elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
        event_uuid = event['queryStringParameters']['event_uuid']

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    sql_parameters = []
    where_clause = ''

    # Check if requester's grant permits either:
    #   - Able to read all Events in the Organization (event_read)
    #   - Is a Participant in the queried Event
    authorized = (
        'event_read' in grants,
        len(get_participant_grants(get_user_uuid(event), event_uuid)) > 0
    )
    if not any(authorized):
        return return_error(401, "Not authorized")

    if 'headers' in event and 'x-sr-resource-uuid' in event['headers']: # Requesting single resource info
        resource_uuid = event['headers']['x-sr-resource-uuid']
        where_clause = "WHERE resource_uuid = UUID(:resource_uuid)"
        sql_parameters = [
            {'name':'resource_uuid', 'value':{'stringValue': f'{resource_uuid}'}},
        ]
    elif organization_uuid: # Requesting all Organization resources (usually a WS call)
        where_clause = "WHERE organization_uuid = UUID(:organization_uuid)"
        sql_parameters = [
            {'name':'organization_uuid', 'value':{'stringValue': f'{organization_uuid}'}},
        ]
        if event_uuid: # ... and if specifying resources only for a particular Event
            where_clause = where_clause + " AND event_uuid = UUID(:event_uuid)"
            sql_parameters.append({'name':'event_uuid', 'value':{'stringValue': f'{event_uuid}'}})

    sql_statement = (f""" 
        SELECT
            json_agg(row_to_json(resources))
        FROM 
            (
                SELECT
                    *
                FROM
                    coach.resources
                {where_clause}
                ORDER BY
                    resource_uuid
            ) resources;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('resource', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            response = settings.rds_client.execute_statement(
                secretArn = settings.db_credentials_secrets_store_arn,
                database = settings.database_name,
                resourceArn = settings.db_cluster_arn,
                includeResultMetadata = False,
                continueAfterTimeout = True,
                sql = sql_statement,
                parameters = sql_parameters
            )
        except TypeError as error:
            log.error(f">> process_get_method TypeError: {error}")
            return return_error(503, error)
        except botocore.exceptions.ClientError as error:
            if error.response['Error']['Code'] == 'StatementTimeoutException':
                status_code = 504
            else:
                status_code = 503
            error_message = f"RDS ERROR: {error.response['Error']['Code']}"
            log.error(f">> process_get_method: {error_message}")
            return return_error(status_code, error_message)

        if get(response, 'records.[0][0].stringValue'):
            payload = get(response, 'records.[0][0].stringValue')
        else:
            payload = '[]'

        try:
            cache_query_response('resource', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

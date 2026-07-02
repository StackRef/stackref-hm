import os
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_resources
        Process resources updates from Coach
'''
def process_resources(resources, organization_uuid, event_uuid):
    log.info(":: process_resources")

    response_payload = {'results':[]}

    for resource in resources:
        published_status = str(resource['resource_published'])
        resource_uuid = str(resource['resource_uuid'])
        resource_provider = str(resource['resource_provider'])
        provider_service = str(resource['provider_service'])
        resource_details = json.dumps(resource['resource_details'])
        resource_tags = json.dumps(resource['resource_tags'])
        if published_status == 'false':
            sql_statement = ("""
                INSERT
                    INTO
                    coach.resources (
                        organization_uuid, 
                        event_uuid, 
                        resource_uuid, 
                        resource_provider, 
                        provider_service, 
                        resource_details, 
                        resource_tags, 
                        ts_modified, 
                        ts_checkedin
                    )
                VALUES (
                    UUID(:organization_uuid), 
                    UUID(:event_uuid), 
                    UUID(:resource_uuid), 
                    :resource_provider, 
                    :provider_service, 
                    :resource_details::jsonb, 
                    :resource_tags::jsonb, 
                    NOW(),
                    NOW()
                ) 
                ON
                CONFLICT (resource_uuid) DO
                UPDATE
                SET 
                    ts_modified = NOW(), 
                    ts_checkedin = NOW(), 
                    resource_details = :resource_details::jsonb, 
                    resource_tags = :resource_tags::jsonb;
            """)
            sql_parameters = [
                {'name':'organization_uuid', 'value':{'stringValue': f'{organization_uuid}'}},
                {'name':'event_uuid', 'value':{'stringValue': f'{event_uuid}'}},
                {'name':'resource_uuid', 'value':{'stringValue': f'{resource_uuid}'}},
                {'name':'resource_provider', 'value':{'stringValue': f'{resource_provider}'}},
                {'name':'provider_service', 'value':{'stringValue': f'{provider_service}'}},
                {'name':'resource_details', 'value':{'stringValue': f'{resource_details}'}},
                {'name':'resource_tags', 'value':{'stringValue': f'{resource_tags}'}}
            ]
        else:
            sql_statement = ("""
                UPDATE
                    coach.resources
                SET 
                    ts_checkedin = NOW()
                WHERE
                    resource_uuid = UUID(:resource_uuid);
            """)
            sql_parameters = [
                {'name':'resource_uuid', 'value':{'stringValue': f'{resource_uuid}'}}
            ]
        response_payload['results'].append({
            "resource_uuid": resource['resource_uuid'],
            "update_status": 200
            })
        log.debug(sql_statement)
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
            log.info(str(response))
        except TypeError as error:
            log.error(f">> process_resources TypeError: {error}")
            return return_error(503, error)
        except botocore.exceptions.ClientError as error:
            log.error(f">> process_resources ClientError: {error}")
            # aurora fails automatically after 45 seconds but continues in the db
            # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
            if error.response['Error']['Code'] == 'StatementTimeoutException':
                status_code = 504
            else:
                status_code = 503
            error_message = f"RDS ERROR: {error.response['Error']['Code']}"
            log.error(f">> process_resources: {error_message}")
            return return_error(status_code, error_message)

    response_body = json.dumps(response_payload['results'])
    log.info(f":: process_resources response_body: {response_body}")
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

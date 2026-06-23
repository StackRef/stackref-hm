import os
import botocore.exceptions
from datetime import datetime
import json
import logging
import re

import stackref.settings as settings
from stackref.settings import return_error

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_services
        Process service updates from Coach
'''
def process_services(services):
    log.info(":: process_services")

    response_payload = {'results':[]}

    for service in services:
        log.info(str(service))
        published_status = str(service['service_published'])
        service_id = str(service['service_id'])
        service_image = str(service['service_image'])
        service_command = str(service['service_command'])
        # Double-up single quote if not doubled to escape it for PostgreSQL
        service_command = re.sub("(?<!')'(?!')","''", service_command)
        service_created = str(datetime.strptime(str(service['service_created']), '%Y-%m-%d %H:%M:%S +0000 UTC'))
        service_status = str(service['service_status'])
        service_ports = str(service['service_ports'])
        service_names = str(service['service_names'])
        service_labels = json.dumps(service['service_labels'])
        resource_uuid = str(service['resource_uuid'])
        if published_status == 'false':
            sql_statement = ("""
                INSERT
                    INTO
                    coach.services (
                        service_id, 
                        service_image, 
                        service_command, 
                        service_created, 
                        service_status, 
                        service_ports, 
                        service_names, 
                        service_labels, 
                        resource_uuid, 
                        ts_modified, 
                        ts_checkedin
                    )
                VALUES (
                    :service_id, 
                    :service_image, 
                    :service_command, 
                    :service_created, 
                    :service_status, 
                    :service_ports, 
                    :service_names, 
                    :service_labels::jsonb, 
                    UUID(:resource_uuid), 
                    NOW(),
                    NOW()
                ) 
                ON
                CONFLICT (service_id) DO
                UPDATE
                SET 
                    ts_modified = NOW(), 
                    ts_checkedin = NOW(), 
                    service_status = :service_status, 
                    service_names = :service_names, 
                    service_labels = :service_labels::jsonb;
            """)
            sql_parameters = [
                {'name':'service_id', 'value':{'stringValue': f'{service_id}'}},
                {'name':'service_image', 'value':{'stringValue': f'{service_image}'}},
                {'name':'service_command', 'value':{'stringValue': f'{service_command}'}},
                {'name':'service_created', 'value':{'stringValue': f'{service_created}'}},
                {'name':'service_status', 'value':{'stringValue': f'{service_status}'}},
                {'name':'service_ports', 'value':{'stringValue': f'{service_ports}'}},
                {'name':'service_names', 'value':{'stringValue': f'{service_names}'}},
                {'name':'service_labels', 'value':{'stringValue': f'{service_labels}'}},
                {'name':'resource_uuid', 'value':{'stringValue': f'{resource_uuid}'}}
            ]
        else:
            sql_statement = ("""
                UPDATE coach.services
                SET 
                    ts_checkedin = NOW() 
                WHERE
                    service_id = :service_id;
            """)
            sql_parameters = [
                {'name':'service_id', 'value':{'stringValue': f'{service_id}'}}
            ]
        response_payload['results'].append({
            "service_id": service['service_id'],
            "update_status": 200
            })
        log.debug(f":: process_services sql_statement: {sql_statement}")
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
            log.info(f":: process_services response: {response}")
        except TypeError as error:
            log.error(f">> process_services TypeError: {error}")
            return return_error(503, error)
        except botocore.exceptions.ClientError as error:
            log.error(f">> process_services ClientError: {error.response['Error']['Code']}")
            # aurora fails automatically after 45 seconds but continues in the db
            # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
            if error.response['Error']['Code'] == 'StatementTimeoutException':
                status_code = 504
            else:
                status_code = 503
            error_message = f"RDS ERROR: {error.response['Error']['Code']}"
            log.error(f">> process_services: {error_message}")
            return return_error(status_code, error_message)

    response_body = json.dumps(response_payload['results'])
    log.info(f":: process_services response_body: {response_body}")
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

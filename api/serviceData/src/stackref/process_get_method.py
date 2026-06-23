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
    process_get_method_resource
        Process GET method requests for single resource
'''
def process_get_method_resource(event, resource_uuid):
    log.info(":: process_get_method_resource")

    # Specify the staleness of services or else return default
    service_staleness = settings.resource_service_staleness;
    if 'queryStringParameters' in event and 'staleness' in event['queryStringParameters']:
        if event['queryStringParameters']['staleness'].isdigit():
            service_staleness = event['queryStringParameters']['staleness']

    sql_statement = (f""" 
        SELECT
            row_to_json(s)
        FROM
            (
                SELECT
                    *
                FROM
                    coach.services
                WHERE
                    resource_uuid = UUID(:resource_uuid)
                    AND ts_checkedin >= (
                        NOW() - INTERVAL '{service_staleness} minutes'
                    )
                ORDER BY
                    service_id
            ) AS s;
    """)
    sql_parameters = [
        {'name':'resource_uuid', 'value':{'stringValue': f'{resource_uuid}'}}
    ]
    log.info(sql_statement)
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
        # aurora fails automatically after 45 seconds but continues in the db
        # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
        if error.response['Error']['Code'] == 'StatementTimeoutException':
            status_code = 504
        else:
            status_code = 503
        error_message = f"RDS ERROR: {error.response['Error']['Code']}"
        log.error(f">> process_get_method: {error_message}")
        return return_error(status_code, error_message)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(response)
    }

'''
    process_get_method_org_event
        Process GET method requests for optional organization and event
'''
def process_get_method_org_event(event, organization_uuid, event_uuid):
    log.info(":: process_get_method_org_event")

    sql_parameters = []
    where_clause = ''

    if organization_uuid:
        where_clause = "AND r.organization_uuid = UUID(:organization_uuid)"
        sql_parameters = [
            {'name':'organization_uuid', 'value':{'stringValue': f'{organization_uuid}'}},
        ]
        if event_uuid:
            where_clause = where_clause + " AND r.event_uuid = UUID(:event_uuid)"
            sql_parameters.append({'name':'event_uuid', 'value':{'stringValue': f'{event_uuid}'}})

    # Specify the staleness of services or else return default
    service_staleness = settings.resource_service_staleness;
    if 'queryStringParameters' in event and 'staleness' in event['queryStringParameters']:
        if event['queryStringParameters']['staleness'].isdigit():
            service_staleness = event['queryStringParameters']['staleness']

    sql_statement = (f""" 
        SELECT
            row_to_json(j)
        FROM 
            (
                SELECT 
                    s.service_id,
                    s.service_image, 
                    s.service_command, 
                    s.service_created, 
                    s.service_status, 
                    s.service_ports, 
                    s.service_names, 
                    s.service_labels, 
                    s.service_details, 
                    s.resource_uuid
                FROM
                    coach.services s,
                    coach.resources r
                WHERE
                    s.resource_uuid = r.resource_uuid
                    {where_clause}
                    AND s.ts_checkedin >= (
                        NOW() - INTERVAL '{service_staleness} minutes'
                    )
                ORDER BY
                    s.resource_uuid
            ) AS j;
    """)
    log.info(sql_statement)
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
        log.error(f">> process_get_method_org_event TypeError: {error}")
        return return_error(503, error)
    except botocore.exceptions.ClientError as error:
        # aurora fails automatically after 45 seconds but continues in the db
        # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
        if error.response['Error']['Code'] == 'StatementTimeoutException':
            status_code = 504
        else:
            status_code = 503
        error_message = f"RDS ERROR: {error.response['Error']['Code']}"
        log.error(f">> process_get_method_or_event: {error_message}")
        return return_error(status_code, error_message)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(response)
    }

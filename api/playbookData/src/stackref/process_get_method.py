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
    process_get_method
        Process GET method requests
'''
def process_get_method(event, organization_uuid, event_uuid):
    log.info(":: process_get_method")

    #response_payload = {'playbook':{'flags':[],'plays':[]}}
    response_payload = {'playbook':[]}

    '''
    # Fetch all the flags data
    sql_statement = ( 
        "SELECT row_to_json(r) FROM "
        "(SELECT * FROM coach.flags WHERE organization_uuid = '"
        + organization_uuid +
        "' AND event_uuid = '"
        + event_uuid +
        "' AND (flag_status < 200 OR flag_status IS NULL)"
        " ORDER BY flag_id) AS r;"
    )
    
    try:
        flags_response = settings.rds_client.execute_statement(
            secretArn = settings.db_credentials_secrets_store_arn,
            database = settings.database_name,
            resourceArn = settings.db_cluster_arn,
            includeResultMetadata = False,
            continueAfterTimeout = True,
            sql = sql_statement
        )
    except TypeError as error:
        log.error(error)
        return return_error(503, error)
    except botocore.exceptions.ClientError as error:
        # aurora fails automatically after 45 seconds but continues in the db
        # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
        if error.flags_response['Error']['Code'] == 'StatementTimeoutException':
            status_code = 504
        else:
            status_code = 503
        error_message = 'RDS ERROR: ' + error.flags_response['Error']['Code']
        log.error('>> ' + error_message)
        return return_error(status_code, error_message)
    '''
    # Fetch unprocessed playbooks
    sql_statement = (""" 
        SELECT
            row_to_json(r)
        FROM 
            (
                SELECT
                    *
                FROM
                    coach.playbooks
                WHERE
                    organization_uuid = UUID(:organization_uuid)
                    AND event_uuid = UUID(:event_uuid)
                    AND (
                        playbook_status < 200
                            OR playbook_status IS NULL
                    )
                ORDER BY
                    ts_created
            ) AS r;
    """)
    sql_parameters = [
        {'name':'organization_uuid', 'value':{'stringValue': f'{organization_uuid}'}},
        {'name':'event_uuid', 'value':{'stringValue': f'{event_uuid}'}}
    ]
    log.info(sql_statement)
    try:
        playbook_response = settings.rds_client.execute_statement(
            secretArn = settings.db_credentials_secrets_store_arn,
            database = settings.database_name,
            resourceArn = settings.db_cluster_arn,
            includeResultMetadata = False,
            continueAfterTimeout = True,
            sql = sql_statement,
            parameters = sql_parameters
        )
    except TypeError as error:
        error_message = f"RDS ERROR: {error}"
        log.error(f">> process_get_method TypeError: {error_message}")
        return return_error(503, error_message)
    except botocore.exceptions.ClientError as error:
        error_message = 'RDS boto3 ERROR: ' + str(error)
        log.error(f">> process_get_method ClientError: {error_message}")
        return return_error(504, error_message)

    # Now put it all together

    for pr in playbook_response['records']:
        log.info(pr)
        for prr in pr:
            log.info(prr)
            response_payload['playbook'].append(json.loads(prr['stringValue']))

    '''
    for fr in flags_response['records']:
        for frr in fr:
            response_payload['playbook']['flags'].append(json.loads(frr['stringValue']))
    '''

    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

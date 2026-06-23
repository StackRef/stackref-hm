from os import pardir
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
    process_playbooks
        Process a received playbook payload
'''
def process_playbooks(playbook, organization_uuid, event_uuid):
    log.info(":: process_playbooks")

    response_payload = {'results':[]}

    for item in playbook:
        log.info(item)
        playbook_uuid = str(item['playbook_uuid'])
        if 'playbook_status' in item:
            if item['playbook_status'] > 100:
                playbook_status = item['playbook_status']
                sql_statement = ("""
                    UPDATE
                        coach.playbooks
                    SET
                        playbook_status = :playbook_status,
                        ts_modified = NOW()
                    WHERE
                        playbook_uuid = UUID(:playbook_uuid) 
                    RETURNING
                        playbook_uuid,
                        playbook_status;
                """)
                sql_parameters = [
                    {'name':'playbook_status', 'value':{'doubleValue': playbook_status}},
                    {'name':'playbook_uuid', 'value':{'stringValue': f'{playbook_uuid}'}}
                ]
        else:
            playbook_plays = json.dumps(item['playbook_plays'])
            sql_statement = ("""
                INSERT
                    INTO
                    coach.playbooks (
                        playbook_uuid,
                        organization_uuid,
                        event_uuid,
                        playbook_plays,
                        ts_modified
                    )
                VALUES (
                    UUID(:playbook_uuid),
                    UUID(:organization_uuid),
                    UUID(:event_uuid),
                    :playbook_plays::jsonb,
                    NOW()
                )
                RETURNING playbook_uuid,
                    playbook_status;
            """)
            sql_parameters = [
                {'name':'playbook_uuid', 'value':{'stringValue': f'{playbook_uuid}'}},
                {'name':'organization_uuid', 'value':{'stringValue': f'{organization_uuid}'}},
                {'name':'event_uuid', 'value':{'stringValue': f'{event_uuid}'}},
                {'name':'playbook_plays', 'value':{'stringValue': f'{playbook_plays}'}}
            ]
        try:
            log.info(sql_statement)
            response = settings.rds_client.execute_statement(
                secretArn = settings.db_credentials_secrets_store_arn,
                database = settings.database_name,
                resourceArn = settings.db_cluster_arn,
                includeResultMetadata = False,
                continueAfterTimeout = True,
                sql = sql_statement,
                parameters = sql_parameters
            )
            playbook_uuid = str(response['records'][0][0]['stringValue'])
            playbook_status = str(response['records'][0][1]['longValue']) # Unused??
        except TypeError as error:
            log.error(f">> process_playbooks TypeError: {error}")
            return return_error(503, error)
        except botocore.exceptions.ClientError as error:
            log.error(f">> process_playbooks ClientError: {error.response['Error']['Code']}")
            # aurora fails automatically after 45 seconds but continues in the db
            # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
            if error.response['Error']['Code'] == 'StatementTimeoutException':
                status_code = 504
            else:
                status_code = 503
            error_message = f"RDS ERROR: {error.response['Error']['Code']}"
            log.error(f">> process_playbooks: {error_message}")
            return return_error(status_code, error_message)

        response_payload['results'].append({
            "playbook_uuid": playbook_uuid,
            "playbook_status": 200
            })

    response_body = json.dumps(response_payload['results'])
    log.info(f":: process_playbooks response_body: {response_body}")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

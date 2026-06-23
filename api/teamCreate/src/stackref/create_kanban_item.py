import boto3
import json
import logging

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
'''
def create_kanban_item(team_member_uuid, team_uuid, item_title):

    lambda_client = boto3.client('lambda')

    payload_body = {
        'action': 'add',
        'kanban_item': {
            'team_uuid': team_uuid,
            'kanban_item_status_id': 1,
            'kanban_item_issuer_uuid': team_member_uuid,
            'kanban_item_owner_uuid': team_member_uuid,
            'kanban_item_details': {
                'item_title': item_title
            }
        }
    }

    payload = {
        'requestContext': {
            'intFnName': 'kanbanUpdate'
        },
        'body': json.dumps(payload_body)
    }

    payload_bytes = bytes(json.dumps(payload), encoding='utf8')

    try:
        response = lambda_client.invoke(
            FunctionName='kanbanUpdate',
            InvocationType='RequestResponse',
            LogType='None',
            Payload=payload_bytes
        )
        log.debug(response)
        return response
    except Exception as error:
        log.error(f'>> create_kanban_item: {error}')
        return f'>> create_kanban_item: {error}'


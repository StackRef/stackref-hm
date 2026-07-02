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
def complete_event(event_uuid):

    lambda_client = boto3.client('lambda')

    payload_body = {
        'action': 'complete',
        'event': {
            'event_uuid': event_uuid
        }
    }

    payload = {
        'requestContext': {
            'intFnName': 'Kickoff'
        },
        'body': json.dumps(payload_body)
    }

    payload_bytes = bytes(json.dumps(payload), encoding='utf8')

    try:
        response = lambda_client.invoke(
            FunctionName='eventUpdate',
            InvocationType='RequestResponse',
            LogType='None',
            Payload=payload_bytes
        )
        log.debug(response)
        return response
    except Exception as error:
        log.error(f'>> complete_event: {error}')
        return f'>> complete_event: {error}'


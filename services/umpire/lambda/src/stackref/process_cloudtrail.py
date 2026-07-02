import base64
import boto3
import gzip
import json
import logging

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)


def process_cloudtrail(awslogs):
    '''
        Processes CloudTrail events and invokes the tatorWebsocketEventBridge Lambda function

        Args:
            awslogs (dict): The CloudTrail logs that triggered the event

        Returns:
            dict: The response from the invoked Lambda function
    '''
    log_data = awslogs['data']
    decoded_data = base64.b64decode(log_data)
    decompressed_data = gzip.decompress(decoded_data)
    log_events = decompressed_data.decode('utf-8')
    parsed_events = json.loads(log_events)

    lambda_client = boto3.client('lambda')

    for event in parsed_events['logEvents']:
        log.debug(f":: message: {json.dumps(json.loads(event['message']), indent=4)}")
        message = json.loads(event['message'])

        account_id = None
        principal_id = None
        event_source = None
        event_name = None
        request_parameters = {}
        response_elements = {}

        if 'userIdentity' in message:
            if 'accountId' in message['userIdentity']:
                account_id = message['userIdentity']['accountId'];
                log.debug(f":: account_id: {account_id}")
            if 'principalId' in message['userIdentity']:
                principal_id = message['userIdentity']['principalId'];
                log.debug(f":: principal_id: {principal_id}")
        if 'eventSource' in message:
            event_source = message['eventSource']
            log.debug(f":: event_source: {event_source}")
        if 'eventName' in message:
            event_name = message['eventName'];
            log.debug(f":: event_name: {event_name}")
        if 'requestParameters' in message:
            request_parameters = message['requestParameters']
        if 'responseElements' in message:
            response_elements = message['responseElements']

        if event_source is not None:
            payload_body = {
                'event_source': event_source,
                'account_id': account_id,
                'principal_id': principal_id,
                'event_name': event_name,
                'request_parameters': request_parameters,
                'response_elements': response_elements
            }

            payload = {
                'requestContext': {
                    'intFnName': 'Umpire'
                },
                'body': json.dumps(payload_body)
            }

            payload_bytes = bytes(json.dumps(payload), encoding='utf8')

            try:
                response = lambda_client.invoke(
                    FunctionName='tatorWebsocketEventBridge',
                    InvocationType='RequestResponse',
                    LogType='None',
                    Payload=payload_bytes
                )
                log.debug(response)
                return response
            except Exception as error:
                log.error(f'>> process_cloudtrail: {error}')
                return f'>> process_cloudtrail: {error}'

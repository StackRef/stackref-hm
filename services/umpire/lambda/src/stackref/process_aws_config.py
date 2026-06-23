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


def process_aws_config(config_item):
    '''
        Processes AWS Config events and invokes the tatorWebsocketEventBridge Lambda function

        Args:
            config_item (dict): The AWS Config item that triggered the event

        Returns:
            dict: The response from the invoked Lambda function
    '''
    log.debug(':: process_aws_config')

    lambda_client = boto3.client('lambda')

    account_id = None

    if config_item is not None:
        account_id = config_item['awsAccountId']
        payload_body = {
            'event_source': 'aws.config',
            'account_id': account_id,
            'config_item': config_item
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
            log.error(f'>> process_aws_config: {error}')
            return f'>> process_aws_config: {error}'

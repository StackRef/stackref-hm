import botocore.exceptions
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import json
import logging

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)

'''
'''
def process_ddb_message(record):
    log.info(':: process_ddb_message')

    if 'eventName' in record and record['eventName'] != 'INSERT':
        log.info(f':: Ignoring {record["eventName"]} events')
        return

    if 'NewImage' in record['dynamodb']:
        ddb_item = record['dynamodb']['NewImage']
    else:
        log.info(f':: No NewImage in record: {record}')
        return

    try:
        process_message(ddb_item)
    except Exception as error:
        log.error(f'>> process_ddb_message: {error}')
        raise error

'''
'''
def process_message(ddb_item):
    if not 'recipient_uuid' in ddb_item:
        log.info(f':: No recipient_id set')
        return

    message = str(ddb_item['content']['S'])
    notification_uuid = ddb_item['notification_uuid']['S']
    timestamp = str(ddb_item['timestamp']['N'])
    recipient_uuid = ddb_item['recipient_uuid']['S']
    is_read = bool(ddb_item['is_read']['BOOL'])

    log.info(f":: process_message: '{message}' to User: {recipient_uuid}")

    apigw = boto3.client('apigatewaymanagementapi', endpoint_url=f'https://{settings.ws_endpoint}')
    dynamodb = boto3.client('dynamodb')

    connected_clients = None

    try:
        connected_clients, connected_users = get_user_connected_clients(recipient_uuid)
    except Exception as error:
        log.error(f'>> process_message: {error}')

    if connected_clients:
        message_payload = {
            'notification': {
                'notification_uuid': notification_uuid,
                'timestamp': timestamp,
                'content': message,
                'is_read': is_read
            }
        }
        for connection_id in connected_clients:
            try:
                send_response = apigw.post_to_connection(Data=json.dumps(message_payload), ConnectionId=connection_id)
                log.info(f":: Posted notification to connection {connection_id}, got response {send_response}")
            except botocore.exceptions.ClientError:
                log.info(f">> Couldn't post to connection {connection_id}. Removing.")
                try:
                    dynamodb.delete_item(TableName=settings.ws_connections_table, Key={'connection_id': {'S': connection_id}})
                except botocore.exceptions.ClientError as error:
                    log.error(f">> Couldn't remove connection {connection_id}")
                    raise error
            except apigw.exceptions.GoneException:
                log.info(f":: Connection {connection_id} is gone. Removing.")
                try:
                    dynamodb.delete_item(TableName=settings.ws_connections_table, Key={'connection_id': {'S': connection_id}})
                except botocore.exceptions.ClientError as error:
                    log.error(f">> Couldn't remove connection {connection_id}")
                    raise error
    else:
        log.info(':: No connected clients to post to')

'''
'''
def get_user_connected_clients(user_uuid):
    log.info(f':: get_user_connected_clients: {user_uuid}')

    dynamodb = boto3.client('dynamodb')

    connections = []
    connection_ids = []
    user_uuids = [user_uuid]

    try:
        response = dynamodb.scan(
            TableName = settings.ws_connections_table,
            FilterExpression = 'contains(user_uuid, :uid)',
            ProjectionExpression = '#cid',
            ExpressionAttributeNames = {'#cid': 'connection_id'},
            ExpressionAttributeValues = {':uid': {'S': user_uuid}}
        )
        connections = response['Items']
        log.debug(json.dumps(connections, cls=JSONEncoder))
        connection_ids = [connection['connection_id']['S'] for connection in connections]
    except Exception as error:
        log.error(f'>> get_user_connected_clients: {error}')
        raise error

    return connection_ids, user_uuids

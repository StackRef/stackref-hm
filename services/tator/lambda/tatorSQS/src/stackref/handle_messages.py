import botocore.exceptions
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import hashlib
import json
import logging
import time
import uuid

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
def process_sqs_message(record):
    log.info(':: process_sqs_message')

    try:
        message = str(record['body'])
        room_uuid = str(record['messageAttributes']['roomUuid']['stringValue'])
    except Exception as error:
        log.error(f'>> process_sqs_message: {error}')
        raise error

    try:
        message_json = json.loads(message)
        if message_json['type'] == 'command':
            process_command(message_json, room_uuid)
        else:
            process_message(message, room_uuid)
    except Exception as error:
        log.error(f'>> process_sqs_message: {error}')
        raise error

'''
'''
def process_message(message, entity_uuid):
    log.info(f":: process_message: '{message}' to Room/User: {entity_uuid}")

    entity_type = get_entity_type(entity_uuid)
    room_notification_uuid = None

    if entity_type != 'user' and entity_type != 'notfound':
        room_notification_uuid = str(uuid.uuid4())
        try:
            connected_clients, connected_users = get_room_clients(entity_uuid)
        except Exception as error:
            log.error(f'>> process_message: {error}')
            raise error
    else:
        connected_users = [entity_uuid]

    timestamp_now = str(round(time.time()))

    if connected_users:
        for user_uuid in connected_users:
            try:
                handle_user_notifications_table(timestamp_now, user_uuid, message, room_notification_uuid)
                log.info(f":: Added notification to user {user_uuid} inbox")
            except Exception as error:
                raise error
    else:
        log.info(':: No connected users to notify immediately')

    # Add message to the room inbox
    try:
        if room_notification_uuid:
            handle_room_notifications_table(room_notification_uuid, timestamp_now, entity_uuid, message)
            log.info(f":: Added notification to room {entity_uuid} inbox")
    except Exception as error:
        raise error

'''
'''
def process_command(message_json, entity_uuid):
    log.info(f":: process_command: '{message_json}' to Room/User: {entity_uuid}")

    apigw = boto3.client('apigatewaymanagementapi', endpoint_url=f'https://{settings.ws_endpoint}')
    dynamodb = boto3.client('dynamodb')

    connected_clients = None

    try:
        if message_json['command'] == 'logout':
            connected_clients = get_all_connected_clients()
        else:
            connected_clients, user_uuids = get_room_clients(entity_uuid)
    except Exception as error:
        log.error(f'>> process_command: {error}')

    if not connected_clients:
        try:
            connected_clients, user_uuids = get_user_connected_clients(entity_uuid)
        except Exception as error:
            log.error(f'>> process_command: {error}')

    if connected_clients:
        message_payload = {
            'command': message_json['command'],
            'args': message_json['args'] if 'args' in message_json else None,
            'type': 'command'
        }
        for connection_id in connected_clients:
            try:
                send_response = apigw.post_to_connection(Data=json.dumps(message_payload), ConnectionId=connection_id)
                log.info(f":: Posted command to connection {connection_id}, got response {send_response}")
            except botocore.exceptions.ClientError:
                log.info(f">> Couldn't post to connection {connection_id}. Removing.")
                try:
                    dynamodb.delete_item(TableName = settings.ws_connections_table, Key = {'connection_id': {'S': connection_id}})
                except botocore.exceptions.ClientError as error:
                    log.error(f">> Couldn't remove connection {connection_id}")
                    raise error
            except apigw.exceptions.GoneException:
                log.info(f":: Connection {connection_id} is gone. Removing.")
                try:
                    dynamodb.delete_item(TableName = settings.ws_connections_table, Key = {'connection_id': {'S': connection_id}})
                except botocore.exceptions.ClientError as error:
                    log.error(f">> Couldn't remove connection {connection_id}")
                    raise error
    else:
        log.info(':: No connected clients to post to')

'''
'''
def get_all_connected_clients():
    log.info(':: get_all_connected_clients')

    dynamodb = boto3.client('dynamodb')
    connection_ids = []

    try:
        scan_response = dynamodb.scan(
            TableName = settings.ws_connections_table,
            ProjectionExpression = 'connection_id'
        )
        connection_ids = [item['connection_id']['S'] for item in scan_response['Items']]
        log.info(f":: Found {len(connection_ids)} active connections")
    except Exception as error:
        log.error(f">> get_all_connected_clients: {error}")
        raise error

    return connection_ids

'''
'''
def get_room_clients(room_uuid):
    log.info(f':: get_room_clients: {room_uuid}')

    dynamodb = boto3.client('dynamodb')

    connection_ids = []
    user_uuids = []

    try:
        response = dynamodb.get_item(
            TableName = settings.ws_rooms_table,
            Key = {'room_uuid': {'S': room_uuid}},
            ProjectionExpression = 'connection_ids, user_uuids'
        )

        log.debug(response)

        if 'Item' in response and 'connection_ids' in response['Item']:
            connection_ids = response['Item']['connection_ids']['SS']
        log.info(f":: Found {len(connection_ids)} active connections in room {room_uuid}")
        if 'Item' in response and 'user_uuids' in response['Item']:
            user_uuids = response['Item']['user_uuids']['SS']
    except Exception as error:
        log.error(f">> Couldn't get connections: {error}")
        raise error

    return connection_ids, user_uuids

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

'''
'''
def handle_user_notifications_table(timestamp, recipient_uuid, message, room_notification_uuid, sender_uuid='00000000-00000000-00000000-00000000'):
    log.debug(':: handle_user_notifications_table')

    notification_uuid = str(uuid.uuid4())
    ttl = str(round(time.time()) + settings.ddb_long_ttl)

    ddb = boto3.client('dynamodb')

    table_item = {
        'notification_uuid': {
            'S': notification_uuid
        },
        'timestamp': {
            'N': str(timestamp)
        },
        'recipient_uuid': {
            'S': str(recipient_uuid)
        },
        'sender_uuid': {
            'S': str(sender_uuid)
        },
        'content': {
            'S': str(message)
        },
        'is_read': {
            'BOOL': False
        },
        'ttl': {
            'N': ttl
        }
    }

    if room_notification_uuid:
        table_item['room_notification_uuid'] = {'S': str(room_notification_uuid)}

    try:
        response = ddb.put_item(
            TableName = settings.user_notifications_table,
            Item = table_item
        )
    except Exception as error:
        log.error(f'>> handle_user_notifications_table {error}')
        raise error

'''
'''
def handle_room_notifications_table(notification_uuid, timestamp_now, account_owner_uuid, message, sender_uuid='00000000-00000000-00000000-00000000'):
    log.debug(':: handle_room_notifications_table')

    ttl = str(round(time.time()) + settings.ddb_long_ttl)

    ddb = boto3.client('dynamodb')

    table_item = {
        'notification_uuid': {
            'S': str(notification_uuid)
        },
        'timestamp': {
            'N': str(timestamp_now)
        },
        'room_uuid': {
            'S': str(account_owner_uuid)
        },
        'sender_uuid': {
            'S': str(sender_uuid)
        },
        'content': {
            'S': str(message)
        },
        'ttl': {
            'N': ttl
        }
    }

    try:
        response = ddb.put_item(
            TableName = settings.room_notifications_table,
            Item = table_item
        )
    except Exception as error:
        log.error(f'>> handle_room_notifications_table {error}')
        raise error

'''
    entity_type
        Return the entity_type value of the entity_uuid
'''
def get_entity_type(entity_uuid):
    log.info(':: get_entity_type')

    sql_statement = ("""
        -- Return entity_type
        SELECT
            entity_type::VARCHAR
        FROM
            sr.fn_entity_type(%(entity_uuid)s::UUID);
    """)

    sql_parameters = {'entity_uuid': entity_uuid}

    log.debug(sql_statement)
    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('entity_type', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_entity_type: {error}")
            raise error 

        if response and response[0]:
            payload = response[0]
        else:
            payload = 'notfound'

        try:
            if payload != 'notfound':
                cache_query_response('entity_type', hashed_query, payload, 30)
        except:
            log.error(f">> cache_query_response")

    return payload

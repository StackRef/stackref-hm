import boto3
import botocore.exceptions
from boto3.dynamodb.conditions import Key, Attr
from boto3.dynamodb.types import TypeDeserializer
from decimal import Decimal
import json
import logging
import time

import stackref.settings as settings
from stackref.handle_rooms import handle_rooms

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
    process_message
        Process an incoming websocket message
'''
def process_message(connection_id, message):
    log.info(":: process_message")

    user_uuid = None
    room_uuid = None

    try:
        message_json = json.loads(message)
    except:
        log.error(f'>> process_message: Improper JSON string: {message}')
        return { 'statusCode': 500 }

    echo_response = { "status_code": 200 }

    if 'action' in message_json:
        action = message_json['action']
        if action == 'ping':
            ping_database();
            echo_response = { "status_code": 200, "message": "pong" }
        elif action == 'get':
            if 'item' in message_json:
                item = message_json['item']
                if item == 'connection_id':
                    echo_response = { "status_code": 200, "connection_id": connection_id }
                if item == 'notifications':
                    echo_response = { "status_code": 200, "notifications": get_user_notifications(get_user_uuid(connection_id)) }
        elif action == 'set_read':
            if 'notifications' in message_json:
                user_uuid = get_user_uuid(connection_id)
                try:
                    updated_notifications = set_notifications_read(message_json['notifications'])
                    echo_response = { "status_code": 200, "notifications": updated_notifications }
                except Exception as error:
                    log.error(f':: process_message: {error}')
                    echo_response = { "status_code": 200 }
                #echo_response = { "status_code": 200, "notifications": get_user_notifications(user_uuid) }
        elif 'user_uuid' in message_json:
            user_uuid = get_user_uuid(connection_id)
            if user_uuid and user_uuid == message_json['user_uuid']:
                if (action == 'join' or action == 'leave' or 'eject' in action) and 'room_uuid' in message_json:
                    room_uuid = message_json['room_uuid']
                    try:
                        echo_response = handle_rooms(action, connection_id, user_uuid, room_uuid)
                        log.debug(json.dumps(echo_response))
                    except Exception as error:
                        log.error(f'>> process_message: {error}')
                        echo_response = { "status_code": 200, "variant": "error", "message": f"Unable to join room {room_uuid}" }

    apigw = boto3.client('apigatewaymanagementapi', endpoint_url=f'https://{settings.ws_endpoint}')
    dynamodb = boto3.client('dynamodb')

    try:
        send_response = apigw.post_to_connection(Data=json.dumps(echo_response), ConnectionId=connection_id)
        log.info(f":: Posted message to connection {connection_id}, got response {send_response}")
    except botocore.exceptions.ClientError:
        log.info(f">> Couldn't post to connection {connection_id}. Removing.")
        try:
            dynamodb.delete_item(TableName = settings.ws_connections_table, Key = {'connection_id': {'S': connection_id}})
            # If we have info to remove the connection and user from a room, do that
            if user_uuid and room_uuid:
                try:
                    handle_rooms('leave', connection_id, user_uuid, room_uuid) 
                except Exception as error:
                    log.error(f">> Couldn't remove {connection_id}/{user_uuid} from room {room_uuid}")
                    raise
        except botocore.exceptions.ClientError:
            log.error(f">> Couldn't remove connection {connection_id}")
            raise
    except apigw.exceptions.GoneException:
        log.info(f":: Connection {connection_id} is gone. Removing.")
        try:
            dynamodb.delete_item(TableName = settings.ws_connections_table, Key = {'connection_id': {'S': connection_id}})
            # If we have info to remove the connection and user from a room, do that
            if user_uuid and room_uuid:
                try:
                    handle_rooms('leave', connection_id, user_uuid, room_uuid) 
                except Exception as error:
                    log.error(f">> Couldn't remove {connection_id}/{user_uuid} from room {room_uuid}")
                    raise
        except botocore.exceptions.ClientError:
            log.error(f">> Couldn't remove connection {connection_id}")
            raise

    return { 'statusCode': 200 }

'''
'''
def get_connected_clients():
    log.info(':: get_connected_clients')

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
        log.error(f">> get_connected_clients: {error}")
        raise error

    return connection_ids 

'''
'''
def get_user_uuid(connection_id):
    log.info(':: get_user_uuid')
    dynamodb = boto3.client('dynamodb')

    try:
        response = dynamodb.get_item(
            TableName = settings.ws_connections_table,
            Key = {'connection_id': {'S': connection_id}}
        )
        if 'Item' in response:
            connection = response['Item']
        else:
            connection = None

        if connection and 'user_uuid' in connection:
            return connection['user_uuid']['S']
        else:
            return None
    except Exception as error:
        log.error(f'>> get_user_uuid: {error}')
        raise error

'''
    apigw = boto3.client('apigatewaymanagementapi', endpoint_url=f'https://{settings.ws_endpoint}')
    table = boto3.resource('dynamodb').Table(settings.ws_connections_table)

    try:
        connected_clients = get_connected_clients()
    except Exception as error:
        log.error(f'>> process_message: {error}')
        raise

    for connection_id in connected_clients:
        try:
            send_response = apigw.post_to_connection(Data=message, ConnectionId=connection_id)
            log.info(f":: Posted message to connection {connection_id}, got response {send_response}")
        except botocore.exceptions.ClientError:
            log.error(">> Couldn't post to connection %s.", connection_id)
        except apigw.exceptions.GoneException:
            log.info(f":: Connection {connection_id} is gone, removing")
            try:
                table.delete_item(Key={'connection_id': connection_id})
            except botocore.exceptions.ClientError:
                log.error(f">> Couldn't remove connection {connection_id}")
                raise
'''

'''
    ping_database
        Simple SELECT query to keep database from going to sleep
'''
def ping_database():

    sql_statement = ("""
    -- Simple "ping" of database
    SELECT 1;
    """)

    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, None)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> ping_database: {error}")
        raise error

    return

'''
'''
def get_user_notifications(user_uuid):
    log.info(':: get_user_notifications')
    dynamodb = boto3.client('dynamodb')

    notifications = []

    if user_uuid:
        try:
            response = dynamodb.scan(
                TableName = settings.user_notifications_table,
                FilterExpression = 'contains(recipient_uuid, :uid)',
                ExpressionAttributeNames = {
                    '#nid': 'notification_uuid',
                    '#c': 'content',
                    '#ts': 'timestamp',
                    '#isread': 'is_read'
                },
                ExpressionAttributeValues = {':uid': {'S': user_uuid}},
                ProjectionExpression = '#nid, #c, #ts, #isread'
            )
            notifications = []
            deserializer = TypeDeserializer()
            for item in response['Items']:
                notifications.append({k: deserializer.deserialize(v) for k, v in item.items()})
            log.debug(json.dumps(notifications, cls=JSONEncoder))
        except botocore.exceptions.ClientError:
            log.error(">> Couldn't get notifications")
        except Exception as error:
            log.error(f'>> get_user_notifications: {error}')

    return json.loads(json.dumps(notifications, cls=JSONEncoder))

'''
'''
def set_notifications_read(notifications):
    log.info(':: set_user_notifications_read')
    client = boto3.client('dynamodb')

    ttl = str(round(time.time()) + settings.ddb_long_ttl)

    updated_notifications = []
    deserializer = TypeDeserializer()
    log.debug(notifications)

    for notification in notifications:
        if 'notification_uuid' in notification:
            notification_uuid = notification['notification_uuid']
            log.debug(f':: notification_uuid: {notification_uuid}')
            timestamp = str(notification['timestamp'])
            try:
                response = client.update_item(
                    TableName = settings.user_notifications_table,
                    Key = {
                        'notification_uuid': {'S': notification_uuid},
                        'timestamp': {'N': timestamp}
                    },
                    UpdateExpression = "SET #isread = :isread, #t = :t",
                    ConditionExpression = "attribute_exists(notification_uuid)",
                    ExpressionAttributeNames = {
                        '#isread' : 'is_read',
                        '#t' : 'ttl'
                    },
                    ExpressionAttributeValues = {
                        ':isread': {'BOOL': True},
                        ':t': {'N': ttl}
                    },
                    ReturnValues="ALL_NEW"
                )
                log.debug(f':: response: {response}')
                updated_notifications.append({k: deserializer.deserialize(v) for k, v in response['Attributes'].items()})
            except Exception as error:
                log.error(f'>> set_notifications_read: {error}')

    return json.loads(json.dumps(updated_notifications, cls=JSONEncoder))


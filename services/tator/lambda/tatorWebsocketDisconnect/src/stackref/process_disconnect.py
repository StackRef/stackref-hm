import boto3
from boto3.dynamodb.conditions import Key, Attr
import logging
import time

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_disconnect
        Process a disconnecting websocket connection
'''
def process_disconnect(connection_id):
    log.info(":: process_disconnect")

    try:
        handle_connection_table(connection_id)
        handle_room_table(connection_id)
    except Exception as error:
        log.error(f'>> process_disconnect: {error}')
        raise

    return { 'statusCode': 200, 'body': 'successfully connected' }

def handle_connection_table(connection_id):
    log.debug(':: handle_connection_table')

    log.info(f':: Deleting {connection_id} from {settings.ws_connections_table}')

    ddb_client = boto3.client('dynamodb')

    delete_response = ddb_client.delete_item(
        TableName = settings.ws_connections_table,
        Key = {
            'connection_id': {
                'S': connection_id
            }
        }
    )
    log.debug(delete_response)

'''
'''
def handle_room_table(connection_id):
    log.info(':: handle_room_table')
    log.debug(f':: connection_id: {connection_id}')

    # create a DynamoDB client
    client = boto3.client('dynamodb')

    # scan for rooms containing the connection id
    response = client.scan(
        TableName = settings.ws_rooms_table,
        FilterExpression = 'contains(connection_ids, :cid)',
        ProjectionExpression = '#room',
        ExpressionAttributeNames = {'#room': 'room_uuid'},
        ExpressionAttributeValues = {':cid': {'S': connection_id}}
    )

    rooms = response['Items']

    # remove the connection id from each of the rooms found
    for room in rooms:
        room_uuid = room['room_uuid']['S']
        log.debug(f":: connection_id found in room_uuid {room_uuid}")

        # remove the connection id from the room
        try:
            response = client.update_item(
                TableName = settings.ws_rooms_table,
                Key = {'room_uuid': {'S': room_uuid}},
                UpdateExpression = "DELETE connection_ids :cid",
                ExpressionAttributeValues = {':cid': {'SS': [connection_id]}}
            )
            log.debug(response)
        except Exception as error:
            log.error(f'>> handle_room_table: {error}')
            raise

        # set the TTL of the room
        try:
            timestamp_now = round(time.time())
            ttl = timestamp_now + settings.ddb_long_ttl
            response = client.update_item(
                TableName = settings.ws_rooms_table,
                Key = {'room_uuid': {'S': room_uuid}},
                UpdateExpression = "SET #t = :t",
                ExpressionAttributeNames = {'#t': 'ttl'},
                ExpressionAttributeValues = {':t': {'N': str(ttl)}}
            )
            log.debug(response)
        except Exception as error:
            log.error(f'>> handle_room_table: {error}')
            raise

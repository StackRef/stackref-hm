import boto3
import botocore.exceptions
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import json
import logging
import re
import time
import uuid

import stackref.settings as settings
from stackref.grant_functions import *
from stackref.cache_functions import cache_query_response, retrieve_query_response

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)

def handle_rooms(action, connection_id, user_uuid, room_uuid):
    log.debug(':: handle_rooms')

    ddb = boto3.client('dynamodb')

    entity_type = room_entity_type(room_uuid)

    '''
    if action == 'rejoin':
        return rejoin_rooms(connection_id, user_uuid, room_uuid)
    '''
    if action == 'join':
        return join_room(connection_id, entity_type, user_uuid, room_uuid)
    elif action == 'leave':
        return leave_room(connection_id, entity_type, user_uuid, room_uuid)
    elif 'eject' in action:
        ejected_uuid = re.sub('eject-','', action)
        return eject_from_room(entity_type, user_uuid, room_uuid, ejected_uuid)


def join_room(connection_id, entity_type, user_uuid, room_uuid):
    log.debug(':: join_room')

    ddb = boto3.client('dynamodb')

    if entity_type == 'organization':
        grants = get_user_grants(user_uuid, room_uuid)
        if 'organization_read' not in grants:
            log.info(f':: {user_uuid} lacks the proper grants to join organization {room_uuid}')
            return {'status_code':200, 'variant':'error', 'message':f'Unable to join {entity_type} room'}
    elif entity_type == 'event':
        grants = get_participant_grants(user_uuid, room_uuid)
        if len(grants) < 1:
            log.info(f':: {user_uuid} lacks the proper grants to join event room {room_uuid}')
            return {'status_code':200, 'variant':'error', 'message':f'Unable to join {entity_type} room'}
    elif entity_type == 'team':
        grants = get_team_member_grants(user_uuid, room_uuid)
        if len(grants) < 1:
            log.info(f':: {user_uuid} lacks the proper grants to join team room {room_uuid}')
            return {'status_code':200, 'variant':'error', 'message':f'Unable to join {entity_type} room'}
        '''
        else:
            tator_rooms = get_team_room(user_uuid, room_uuid)
            if tator_rooms and 'team_uuid' in tator_rooms:
                room_uuid = tator_rooms['team_uuid']
        '''
    else:
        return {'status_code':200, 'variant':'error', 'message':f'Unable to join room'}

    try:
        get_response = ddb.get_item(
            TableName = settings.ws_rooms_table,
            Key = {
                'room_uuid': {
                    'S': room_uuid
                }
            }
        )
        log.debug(get_response)
    except Exception as error:
        log.error(f'>> join_room: {error}')
        return {'status_code':200,'variant':'error','message':f'Unable to join {entity_type} room'}

    if 'Item' in get_response:
        # Room exists, so add them to it
        log.debug(f":: room_uuid {get_response['Item']['room_uuid']['S']} exists")

        ttl = str(round(time.time()) + settings.ddb_long_ttl)

        try:
            ddb.update_item(
                TableName = settings.ws_rooms_table,
                Key = {'room_uuid':{'S':room_uuid}},
                UpdateExpression = "ADD connection_ids :c, user_uuids :u",
                ExpressionAttributeValues = {
                    ":c": {"SS": [connection_id]},
                    ":u": {"SS": [user_uuid]}
                })

            ddb.update_item(
                TableName = settings.ws_rooms_table,
                Key = {'room_uuid': {'S':room_uuid}},
                UpdateExpression = "SET #t = :t",
                ExpressionAttributeNames = {
                    '#t': 'ttl'
                },
                ExpressionAttributeValues = {
                    ":t": {"N": ttl}
                })

            # Sync room messages they may not already have
            try:
                sync_room_notifications_to_user(user_uuid, room_uuid)
            except Exception as error:
                log.error(f'>> handle_rooms: ${error}')

            return {'status_code': 200, 'variant':'success', 'message':f'Joined {entity_type} room'}
        except Exception as error:
            log.error(f'>> handle_rooms: ${error}')
            return {'status_code': 200, 'variant':'error', 'message':f'Unable to join {entity_type} room'}
    else:
        log.debug(f":: room_uuid {room_uuid} does not exist")
        timestamp_now = round(time.time())
        ttl = str(timestamp_now + settings.ddb_long_ttl)

        table_item = {
            'room_uuid': {
                'S': room_uuid
            },
            'connection_ids': {
                'SS': [connection_id]
            },
            'user_uuids': {
                'SS': [user_uuid]
            },
            'ttl': {
                'N': ttl
            }
        }
        try:
            ddb.put_item(
                TableName = settings.ws_rooms_table,
                Item = table_item
            )
            return {'status_code':200, 'variant':'success', 'message':f'Joined {entity_type} room'}
        except Exception as error:
            log.error(f'>> handle_rooms: {error}')
            return {'status_code':200, 'variant':'error', 'message':f'Unable to join {entity_type} room'}

def leave_room(connection_id, entity_type, user_uuid, room_uuid):
    log.debug(':: leave_room')

    dynamodb = boto3.client('dynamodb')

    try:
        response = dynamodb.update_item(
            TableName = settings.ws_rooms_table,
            Key = {'room_uuid': {'S': room_uuid}},
            UpdateExpression = "DELETE connection_ids :s, user_uuids :u",
            ExpressionAttributeValues = {
                ':s': {'SS': [connection_id]},
                ':u': {'SS': [user_uuid]}
            }
        )
        log.debug(response)

        ttl = str(round(time.time()) + settings.ddb_long_ttl)

        response = dynamodb.update_item(
            TableName = settings.ws_rooms_table,
            Key = {'room_uuid': {'S': room_uuid}},
            UpdateExpression = "SET #t = :t",
            ExpressionAttributeNames = {
                '#t': 'ttl'
            },
            ExpressionAttributeValues = {
                ':t': {'N': ttl}
            }
        )
        log.debug(response) 
        return {'status_code':200, 'variant':'success', 'message':f'Left {entity_type} room'}
    except Exception as error:
        log.error(f'>> leave_room: ${error}')
        return {'status_code':200, 'variant':'error', 'message':f'Unable to leave {entity_type} room'}

'''
'''
def eject_from_room(entity_type, user_uuid, room_uuid, ejected_uuid):
    log.info(':: eject_from_room')

    dynamodb = boto3.client('dynamodb')

    if entity_type == 'organization':
        grants = get_user_grants(user_uuid, room_uuid)
        if 'organization_write' not in grants:
            log.info(f':: {user_uuid} lacks the proper grants to eject from organization {room_uuid}')
            return {'status_code':200, 'variant':'error', 'message':f'Unable to eject {entity_type} room'}
    elif entity_type == 'event':
        grants = get_participant_grants(user_uuid, room_uuid)
        if 'Manager' not in grants:
            log.info(f':: {user_uuid} lacks the proper grants to eject from event room {room_uuid}')
            return {'status_code':200, 'variant':'error', 'message':f'Unable to eject from {entity_type} room'}
    elif entity_type == 'team':
        grants = get_team_member_grants(user_uuid, room_uuid)
        if 'Captain' not in grants:
            log.info(f':: {user_uuid} lacks the proper grants to eject from team room {room_uuid}')
            return {'status_code':200, 'variant':'error', 'message':f'Unable to eject from {entity_type} room'}
    else:
        return {'status_code':200, 'variant':'error', 'message':'Unable to eject from room'}

    try:
        ejected_connection_ids = get_user_connection_ids(ejected_uuid)
        if not ejected_connection_ids:
            return {'status_code':200, 'variant':'error', 'message':f'No connections found for {ejected_uuid} in {entity_type} room'}
        else:
            for cid in ejected_connection_ids:
                ecid = cid['connection_id']
                ttl = str(round(time.time()) + settings.ddb_long_ttl)

                response = dynamodb.update_item(
                    TableName = settings.ws_rooms_table,
                    Key = {'room_uuid': {'S': room_uuid}},
                    UpdateExpression = "SET #t = :t",
                    ExpressionAttributeNames = {
                        '#t': 'ttl'
                    },
                    ExpressionAttributeValues = {
                        ':t': {'N': ttl}
                    }
                )
                response = dynamodb.update_item(
                    TableName = settings.ws_rooms_table,
                    Key = {'room_uuid': room_uuid},
                    UpdateExpression = "DELETE connection_ids :c, user_uuids :u",
                    ExpressionAttributeValues = {
                        ':c': {'SS': [ecid]},
                        ':u': {'SS': [ejected_uuid]}
                    },
                    ReturnValues = "UPDATED_NEW"
                )
                log.debug(response)

            # Now update the room's TTL
            try:
                ttl = str(round(time.time()) + settings.ddb_long_ttl)
                response = dynamodb.update_item(
                    TableName = settings.ws_rooms_table,
                    Key = {'room_uuid': room_uuid},
                    UpdateExpression = "SET ttl = :t",
                    ExpressionAttributeValues={
                        ':t': {'N': ttl}
                    }
                )
                log.debug(response)
            except Exception as error:
                log.error(f'>> eject_from_room: {error}')

            return {'status_code':200, 'variant':'success', 'message':f'Ejected {ejected_uuid} from {entity_type} room'}
    except Exception as error:
        log.error(f'>> leave_room: ${error}')
        return {'status_code':200, 'variant':'error', 'message':f'Unable to eject from {entity_type} room'}

'''
    room_entity_type
        Return the entity_type value of the room entity_uuid
'''
def room_entity_type(entity_uuid):
    log.info(':: room_entity_type')

    sql_statement = ("""
        -- Return room entity_type
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
            log.error(f">> room_entity_type: {error}")
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

'''
'''
def get_user_connection_ids(user_uuid):
    log.info(f':: get_user_connection_ids for {user_uuid}')

    dynamodb = boto3.client('dynamodb')

    connections = []
    connection_ids = []

    try:
        response = dynamodb.scan(
            TableName = settings.ws_connections_table,
            FilterExpression = 'contains(user_uuid, :user)',
            ProjectionExpression = '#cid',
            ExpressionAttributeNames = {'#cid': 'connection_id'},
            ExpressionAttributeValues = {':user': {'S': user_uuid}}
        )
        connections = response['Items']
        log.debug(json.dumps(connections, cls=JSONEncoder))
        connection_ids = [connection['connection_id']['S'] for connection in connections]
    except Exception as error:
        log.error(f'>> get_user_connection_ids: {error}')
        raise error

    return connection_ids

'''
'''
def get_team_room(user_uuid, event_uuid):
    log.info(':: get_team_room')

    sql_statement = ("""
    -- Get all possible rooms a user_uuid could possibly be able to join
    SELECT
        row_to_json(tator_rooms) AS tator_rooms
    FROM
        (
            SELECT
                o.organization_uuid,
                e.event_uuid,
                t.team_uuid
            FROM
                (
                    SELECT
                        organization_uuid AS organization_uuid
                    FROM
                        sr.user AS u
                    WHERE
                        user_uuid = %(user_uuid)s::UUID
                ) AS o,
                (
                    SELECT
                        participant_uuid,
                        event_uuid AS event_uuid
                    FROM
                        sr.participant AS p
                    WHERE
                        user_uuid = %(user_uuid)s::UUID
                        AND event_uuid = %(event_uuid)s::UUID
                ) AS e
                LEFT JOIN LATERAL (
                    SELECT
                        team_uuid AS team_uuid
                    FROM
                        sr.team_member AS tm
                    WHERE
                        tm.participant_uuid = e.participant_uuid
                ) AS t ON
                TRUE
        ) AS tator_rooms;
    """)

    sql_parameters = {
        'user_uuid': user_uuid,
        'event_uuid': event_uuid
    }
    log.debug(sql_statement)
    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('tator_rooms', hashed_query)
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
            log.error(f">> get_team_room: {error}")
            raise error

        if response and response[0]:
            payload = response[0]
        else:
            payload = None

        try:
            if payload:
                cache_query_response('tator_rooms', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return payload

'''
'''
def sync_room_notifications_to_user(user_uuid, room_uuid):
    log.info(':: sync_room_notifications_to_user')
    dynamodb = boto3.client('dynamodb')
    
    room_notifications = []

    try:
        response = dynamodb.scan(
            TableName = settings.room_notifications_table,
            FilterExpression = 'contains(room_uuid, :rid)',
            ExpressionAttributeNames = {
                '#nid': 'notification_uuid',
                '#sid': 'sender_uuid',
                '#c': 'content',
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={':rid': {'S': room_uuid}},
            ProjectionExpression='#nid, #sid, #c, #ts'
        )
        room_notifications = response['Items']
        log.debug(json.dumps(room_notifications, cls=JSONEncoder))
    except botocore.exceptions.ClientError as error:
        log.error(f">> Couldn't get notifications: {error}")
        raise error
    except Exception as error:
        log.error(f'>> sync_room_notifications_to_user: {error}')
        raise error

    try:
        room_notifications_json = json.loads(json.dumps(room_notifications, cls=JSONEncoder))

        ddb = boto3.client('dynamodb')

        for room_notification in room_notifications_json:
            room_notification_uuid = str(room_notification['notification_uuid']['S'])
            timestamp = str(room_notification['timestamp']['N'])
            sender_uuid = str(room_notification['sender_uuid']['S'])
            content = str(room_notification['content']['S'])
            ttl = str(round(time.time()) + settings.ddb_long_ttl)
            notification_uuid = str(uuid.uuid4())

            table_item = {
                'notification_uuid': {
                    'S': notification_uuid
                },
                'room_notification_uuid': {
                    'S': room_notification_uuid
                },
                'timestamp': {
                    'N': timestamp
                },
                'recipient_uuid': {
                    'S': str(user_uuid)
                },
                'sender_uuid': {
                    'S': sender_uuid
                },
                'content': {
                    'S': content
                },
                'is_read': {
                    'BOOL': False
                },
                'ttl': {
                    'N': ttl
                }
            }

            try:
                response = ddb.query(
                    TableName=settings.user_notifications_table,
                    IndexName='recipient_uuid_timestamp_index',
                    KeyConditionExpression='#rid = :rid and #ts = :ts',
                    FilterExpression='#rnid = :rnid',
                    ExpressionAttributeValues={
                        ':rid': {'S': str(user_uuid)},
                        ':ts': {'N': timestamp},
                        ':rnid': {'S': room_notification_uuid}
                    },
                    ExpressionAttributeNames={
                        '#rid': 'recipient_uuid',
                        '#ts': 'timestamp',
                        '#rnid': 'room_notification_uuid'
                    },
                )
                if response['Count'] == 0:
                    response = ddb.put_item(
                        TableName=settings.user_notifications_table,
                        Item=table_item
                    )
            except Exception as error:
                log.error(f'>> sync_room_notifications_to_user: {error}')
                raise error

    except Exception as error:
        log.error(f'>> sync_room_notifications_to_user: {error}')
        raise error

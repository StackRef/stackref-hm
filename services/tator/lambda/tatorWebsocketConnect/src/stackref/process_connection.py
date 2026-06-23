from sqlite3 import connect
import boto3
import json
import logging
import jwt
from jwt import PyJWKClient
import time

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_connection
        Process an incoming websocket connection request
'''
def process_connection(connection_id, authorization):
    log.info(":: process_connection")

    try:
        user_uuid = None
        decoded_jwt = decode_jwt(authorization)
        if 'https://acme.example.com/sr-user-uuid' in decoded_jwt:
            user_uuid = decoded_jwt['https://acme.example.com/sr-user-uuid']
            handle_connection_table(connection_id, user_uuid)
    except Exception as error:
        log.error(f'>> process_connection: {error}')
        raise

    return { 'statusCode': 200 }

def handle_connection_table(connection_id, user_uuid=None):
    log.debug(':: handle_connection_table')

    ddb = boto3.client('dynamodb')

    timestamp_now = round(time.time())
    ttl = timestamp_now + settings.ddb_long_ttl

    table_item = {
        'connection_id': {
            'S': connection_id
        },
        'ttl': {
            'N': str(ttl)
        }
    }

    if user_uuid:
        table_item['user_uuid'] = { 'S': user_uuid }

    response = ddb.put_item(
        TableName = settings.ws_connections_table,
        Item = table_item
    )


def decode_jwt(authorization):
    log.debug(':: decode_jwt')

    token = authorization.replace('Bearer ','')

    jwks_url = f'https://{settings.auth0_domain}/.well-known/jwks.json'
    jwks_client = PyJWKClient(jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    claimset = jwt.decode(token, options={"verify_signature": False})
    audience = claimset['aud']

    try:
        token_data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=audience,
            options={"verify_exp": True}
        )
        log.debug(token_data)
    except Exception as error:
        log.error(f'>> decode_jwt ${error}')
        raise

    return token_data

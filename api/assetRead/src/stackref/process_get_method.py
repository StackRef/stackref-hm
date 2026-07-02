import boto3
import hashlib
import logging
from base64 import b64encode

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_get_method
        Process GET method requests
'''
def process_get_method(event):
    log.info(":: process_get_method")

    entity_uuid = None
    asset_uuid = None

    if 'x-sr-entity-uuid' in event['headers']:
        entity_uuid = event['headers']['x-sr-entity-uuid']
    elif 'queryStringParameters' in event and 'entity_uuid' in event['queryStringParameters']:
        entity_uuid = event['queryStringParameters']['entity_uuid']

    if 'x-sr-asset-uuid' in event['headers']:
        asset_uuid = event['headers']['x-sr-asset-uuid']
    elif 'queryStringParameters' in event and 'asset_uuid' in event['queryStringParameters']:
        asset_uuid = event['queryStringParameters']['asset_uuid']

    if not entity_uuid or entity_uuid == '' or entity_uuid == 'undefined':
        return return_error(400, "Invalid Entity")
    if not asset_uuid or asset_uuid == '' or asset_uuid == 'undefined':
        return return_error(400, "Invalid Asset")

    try:
        asset_details = get_asset_details(asset_uuid)
    except Exception as error:
        log.error(f'>> process_get_method: {error}')
        raise

    if 'entity_asset_mime_type' not in asset_details:
        return return_error(400, "Invalid Asset MIME Type")

    mime_type = asset_details['entity_asset_mime_type']

    try:
        s3 = boto3.client('s3')

        response = s3.get_object(
            Bucket=f'stackref-entity-assets',
            Key=f'assets/{entity_uuid}/{asset_uuid}'
        )
        payload = response['Body'].read()
    except Exception as error:
        return return_error(500, 'Error reading image data')

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': mime_type
        },
        'isBase64Encoded': True,
        # deepcode ignore HandleUnicode: Ignoring until we notice it's actually a problem
        'body': b64encode(payload)
    }

'''
'''
def get_asset_details(entity_asset_uuid):
    sql_statement = ("""
        -- Retrieve Entity Asset details
        SELECT
            row_to_json(entity_asset)
        FROM (
            SELECT
                COALESCE(entity_asset_mime_type, 'application/octet-stream') AS entity_asset_mime_type
            FROM
                sr.entity_asset
            WHERE
                entity_asset_uuid = %(entity_asset_uuid)s::UUID
        ) AS entity_asset;
    """)
    log.debug(sql_statement)

    sql_parameters = {
        'entity_asset_uuid': entity_asset_uuid
    }

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('entity_asset', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_asset_details: {error}")
            return return_error(503, error)

        if response and response[0]:
            payload = response[0]
        else:
            payload = {}

        try:
            cache_query_response('entity_asset', hashed_query, json.dumps(payload))
        except:
            log.error(f">> cache_query_response")

    return payload

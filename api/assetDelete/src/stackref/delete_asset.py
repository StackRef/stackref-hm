import boto3
import hashlib
import logging

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    delete_asset
        Delete an Asset and return its details
'''
def delete_asset(entity_uuid, asset_uuid):
    log.info(":: delete_asset")

    try:
        delete_from_s3(entity_uuid, asset_uuid)
    except Exception as error:
        log.error(f'>> delete_asset: {error}')
        raise

    try:
        update_db(asset_uuid, entity_uuid)
    except Exception as error:
        log.error(f'>> delete_asset: {error}')
        raise

    return

'''
'''
def delete_from_s3(entity_uuid, asset_uuid):

    s3 = boto3.client('s3')

    bucket_name = f'stackref-entity-assets'
    s3_object_key = f"assets/{entity_uuid}/{asset_uuid}"

    try:
        s3.delete_object(
            Bucket=bucket_name,
            Key=s3_object_key
        )
    except Exception as error:
        log.error(f'>> delete_from_s3: {error}')
        raise

    return

'''
'''
def update_db(asset_uuid, entity_uuid):
    sql_statement = ("""
        -- Delete Entity Asset
        DELETE
        FROM
            sr.entity_asset
        WHERE
            entity_uuid = %(entity_uuid)s::UUID AND
            entity_asset_uuid = %(asset_uuid)s::UUID;
    """)
    sql_parameters = {
        'asset_uuid': asset_uuid,
        'entity_uuid': entity_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_db: {error}")
        raise

    # Everything worked
    try:
        incr_key_prefix('entity_asset')
        entity_type = get_entity_type(entity_uuid)
        if entity_type and entity_type != 'notfound':
            incr_key_prefix(entity_type)
    except Exception as error:
        log.error(f'>> incr_key_prefix: {error}')

    return

'''
    get_entity_type
        Return the entity_type value of the Entity UUID
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

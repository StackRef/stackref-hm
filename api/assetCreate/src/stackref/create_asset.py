import boto3
import hashlib
import logging
#import mimetypes
import urllib.parse
import uuid

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_asset
        Create an Asset and return its details
'''
def create_asset(user_uuid, file_to_process):
    log.info(":: create_asset")

    asset_entity_uuid = file_to_process['asset_entity_uuid']
    asset_type = file_to_process['asset_type']
    original_filename = urllib.parse.quote_plus(file_to_process['file_name'])

    log.debug(f":: Original filename: {original_filename}")
    log.debug(f":: asset_entity_uuid: {asset_entity_uuid}")

    file_data = file_to_process['file_data']
    file_size = len(file_data)
    if file_size > settings.max_file_size:
        raise ValueError(f"The file size exceeds the maximum allowed size of {settings.max_file_size} bytes.")

    #mime_type = mimetypes.guess_type(file_to_process['file_name'])

    asset_uuid = uuid.uuid4()

    try:
        upload_to_s3(user_uuid, asset_entity_uuid, asset_uuid, asset_type, original_filename, file_to_process)
    except Exception as error:
        log.error(f'>> create_asset: {error}')
        raise

    return str(asset_uuid)

'''
'''
def upload_to_s3(user_uuid, entity_uuid, asset_uuid, asset_type, original_filename, file_to_process):

    s3 = boto3.client('s3')

    bucket_name = f'stackref-entity-assets'
    object_key_prefix = 'assets'

    if asset_type == 'invitation_list':
        object_key_prefix = 'invitation_lists'
    s3_object_key = f"{object_key_prefix}/{entity_uuid}/{asset_uuid}"

    try:
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_object_key,
            Body=file_to_process['file_data'],
            ContentType=file_to_process['file_type'],
            Tagging=f'creator_user_uuid={user_uuid}&original_filename={original_filename}'
        )
    except Exception as error:
        log.error(f'>> upload_to_s3: {error}')
        raise

    try:
        update_db(asset_uuid, entity_uuid, asset_type, original_filename, file_to_process['file_type'])
    except Exception as error:
        log.error(f'>> upload_to_s3: {error}')
        raise

    return

'''
'''
def update_db(entity_asset_uuid, entity_uuid, entity_asset_type, entity_asset_filename, entity_asset_mime_type):
    sql_statement = ("""
        -- Create new Entity Asset
        INSERT
        INTO
            sr.entity_asset (
                entity_asset_uuid,
                entity_uuid,
                entity_asset_type_id,
                entity_asset_mime_type,
                entity_asset_filename
            )
        VALUES (
            %(entity_asset_uuid)s::UUID,
            %(entity_uuid)s::UUID,
            COALESCE(
            (
                SELECT
                    entity_asset_type_id
                FROM
                    sr.entity_asset_type
                WHERE
                    entity_asset_type_name = %(entity_asset_type)s
            ), 1),
            %(entity_asset_mime_type)s,
            %(entity_asset_filename)s
        );
    """)
    sql_parameters = {
        'entity_asset_uuid': entity_asset_uuid,
        'entity_uuid': entity_uuid,
        'entity_asset_type': entity_asset_type,
        'entity_asset_mime_type': entity_asset_mime_type,
        'entity_asset_filename': entity_asset_filename
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

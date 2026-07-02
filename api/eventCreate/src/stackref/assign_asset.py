import boto3
import logging

import stackref.settings as settings
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
'''
def assign_asset(organization_uuid, event_uuid, entity_asset):
    log.info(':: assign_asset')

    asset_uuid = entity_asset['asset_uuid']

    try:
        rename_asset(organization_uuid, event_uuid, asset_uuid)
    except Exception as error:
        log.error(f'>> assign_asset: {error}')
        raise

    return

'''
'''
def rename_asset(organization_uuid, event_uuid, asset_uuid):

    s3 = boto3.client('s3')

    bucket_name = f'stackref-entity-assets'
    original_object = f"assets/{organization_uuid}/{asset_uuid}"
    new_object = f"assets/{event_uuid}/{asset_uuid}"

    try:
        s3.copy_object(
            Bucket=bucket_name,
            CopySource={
                'Bucket': bucket_name,
                'Key': original_object
            },
            Key=new_object
        )

        s3.delete_object(
            Bucket=bucket_name,
            Key=original_object
        )
    except Exception as error:
        log.error(f'>> rename_asset: {error}')
        raise

    try:
        update_db(asset_uuid, event_uuid, organization_uuid)
    except Exception as error:
        log.error(f'>> rename_asset: {error}')
        raise

    return

'''
'''
def update_db(asset_uuid, event_uuid, organization_uuid):
    sql_statement = ("""
        -- Update/reassign Entity Asset
        UPDATE
            sr.entity_asset
        SET
            entity_uuid = %(event_uuid)s::UUID,
            ts_modified = NOW()
        WHERE
            entity_uuid = %(organization_uuid)s::UUID AND
            entity_asset_uuid = %(asset_uuid)s::UUID;
    """)
    sql_parameters = {
        'asset_uuid': asset_uuid,
        'event_uuid': event_uuid,
        'organization_uuid': organization_uuid
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
    except:
        log.error('>> incr_key_prefix')

    return

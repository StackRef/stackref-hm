import hashlib
import json
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.coin_bank_transaction import coin_bank_transaction

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)


def log_resource_transaction(event_details):
    """
        log_resource_transaction
            Log the details of the transaction and resource info

        :param event_details: Event details payload
        :return: Success (boolean)
    """ 

    try:
        transaction_value = coin_bank_transaction(event_details)
    except Exception as error:
        log.error(f'>> log_resource_transaction: {error}')
        raise error

    return transaction_value


def resource_uuid_from_cloud_resource_id(cloud_resource_id):
    """
        resource_uuid_from_cloud_resource_id
            If present, return the resource_uuid of the resource ARN/ID

        :param cloud_resource_id: The ARN or ID of the resource (string)
        :return: resource_uuid (string)
    """ 

    if cloud_resource_id is None:
        return None

    sql_parameters = {'cloud_resource_id': cloud_resource_id}

    log.debug(f":: sql_parameters: {sql_parameters}")

    sql_statement = ("""
        -- Retrieve resource_uuid from cloud_resource_id
        SELECT
            cloud_resource_uuid
        FROM
            sr.cloud_resource
        WHERE
            cloud_resource_details->>'cloud_resource_id' = %(cloud_resource_id)s;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('cloud_resource', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = str(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn: 
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> resource_uuid_from_cloud_resource_id: {error}")
            raise error

        if response and response[0]:
            payload = str(response[0])
        else:
            payload = None

        try:
            if payload:
                cache_query_response('cloud_resource', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return payload


def update_resource_in_cloud_resource_table(cloud_resource_uuid, event_details):
    """
        update_resource_in_cloud_resource_table
            Change the resource state in the resources table

        :param event_details: Details from the EventBridge/CloudTrail event
        :return: Success (boolean)
    """ 
    log.debug(':: update_resource_in_cloud_resource_table')
    log.debug(f':: event_details: {event_details}')

    resource_status = event_details['resource_status']

    sql_statement = ("""
        -- Update the resource status
        UPDATE sr.cloud_resource
        SET
            cloud_resource_details = jsonb_set(
                jsonb_set(
                    cloud_resource_details, '{resource_status}', to_jsonb(%(resource_status)s::TEXT)
                ),
                '{update_details}', to_jsonb(%(update_details)s::JSONB)
            ),
            ts_checkedin = NOW(),
            ts_modified = NOW()
        WHERE
            cloud_resource_uuid = %(cloud_resource_uuid)s::UUID; 
    """)
    sql_parameters = {
        'cloud_resource_uuid': cloud_resource_uuid,
        'resource_status': resource_status,
        'update_details': json.dumps(event_details)
    }

    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_resource_in_cloud_resource_table: {error}")
        raise error

    try:
        incr_key_prefix('cloud_resource')
    except:
        log.error('>> incr_key_prefix')


def add_resource_to_cloud_resource_table(event_details):
    """
        add_resource_to_cloud_resource_table
            Add details of the resource to the cloud_resource table

        :param event_details: Details from the EventBridge/CloudTrail event
        :return: Success (boolean)
    """ 

    resource_uuid = uuid.uuid4()

    sql_statement = ("""
        INSERT
            INTO
            sr.cloud_resource (
                cloud_resource_uuid,
                cloud_resource_type_id,
                cloud_resource_details,
                cloud_account_owner_uuid,
                ts_modified,
                ts_checkedin
            )
        VALUES (
            %(resource_uuid)s::UUID,
            (
                SELECT
                    cloud_resource_type_id
                FROM
                    sr.cloud_resource_type
                WHERE
                    cloud_resource_type_name = %(cloud_resource_type_name)s
            ),
            %(resource_details)s::JSONB,
            (
                SELECT
                    cloud_account_owner_uuid
                FROM
                    sr.cloud_account
                WHERE
                    cloud_account_cloud_id = %(cloud_account_cloud_id)s
            )::UUID,
            NOW(),
            NOW()
        ) 
    """)
    sql_parameters = {
        'resource_uuid': resource_uuid,
        'cloud_resource_type_name': event_details['resource_type'],
        'resource_details': json.dumps(event_details),
        'cloud_account_cloud_id': event_details['account_id']
    }

    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> add_resource_to_cloud_resource_table: {error}")
        raise error

    try:
        incr_key_prefix('cloud_resource')
    except:
        log.error('>> incr_key_prefix')

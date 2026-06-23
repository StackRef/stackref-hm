import hashlib
import logging

import stackref.settings as settings
from stackref.coin_bank_transaction import coin_bank_transaction
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_entitlement
        Update the AWS Marketplace entitlement details in our DB
'''
def process_entitlement(organization_uuid, payload_json):
    log.info(":: process_entitlement")

    action = payload_json['action']

    entitlements = []

    try:
        entitlements = get_org_entitlements(organization_uuid)
    except Exception as error:
        log.error(f'>> process_entitlement: {error}')
        raise error

    if len(entitlements) > 0 and 'entitlement_uuid' in entitlements[0]:
        entitlement = entitlements[0]
        entitlement_uuid = str(entitlement['entitlement_uuid'])
        entitlement_value = int(entitlement['entitlement_value'])
        entitlement_value_used = int(entitlement['entitlement_value_used'])

        if entitlement_value == entitlement_value_used:
            return [{
                "entitlement_uuid": str(entitlements[0]['entitlement_uuid']),
                "organization_uuid": organization_uuid,
                "transaction_value": 0
            }]

        if entitlement['entitlement_dimension'] == 'StackCash100':
            transaction_value = (entitlement_value - entitlement_value_used) * 100
        elif entitlement['entitlement_dimension'] == 'StackCash1000':
            transaction_value = (entitlement_value - entitlement_value_used) * 1000
        else:
            transaction_value = 0

        # Process the bank transaction
        try:
            executed_transaction_value = coin_bank_transaction(organization_uuid, entitlement_uuid, transaction_value)
        except Exception as error:
            log.error(f'>> process_entitlement: {error}')
            raise error

        sql_statement = ("""
            -- Use up the entitlement
            UPDATE
                sr.amazon_marketplace_entitlement
            SET
                entitlement_value_used = %(entitlement_value_used)s,
                ts_modified = NOW()
            WHERE
                entitlement_uuid = %(entitlement_uuid)s::UUID AND
                organization_uuid = %(organization_uuid)s::UUID;
        """)

        sql_parameters = {
            'entitlement_value_used': entitlement_value,
            'entitlement_uuid': str(entitlements[0]['entitlement_uuid']),
            'organization_uuid': organization_uuid
        }
        log.debug(sql_statement)
        log.debug(sql_parameters)

        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
        except Exception as error:
            log.error(f">> process_entitlement: {error}")
            return return_error(503, error) 

        try:
            incr_key_prefix('amazon_marketplace_entitlement')
            incr_key_prefix('organization')
        except:
            log.error('>> incr_key_prefix')

        return [{
            "status_code": 200,
            "entitlement_uuid": str(entitlements[0]['entitlement_uuid']),
            "organization_uuid": organization_uuid,
            "transaction_value": transaction_value
        }]
    else:
        return [{
            "status_code": 204,
            "organization_uuid": organization_uuid,
            "transaction_value": 0
        }]

'''
    get_org_entitlements
        Get existing entitlement from our DB if any exist
'''
def get_org_entitlements(organization_uuid):
    log.info(":: get_org_entitlements")

    sql_parameters = {
        'organization_uuid': organization_uuid,
        'entitlement_product_code': settings.marketplace_product_code
    }

    sql_statement = ("""
        -- Retrieve any existing unused entitlements for Organization
        SELECT
            json_agg(row_to_json(entitlements))
        FROM
            (
                SELECT
                    entitlement_uuid,
                    organization_uuid,
                    entitlement_customer_id,
                    entitlement_product_code,
                    entitlement_dimension,
                    entitlement_value,
                    entitlement_value_used,
                    entitlement_expiration_date
                FROM
                    sr.amazon_marketplace_entitlement
                WHERE
                    organization_uuid = %(organization_uuid)s::UUID AND
                    entitlement_product_code = %(entitlement_product_code)s AND
                    entitlement_value > 0 AND
                    entitlement_value_used < entitlement_value AND
                    entitlement_expiration_date > NOW()
            ) AS entitlements;
    """)
    log.debug(sql_statement)
    log.debug(f":: sql_parameters: {sql_parameters}")

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('amazon_marketplace_entitlement', hashed_query)
    cached_data = None # TEMP
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
            log.error(f">> get_entitlements: {error}")
            return return_error(503, error)

        if response and response[0] and response[0] is not None:
            payload = response[0]
        else:
            payload = []

        try:
            cache_query_response('amazon_marketplace_entitlement', hashed_query, json.dumps(payload))
        except:
            log.error(f">> cache_query_response")

    return payload

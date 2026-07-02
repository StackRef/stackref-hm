import hashlib
import logging
import uuid

import stackref.settings as settings
from stackref.coin_bank_transaction import coin_bank_transaction
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_amz_purchase
        Process the StackCash purchase request
'''
def process_amz_purchase(organization_uuid, purchase_details):
    log.info(":: process_amz_purchase")

    entitlements = []

    try:
        entitlements = get_org_entitlements(organization_uuid)
    except Exception as error:
        log.error(f'>> process_amz_purchase: {error}')
        raise error

    if len(entitlements) > 0 and 'entitlement_uuid' in entitlements[0]:
        entitlement = entitlements[0]
        entitlement_uuid = str(entitlement['entitlement_uuid'])

        marketplace_metering_uuid = uuid.uuid4()

        if purchase_details['quantity'] % 1000 == 0:
            dimension = 'StackCash1000'
            dimension_quantity = purchase_details['quantity'] / 1000
        elif purchase_details['quantity'] % 100 == 0:
            dimension = 'StackCash100'
            dimension_quantity = purchase_details['quantity'] / 100
        else:
            return return_error(503, 'Invalid StackCash purchase multiple')

        sql_statement = ("""
            -- Add the purchase to Amazon Marketplace Metering
            INSERT
                INTO
                    sr.amazon_marketplace_metering (
                        marketplace_metering_uuid,
                        entitlement_uuid,
                        dimension,
                        quantity
                    )
                VALUES (
                    %(marketplace_metering_uuid)s::UUID,
                    %(entitlement_uuid)s::UUID,
                    %(dimension)s,
                    %(quantity)s
                );
        """)

        sql_parameters = {
            'marketplace_metering_uuid': marketplace_metering_uuid,
            'entitlement_uuid': entitlement_uuid,
            'dimension': dimension,
            'quantity': dimension_quantity
        }
        log.debug(sql_statement)
        log.debug(sql_parameters)

        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
        except Exception as error:
            log.error(f">> process_amz_purchase: {error}")
            raise error

        try:
            incr_key_prefix('amazon_marketplace_metering')
        except:
            log.error('>> incr_key_prefix')

        # Process the bank transaction
        try:
            transaction_details = {
                'description': 'Organization Amazon Marketplace Metering Purchase',
                'marketplace_metering_uuid': str(marketplace_metering_uuid)
            }
            coin_bank_transaction(organization_uuid, transaction_details, purchase_details['quantity'])
        except Exception as error:
            log.error(f'>> process_amz_purchase: {error}')
            raise error

        return {
            "status_code": 200,
            "marketplace_metering_uuid": str(marketplace_metering_uuid),
            "organization_uuid": str(organization_uuid),
            "transaction_value": purchase_details['quantity']
        }
    else:
        return return_error(500, 'No active Amazon Marketplace Entitlement present')

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
        -- Retrieve any existing active entitlements for Organization
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

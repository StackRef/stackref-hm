import hashlib
import logging
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    update_entitlements
        Update the AWS Marketplace entitlements details in our DB
'''
def update_entitlements(organization_uuid, entitlements):
    log.info(":: update_entitlements")

    # TODO: Just use the first one for now
    entitlement = entitlements['entitlements'][0]

    active_entitlements = get_entitlements(organization_uuid, entitlement)

    if len(active_entitlements) > 0:
        # Already have an active entitlement
        return active_entitlements
    else:
        entitlement_uuid = uuid.uuid4()

        sql_statement = ("""
            -- Add the new entitlement
            INSERT
                INTO
                    sr.amazon_marketplace_entitlement (
                        entitlement_uuid,
                        organization_uuid,
                        entitlement_customer_id,
                        entitlement_customer_aws_account_id,
                        entitlement_product_code,
                        entitlement_dimension,
                        entitlement_value,
                        entitlement_expiration_date
                )
            VALUES (
                %(entitlement_uuid)s::UUID,
                %(organization_uuid)s::UUID,
                %(entitlement_customer_id)s,
                %(entitlement_customer_aws_account_id)s,
                %(entitlement_product_code)s,
                %(entitlement_dimension)s,
                %(entitlement_value)s,
                %(entitlement_expiration_date)s
            );
        """)

        sql_parameters = {
            'entitlement_uuid': entitlement_uuid,
            'organization_uuid': organization_uuid,
            'entitlement_customer_id': entitlement['CustomerIdentifier'],
            'entitlement_customer_aws_account_id': entitlements['customer_aws_account_id'],
            'entitlement_product_code': entitlement['ProductCode'],
            'entitlement_dimension': entitlement['Dimension'],
            'entitlement_value': entitlement['Value']['IntegerValue'],
            'entitlement_expiration_date': entitlement['ExpirationDate']
        }
        log.debug(sql_statement)
        log.debug(sql_parameters)

        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
        except Exception as error:
            log.error(f">> update_entitlements: {error}")
            return return_error(503, error) 

        try:
            incr_key_prefix('amazon_marketplace_entitlement')
            incr_key_prefix('organization')
        except:
            log.error('>> incr_key_prefix')

        return [{
                "entitlement_uuid": entitlement_uuid,
                "organization_uuid": organization_uuid,
                "entitlement_customer_id": entitlement['CustomerIdentifier'],
                "entitlement_customer_aws_account_id": entitlements['customer_aws_account_id'],
                "entitlement_product_code": entitlement['ProductCode'],
                "entitlement_dimension": entitlement['Dimension'],
                "entitlement_value": entitlement['Value']['IntegerValue'],
                "entitlement_value_used": 0,
                "entitlement_expiration_date": entitlement['ExpirationDate']
            }]

'''
    get_entitlements
        Get existing entitlement from our DB if any exist
'''
def get_entitlements(organization_uuid, entitlement):
    log.info(":: get_entitlements")

    if 'ProductCode' in entitlement and entitlement['ProductCode'] == settings.marketplace_product_code:
        sql_parameters = {
            'organization_uuid': organization_uuid,
            'entitlement_product_code': entitlement['ProductCode'],
            'entitlement_customer_id': entitlement['CustomerIdentifier']
        }

        sql_statement = ("""
            -- Retrieve any existing unexpired entitlements for Organization/Customer
            SELECT
                json_agg(row_to_json(entitlements))
            FROM
                (
                    SELECT
                        entitlement_uuid,
                        organization_uuid,
                        entitlement_customer_id,
                        entitlement_customer_aws_account_id,
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
                        entitlement_customer_id = %(entitlement_customer_id)s AND
                        entitlement_value > 0 AND
                        -- entitlement_value_used < entitlement_value AND
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

            if response and response[0]:
                payload = response[0]
            else:
                payload = []

            try:
                cache_query_response('amazon_marketplace_entitlement', hashed_query, json.dumps(payload))
            except:
                log.error(f">> cache_query_response")

        return payload

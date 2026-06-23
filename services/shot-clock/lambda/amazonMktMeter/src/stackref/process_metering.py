import boto3
import logging
from datetime import datetime

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_metering
        Submit unprocessed Amazon Marketplace metering items
'''
def process_metering():
    log.info(":: process_metering")

    try:
        unprocessed_items = get_unprocessed_items()
        log.debug(f':: unprocessed_items: {unprocessed_items}')
    except Exception as error:
        log.error(f':: process_metering: {error}')
        raise error

    if len(unprocessed_items) > 0:
        try:
            metering_uuids, metering_response = submit_metering_records(unprocessed_items)
            log.debug(f':: metering_uuids: {metering_uuids}')
        except Exception as error:
            log.error(f':: process_metering: {error}')
            raise error

        if metering_uuids and metering_response:
            if 'Results' in metering_response:
                for result in metering_response['Results']:
                    amazon_metering_record_id = result['MeteringRecordId']
                    status = result['Status']
                    customer_id = result['UsageRecord']['CustomerIdentifier']
                    dimension = result['UsageRecord']['Dimension']

                    if status == 'Success':
                        sql_statement = ("""
                            -- Update metering records as processed
                            UPDATE
                                sr.amazon_marketplace_metering
                            SET
                                processed = TRUE,
                                amazon_metering_record_id = %(amazon_metering_record_id)s::UUID,
                                ts_modified = NOW()
                            WHERE
                                marketplace_metering_uuid = ANY(%(metering_uuids)s) AND
                                entitlement_uuid = (
                                    SELECT
                                        entitlement_uuid
                                    FROM
                                        sr.amazon_marketplace_entitlement
                                    WHERE
                                        entitlement_customer_id = %(customer_id)s
                                )::UUID AND
                                dimension = %(dimension)s;
                        """)

                        sql_parameters = {
                            'amazon_metering_record_id': amazon_metering_record_id,
                            'metering_uuids': [metering_uuids],
                            'customer_id': customer_id,
                            'dimension': dimension
                        }
                        log.debug(sql_statement)
                        log.debug(sql_parameters)

                        try:
                            with settings.db_conn() as db_conn:
                                with db_conn.cursor() as cur:
                                    cur.execute(sql_statement, sql_parameters)
                        except Exception as error:
                            log.error(f">> process_metering: {error}")
                            raise error
                    else:
                        log.info(f':: Metering status: {status}. Not updating database.')
            else:
                log.info(':: No results present')
    else:
        log.info(':: No unprocessed items to submit')

'''
    get_unprocessed_items
        Retrieve all unprocessed amazon_marketplace_metering items
'''
def get_unprocessed_items():
    log.info(":: get_unprocessed_items")

    sql_statement = ("""
        -- Retrieve any unprocessed Amazon Marketplace metering items
        SELECT
            json_agg(row_to_json(metering))
        FROM
            (
                SELECT
                    amm.marketplace_metering_uuid AS marketplace_metering_uuid,
                    amm.dimension AS dimension,
                    amm.quantity AS quantity,
                    ame.entitlement_customer_id AS entitlement_customer_id,
                    ame.entitlement_product_code AS entitlement_product_code
                FROM
                    sr.amazon_marketplace_metering AS amm
                LEFT JOIN sr.amazon_marketplace_entitlement AS ame ON
                    amm.entitlement_uuid = ame.entitlement_uuid
                WHERE
                    processed = FALSE
            ) AS metering;
    """)
    log.debug(sql_statement)

    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> get_unprocessed_items: {error}")
        raise error

    if response and response[0] and response[0] is not None:
        payload = response[0]
    else:
        payload = []

    return payload

'''
'''
def submit_metering_records(unprocessed_items):
    metering_uuids = []

    for item in unprocessed_items:
        metering_uuids.append(item['marketplace_metering_uuid'])

    timestamp = datetime.now()
    usage_records = []

    # Create a dictionary to store the total quantities per unique dimension and customer ID
    dimension_customer_totals = {}

    for item in unprocessed_items:
        customer_id = item['entitlement_customer_id']
        dimension = item['dimension']
        quantity = item['quantity']

        # Construct a unique key for each dimension and customer ID combination
        key = (customer_id, dimension)

        # Add the quantity to the total for the specific dimension and customer ID
        dimension_customer_totals[key] = dimension_customer_totals.get(key, 0) + quantity

    # Convert the dimension_customer_totals dictionary to the desired usage_records format
    for key, quantity in dimension_customer_totals.items():
        customer_id, dimension = key

        record = {
            'Timestamp': timestamp,
            'CustomerIdentifier': customer_id,
            'Dimension': dimension,
            'Quantity': quantity
        }

        usage_records.append(record)

    log.info(json.dumps(usage_records, default=str))

    # Submit the usage records to Amazon
    try:
        mp_session = assume_role_marketplace()
        mp_client = mp_session.client('meteringmarketplace')

        response = mp_client.batch_meter_usage(
            UsageRecords=usage_records,
            ProductCode=settings.marketplace_product_code
        )
        log.debug(response)
    except Exception as error:
        log.error(f'>> submit_metering_records: {error}')
        raise error

    if len(usage_records) > 0:
        return metering_uuids, response
    else:
        return None, None

'''
    assume_role_marketplace
        Assume the role in the stackref-marketplace account to take action there
'''
def assume_role_marketplace():
    sts_client = boto3.client("sts")

    try:
        response = sts_client.assume_role(
            RoleArn=settings.marketplace_role,
            RoleSessionName="marketplace-session"
        )
    except Exception as error:
        log.error(f'>> assume_role_marketplace: {error}')
        raise error

    new_session = boto3.Session(aws_access_key_id=response['Credentials']['AccessKeyId'],
                        aws_secret_access_key=response['Credentials']['SecretAccessKey'],
                        aws_session_token=response['Credentials']['SessionToken'])

    return new_session

import hashlib
import json
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    org_bank_balance
        Return the current Bank balance for an Organization
'''
def org_bank_balance(organization_uuid):
    log.info(':: org_bank_balance')

    sql_statement = ("""
        -- Return Coin Bank balance_value or organization_uuid
        SELECT
            balance_value
        FROM
            sr.fn_bank_balance(%(organization_uuid)s::UUID)
    """)
    sql_parameters = {'organization_uuid': organization_uuid}

    log.debug(sql_statement)
    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('coin_ledger', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        bank_balance = cached_data
    else:
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> org_coin_balance: {error}")
            raise error

        if response and response[0]:
            bank_balance = response[0]
        else:
            bank_balance = 0

        try:
            cache_query_response('coin_ledger', hashed_query, bank_balance, 10)
        except:
            log.error(f">> cache_query_response")

    return bank_balance

'''
    coin_bank_transaction
        Add transaction to the bank ledger
'''
def coin_bank_transaction(organization_uuid, event_uuid, marketplace_item_name, status='Executed'):
    log.info(":: coin_bank_transaction")

    transaction_details = {}
    transaction_details['description'] = 'Event Purchase'

    if event_uuid:
        transaction_details['event_uuid'] = str(event_uuid)

    if marketplace_item_name:
        transaction_details['marketplace_item_name'] = str(marketplace_item_name)

    if status == 'Not Executed':
        transaction_details['failure_message'] = 'Insufficient funds'

    transaction_uuid = uuid.uuid4()
    transaction_details = json.dumps(transaction_details)

    sql_statement = ("""
        -- Add transaction to the ledger
        INSERT
            INTO
            sr.coin_ledger (
                transaction_uuid,
                sending_entity_uuid,
                receiving_entity_uuid,
                transaction_value,
                transaction_status_id,
                transaction_details
            )
        VALUES (
            %(transaction_uuid)s::UUID,
            %(organization_uuid)s::UUID,
            %(event_uuid)s::UUID,
            (
                SELECT COALESCE((
                    SELECT
                        stackcash_cost
                    FROM
                        sr.marketplace_item
                    WHERE 
                        marketplace_item_name = %(marketplace_item_name)s
                ), 0)
            ),
            (
                SELECT
                    transaction_status_id
                FROM
                    sr.coin_transaction_status
                WHERE 
                    transaction_status_name = %(transaction_status_name)s
            ),
            %(transaction_details)s::JSONB
        )
        RETURNING
            transaction_value::FLOAT;
    """)
    sql_parameters = {
        'organization_uuid': organization_uuid,
        'event_uuid': event_uuid,
        'marketplace_item_name': marketplace_item_name,
        'transaction_uuid': transaction_uuid,
        'transaction_status_name': status,
        'transaction_details': transaction_details
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> coin_bank_transaction: {error}")
        raise error

    if response and response[0]:
        transaction_value = response[0]
    else:
        transaction_value = 0

    try:
        incr_key_prefix('coin_ledger')
        incr_key_prefix('organization')
        incr_key_prefix('event')
    except Exception as error:
        log.error('>> incr_key_prefix: {error}')

    return transaction_value

'''
'''
def has_required_funds(organization_uuid, event_type_id):
    """
        has_required_funds
            Compare cost of resource to Organizations's current StackCash balance

        :param organization_uuid: The UUID of the Organization
        :param event_type_id: The Event type ID of the Event to be created
        :return: Has required funds for resource (boolean), Required funds (float)
    """ 
    sql_parameters = {
        'organization_uuid': organization_uuid,
        'event_type_id': event_type_id
    }

    log.debug(f":: sql_parameters: {sql_parameters}")

    sql_statement = (f"""
        -- Determine if organization_uuid has sufficient StackCash for transaction
        SELECT
            o.organization_status_name,
            crt.marketplace_item_name,
            crt.has_required_funds,
            crt.funds_required::FLOAT
        FROM
            (
                SELECT
                    organization_status_name
                FROM
                    sr.organization_status
                WHERE
                    organization_status_id = (
                        SELECT
                            organization_status_id
                        FROM
                            sr.organization
                        WHERE
                            organization_uuid = %(organization_uuid)s::UUID
                    )
            ) AS o,
            (
                SELECT
                    balance_value
                FROM
                    sr.fn_bank_balance(%(organization_uuid)s::UUID)
            ) AS cb
            LEFT JOIN LATERAL (
                SELECT
                    marketplace_item_name AS marketplace_item_name,
                    stackcash_cost <= cb.balance_value AS has_required_funds,
                    stackcash_cost AS funds_required
                FROM
                    sr.marketplace_item
                WHERE 
                    marketplace_item_name = (
                        SELECT
                            event_type_name
                        FROM
                            sr.event_type
                        WHERE
                            event_type_id = %(event_type_id)s
                    )
            ) AS crt ON
            TRUE;
    """)
    log.debug(sql_statement)

    response = None
    organization_status = None
    marketplace_item_name = None

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('coin_ledger', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        response = json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchall()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> has_required_funds: {error}")
            raise error

        ''' We don't want to cache this (yet) since we don't want abuse of Event creation
        try:
            cache_query_response('coin_ledger', hashed_query, json.dumps(response), 3)
        except:
            log.error(f">> cache_query_response")
        '''

    if response and response[0] and response[0][0]:
        organization_status = response[0][0]
    if response and response[0] and response[0][1]:
        marketplace_item_name = response[0][1]

    if organization_status and organization_status == 'Unlimited':
        has_required_funds = True
    elif response and response[0] and response[0][2]:
        has_required_funds = response[0][2]
    else:
        has_required_funds = False

    if response and response[0] and response[0][3]:
        funds_required = response[0][3]
    else:
        funds_required = 0

    return organization_status, marketplace_item_name, has_required_funds, funds_required

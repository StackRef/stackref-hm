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
            log.error(f">> org_bank_balance: {error}")
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
def coin_bank_transaction(organization_uuid, entitlement_uuid, transaction_value, status='Executed'):
    log.info(":: coin_bank_transaction")

    transaction_details = {}
    transaction_details['description'] = 'Organization Amazon Marketplace Entitlement'
    transaction_details['entitlement_uuid'] = str(entitlement_uuid)

    if status == 'Not Executed':
        transaction_details['failure_message'] = 'Unknown error'

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
            UUID('00000000-0000-0000-0000-000000000000'),
            %(organization_uuid)s::UUID,
            %(transaction_value)s,
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
        'transaction_value': transaction_value,
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
    except Exception as error:
        log.error('>> incr_key_prefix: {error}')

    return transaction_value

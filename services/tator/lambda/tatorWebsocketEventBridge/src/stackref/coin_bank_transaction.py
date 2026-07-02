import hashlib
import json
import logging
from pydash import get
import uuid

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    bank_balance
        Return the current Bank balance for an Entity
'''
def bank_balance(*args, **kwargs):
    log.info(':: bank_entity_balance')
    account_id = kwargs.get('account_id', None)
    entity_uuid = kwargs.get('entity_uuid', None)

    if account_id:
        sql_statement = ("""
            -- Retrieve StackCash balance from cloud_account_cloud_id
            SELECT
                cb.bank_balance
            FROM
                (
                    SELECT
                        cloud_account_owner_uuid
                    FROM
                        sr.cloud_account
                    WHERE
                        cloud_account_cloud_id = %(cloud_account_cloud_id)s
                ) AS ca
                LEFT JOIN LATERAL (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(ca.cloud_account_owner_uuid)
                ) AS cb ON
                TRUE;
        """)
        sql_parameters = {'cloud_account_cloud_id': account_id}

    elif entity_uuid:
        sql_statement = ("""
            -- Return Coin Bank balance_value
            SELECT
                balance_value
            FROM
                sr.fn_bank_balance(%(entity_uuid)s::UUID)
        """)
        sql_parameters = {'entity_uuid': entity_uuid}

    else:
        return False
    log.debug(sql_statement)
    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('coin_ledger', hashed_query)
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
            log.error(f">> bank_balance: {error}")
            raise error

        if response and response[0]:
            payload = response[0]
        else:
            payload = 0

        try:
            cache_query_response('coin_ledger', hashed_query, payload, 10)
        except:
            log.error(f">> cache_query_response")

    return payload

'''
    coin_bank_transaction
        Add transaction to the bank ledger
'''
def coin_bank_transaction(event_details, status='Executed'):
    log.info(":: coin_bank_transaction")

    account_id = event_details['account_id']
    resource_type = event_details['resource_type']
    arn = event_details['arn']

    transaction_details = {
        'description': 'Cloud Resource Purchase',
        'resource_type': resource_type,
        'arn': arn
    }

    if status == 'Not Executed':
        transaction_details.update({'failure_message':'Insufficient funds'})

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
            (
                SELECT
                    cloud_account_owner_uuid
                FROM
                    sr.cloud_account
                WHERE
                    cloud_account_cloud_id = %(cloud_account_cloud_id)s
            ),
            UUID('00000000-0000-0000-0000-000000000000'),
            (
                SELECT
                    stackcash_cost
                FROM
                    sr.cloud_resource_type
                WHERE 
                    cloud_resource_type_name = %(cloud_resource_type_name)s
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
        'cloud_account_cloud_id': account_id,
        'cloud_resource_type_name': resource_type,
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
        incr_key_prefix('team')
    except Exception as error:
        log.error('>> incr_key_prefix: {error}')

    return transaction_value

import hashlib
import logging
from pydash import get

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.coin_bank_transaction import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

def has_required_funds(account_id, resource_type_name):
    """
        has_required_funds
            Compare cost of resource to entity's current StackCash balance

        :param account_id: The account ID of the cloud account
        :param resource_type_name: The name of resource from cloud_resource_type
        :return: Has required funds for resource (boolean), Required funds (float)
    """ 
    if account_id:
        sql_parameters = {
            'cloud_account_cloud_id': account_id,
            'cloud_resource_type_name': resource_type_name
        }

        log.debug(f":: sql_parameters: {sql_parameters}")

        sql_statement = ("""
            -- Determine if cloud_account owner has sufficient StackCash for transaction
            SELECT
                crt.has_required_funds,
                crt.funds_required::FLOAT
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
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        stackcash_cost <= cb.balance_value AS has_required_funds,
                        stackcash_cost AS funds_required
                    FROM
                        sr.cloud_resource_type
                    WHERE 
                        cloud_resource_type_name = %(cloud_resource_type_name)s
                ) AS crt ON
                TRUE;
        """)
        log.debug(sql_statement)

        hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
        cached_data = retrieve_query_response('cloud_account', hashed_query)
        if cached_data:
            log.info(':: Using cached data')
            payload = cached_data
        else:
            log.info(':: Fetching data to cache')
            try:
                with settings.db_conn() as db_conn: 
                    with db_conn.cursor() as cur:
                        cur.execute(sql_statement, sql_parameters)
                        response = cur.fetchone()
                        log.debug(f":: response: {response}")
            except Exception as error:
                log.error(f">> has_required_funds: {error}")
                raise error

            if response and response[0]:
                has_required_funds = response[0]
            else:
                has_required_funds = False

            if response and response[1]:
                funds_required = response[1]
            else:
                funds_required = 0

            '''
            try:
                cache_query_response('cloud_account', hashed_query, payload, 1)
            except:
                log.error(f">> cache_query_response")
            '''

            return has_required_funds, funds_required
    else:
        return False

def get_cloud_account_from_account_id(account_id):
    """
        get_cloud_account_from_account_id
            Retrieve cloud_account details when provided cloud_account_cloud_id

        :param account_id: The account ID of the cloud account
        :return: cloud_account (object)
    """ 
    if account_id:
        sql_parameters = {'cloud_account_cloud_id': account_id}

        log.debug(f":: sql_parameters: {sql_parameters}")

        sql_statement = ("""
            -- Retrieve cloud account UUID
            SELECT
                row_to_json(cloud_account)
            FROM
                (
                    SELECT
                        cloud_account_uuid,
                        cloud_account_cloud_id,
                        cloud_account_provider_id,
                        cloud_account_name,
                        cloud_account_status_id,
                        cloud_account_owner_uuid,
                        cloud_account_owner_type
                    FROM
                        sr.cloud_account
                    WHERE
                        cloud_account_cloud_id = %(cloud_account_cloud_id)s
                ) cloud_account;
        """)
        log.debug(sql_statement)

        hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
        cached_data = retrieve_query_response('cloud_account', hashed_query)
        cached_data = None
        if cached_data:
            log.info(':: Using cached data')
            payload = cached_data
        else:
            log.info(':: Fetching data to cache')
            try:
                with settings.db_conn() as db_conn: 
                    with db_conn.cursor() as cur:
                        cur.execute(sql_statement, sql_parameters)
                        response = cur.fetchone()
                        log.debug(f":: response: {response}")
            except Exception as error:
                log.error(f">> get_cloud_account_from_account_id: {error}")
                raise error

            log.debug(response)

            if response and response[0]:
                payload = json.dumps(response[0])
            else:
                payload = '{}'

            try:
                cache_query_response('cloud_account', hashed_query, payload)
            except:
                log.error(f">> cache_query_response")

            return json.loads(payload)
    else:
        return False

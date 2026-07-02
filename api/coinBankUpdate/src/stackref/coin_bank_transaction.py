import botocore.exceptions
import hashlib
import json
import logging
from pydash import get
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    bank_entity_type
        Return the entity_type value of the Coin Bank entity_uuid
'''
def bank_entity_type(entity_uuid):
    log.info(':: bank_entity_type')

    sql_statement = ("""
        -- Return entity_type
        SELECT
            entity_type::VARCHAR
        FROM
            sr.fn_entity_type(%(entity_uuid)s::UUID);
    """)

    sql_parameters = {'entity_uuid': entity_uuid}

    log.debug(sql_statement)
    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('entity_type', hashed_query)
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
            log.error(f">> bank_entity_type: {error}")
            raise error

        if response and response[0]:
            payload = response[0]
        else:
            payload = 'notfound'

        try:
            if payload != 'notfound':
                cache_query_response('entity_type', hashed_query, payload, 30)
        except:
            log.error(f">> cache_query_response")

    return payload

'''
    bank_entity_balance
        Return the current Bank balance for an Entity
'''
def bank_entity_balance(entity_uuid):
    log.info(':: bank_entity_balance')

    sql_statement = ("""
        -- Return Coin Bank balance_value
        SELECT
            balance_value AS bank_balance
        FROM
            sr.fn_bank_balance(%(entity_uuid)s::UUID)
    """)

    sql_parameters = {'entity_uuid': entity_uuid}

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
            log.error(f">> bank_entity_balance: {error}")
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
        Log a coin bank transaction to the ledger
'''
def coin_bank_transaction(grants, transaction):
    log.info(":: coin_bank_transaction")

    sending_entity_uuid = str(transaction['sending_entity_uuid'])
    receiving_entity_uuid = str(transaction['receiving_entity_uuid'])
    transaction_value = float(transaction['transaction_value'])

    # A non-user (Back-End) won't have a valid UUID
    if (not sending_entity_uuid or sending_entity_uuid == str(uuid.UUID(int=0))) and 'platform_write' in grants:
        sending_entity_uuid = str(uuid.UUID(int=0))
        transaction_details = {'description': 'Admin transfer'}
    else:
        if bank_entity_type(sending_entity_uuid) or bank_entity_type(receiving_entity_uuid) == 'event':
            transaction_details = {'description': 'Event transfer'}
        elif bank_entity_type(sending_entity_uuid) or bank_entity_type(receiving_entity_uuid) == 'organization':
            transaction_details = {'description': 'Organization transfer'}
        else:
            transaction_details = {'description': 'Standard transaction'}

    try:
        if bank_entity_type(sending_entity_uuid) == 'event':
            try:
                sending_event = get_event(sending_entity_uuid)
            except Exception as error:
                log.error(f'>> coin_bank_transaction: {error}')
                raise error

            if not sending_event:
                log.error(f'>> coin_bank_transaction: Event {sending_entity_uuid} not found')
                return return_error(500, 'Bank transaction failed -- Event not found')

            if sending_event['event_status_name'] in ["Judging", "Complete", "Archived"]:
                return return_error(500, 'Bank transaction failed -- Event not in status for bank transactions')
    except Exception as error:
        log.error(f'>> coin_bank_transaction: {error}')
        return return_error(500, 'Bank transaction failed')

    try:
        if bank_entity_type(receiving_entity_uuid) == 'event':
            try:
                receiving_event = get_event(receiving_entity_uuid)
            except Exception as error:
                log.error(f'>> coin_bank_transaction: {error}')
                raise error

            if not receiving_event:
                log.error(f'>> coin_bank_transaction: Event {receiving_entity_uuid} not found')
                return return_error(500, 'Bank transaction failed -- Event not found')

            if receiving_event['event_status_name'] in ["Judging", "Complete", "Archived"]:
                return return_error(500, 'Bank transaction failed -- Event not in status for bank transactions')
    except Exception as error:
        log.error(f'>> coin_bank_transaction: {error}')
        return return_error(500, 'Bank transaction failed')

    try:
        # Check sending_entity_uuid balance
        if sending_entity_uuid != str(uuid.UUID(int=0)):
            if bank_entity_balance(sending_entity_uuid) < transaction_value:
                transaction_status_id = 1 # Not executed
                transaction_details.update({'failure_message':'Insufficient funds'})
            else:
                transaction_status_id = 2 # Executed
        else:
            transaction_status_id = 2 # Executed
    except Exception as error:
        log.error(f'>> coin_bank_transaction: {error}')
        return return_error(500, 'Bank transaction failed')

    transaction_uuid = uuid.uuid4()
    transaction_details = json.dumps(transaction_details)

    sql_statement = ("""
        SELECT
            bank_balances
        FROM sr.fn_bank_transaction(
            %(transaction_uuid)s::UUID,
            %(sending_entity_uuid)s::UUID,
            %(receiving_entity_uuid)s::UUID,
            %(transaction_value)s,
            %(transaction_status_id)s,
            %(transaction_details)s::JSONB
        );
    """)
    sql_parameters = {
        'transaction_uuid': transaction_uuid,
        'sending_entity_uuid': sending_entity_uuid,
        'receiving_entity_uuid': receiving_entity_uuid,
        'transaction_value': transaction_value,
        'transaction_status_id': transaction_status_id,
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
        return return_error(503, error) 

    if transaction_status_id == 2: # Executed
        status_code = 200
    else:
        status_code = 201

    if response and response[0]:
        bank_balances = json.dumps(response[0])
    else:
        bank_balances = '{}'

    # Need to increment key prefix from memcache for functions that JOIN on this data
    # TODO: Improve the above
    try:
        incr_key_prefix('coin_ledger')
        incr_key_prefix('organization')
        incr_key_prefix('event')
        incr_key_prefix('team')
        incr_key_prefix('cloud_account')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        sender_bank_entity_type = bank_entity_type(sending_entity_uuid)
        receiver_bank_entity_type = bank_entity_type(receiving_entity_uuid)
        event_uuid = None
        sender_command = "initializeOrganization"
        receiver_command = "initializeOrganization"
        args = ""

        if sender_bank_entity_type == 'event':
            sender_command = "initializeOrgEvents"
            args = sending_entity_uuid
            event_uuid = sending_entity_uuid

        if receiver_bank_entity_type == 'event':
            receiver_command = "initializeOrgEvents"
            args = receiving_entity_uuid
            event_uuid = receiving_entity_uuid

        if receiver_bank_entity_type == 'team':
            receiver_command = "initializeTeams"
            args = receiving_entity_uuid

        tator_message = {
            "command": sender_command,
            "args": args,
            "type": "command"
        }
        tator_notify(tator_message, str(sending_entity_uuid))
        tator_message = {
            "command": receiver_command,
            "args": args,
            "type": "command"
        }
        tator_notify(tator_message, str(receiving_entity_uuid))
        if event_uuid:
            tator_message = {
                "command": "initializeEventActivity",
                "args": str(event_uuid),
                "type": "command"
            }
            tator_notify(tator_message, str(event_uuid))
    except Exception as error:
        log.error(f'>> coin_bank_transaction: {error}')

    response_payload = {
        'status_code': status_code,
        'transaction_uuid': str(transaction_uuid),
        'sending_entity_uuid': str(sending_entity_uuid),
        'receiving_entity_uuid': str(receiving_entity_uuid),
        'transaction_value': transaction_value,
        'bank_balances': json.loads(bank_balances)
    }
    response_body = json.dumps(response_payload)

    log.info(response_body)

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

'''
    fail_transaction
        Set the transaction status to Failed
'''
def fail_transaction(transaction_uuid, message='General failure'):
    log.info(":: fail_transaction")

    sql_statement = ("""
        -- Fail the transaction
        UPDATE sr.coin_ledger
        SET
            transaction_status_id = 3,
            transaction_details = transaction_details::JSONB || ('{"failure_message":"' || %(message)s || '"}' )::JSONB,
            ts_modified = NOW()
        WHERE
            transaction_uuid = %(transaction_uuid)s::UUID;
    """)
    sql_parameters = {
        'transaction_uuid': transaction_uuid,
        'message': message
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> fail_transaction: {error}")
        raise error

'''
    get_event
        Return details of an Event via event_uuid
'''
def get_event(event_uuid):
    sql_statement = ("""
        -- Retrieve event
        SELECT
            row_to_json(event)
        FROM
            (
                SELECT
                    event.ts_event_start,
                    event.ts_event_end,
                    event.event_details,
                    bank.balance_value AS bank_balance,
                    event.event_status_id,
                    event.event_status_name,
                    event.event_type_id,
                    event.event_type_name,
                    event.event_team_form_mode_id,
                    event.event_team_form_mode_name,
                    event.event_time_elapsed
                FROM
                    (
                        SELECT
                            to_char(e.ts_event_start, 'YYYY-MM-DD HH24:MI:SS') AS ts_event_start,
                            to_char(e.ts_event_end, 'YYYY-MM-DD HH24:MI:SS') AS ts_event_end,
                            e.event_details,
                            es.event_status_id AS event_status_id,
                            es.event_status_name AS event_status_name,
                            et.event_type_id AS event_type_id,
                            et.event_type_name AS event_type_name,
                            tfm.event_team_form_mode_id AS event_team_form_mode_id,
                            tfm.event_team_form_mode_name AS event_team_form_mode_name,
                            NOW() > e.ts_event_end AS event_time_elapsed
                        FROM
                            sr.event AS e
                        LEFT JOIN sr.event_status es ON 
                            e.event_status_id = es.event_status_id
                        LEFT JOIN sr.event_type et ON 
                            e.event_type_id = et.event_type_id
                        LEFT JOIN sr.event_team_form_mode tfm ON 
                            e.event_team_form_mode_id = tfm.event_team_form_mode_id
                        WHERE
                            e.event_uuid = %(event_uuid)s::UUID
                    ) AS event
                LEFT JOIN LATERAL (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(%(event_uuid)s::UUID) AS balance_value
                ) AS bank ON
                TRUE
            ) AS event; 
    """)
    log.debug(sql_statement)
    sql_parameters = {'event_uuid': event_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('event', hashed_query)
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
            log.error(f">> get_event: {error}")
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        try:
            cache_query_response('event', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return json.loads(payload)

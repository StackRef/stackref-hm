import json
import logging
import sys

sys.path.insert(1, 'vendor')
import stripe

import stackref.settings as settings
from stackref.coin_bank_transaction import coin_bank_transaction
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)


'''
    process_stripe_intent
        Process the StackCash purchase request intent
'''
def process_stripe_intent(organization_uuid, purchase_details):
    log.info(":: process_stripe_intent")

    stripe.api_key = settings.stripe_api_key_dev
    quantity = 999 # TODO

    try:
        intent = stripe.PaymentIntent.create(
            amount=quantity,
            currency='usd',
            automatic_payment_methods={
                'enabled': True
            }
        )

        try:
            add_stripe_intent(organization_uuid, intent['id'], quantity)
        except Exception as error:
            return return_error(f'>> process_stripe_intent: {error}')

        return {
            "status_code": 200,
            "organization_uuid": str(organization_uuid),
            "stripe_client_secret": intent['client_secret'],
            "transaction_value": purchase_details['quantity']
        }
    except Exception as error:
        log.error(f'>> process_stripe_intent: {error}')
        return return_error(f'>> process_stripe_intent: {error}')

'''
    process_stripe_response
        Process Stripe webhook responses
'''
def process_stripe_response(response):
    log.info(':: process_stripe_response')

    payload = response['body']
    sig_header = response['headers']['stripe-signature']
    payload_json = json.loads(payload)
    live_mode = payload_json['livemode']

    if live_mode:
        stripe_endpoint_secret = settings.stripe_endpoint_secret_prod
    else:
        stripe_endpoint_secret = settings.stripe_endpoint_secret_dev

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_endpoint_secret
        )
    except ValueError as error:
        # Invalid payload
        log.error(f'>> process_stripe_response - ValueError: {error}')
        raise error
    except stripe.error.SignatureVerificationError as error:
        # Invalid signature
        log.error(f'>> process_stripe_response - SignatureVerificationError: {error}')
        raise error

    if event['type'] == 'checkout.session.completed':
        payment_intent = event['data']['object']['payment_intent']
        payment_status = event['data']['object']['payment_status']
        subtotal = event['data']['object']['amount_subtotal']
        currency = event['data']['object']['currency']
        organization_uuid = event['data']['object']['client_reference_id']

        # Stripe sends the amount number without a decimal, so we need to add it
        if currency == 'usd':
            transaction_value = subtotal / 100.0

        try:
            add_stripe_intent(organization_uuid, payment_intent, transaction_value, currency, payment_status)
        except Exception as error:
            log.error(f'>> process_stripe_response: {error}')
            raise error

        if payment_status == 'paid':
            # Process the bank transaction
            try:
                stackcash_value = convert_to_stackcash(transaction_value)
                transaction_details = {
                    'description': 'Organization Stripe Purchase',
                    'stripe_payment_intent_id': str(payment_intent)
                }
                if live_mode:
                    transaction_status = 'Executed'
                else:
                    transaction_status = 'Not executed'
                    transaction_details['testing'] = True
                coin_bank_transaction(organization_uuid, transaction_details, stackcash_value, transaction_status)
            except Exception as error:
                log.error(f'>> process_stripe_response: {error}')
                raise error

            return {
                "status_code": 200,
                "stripe_intent_id": payment_intent,
                "organization_uuid": str(organization_uuid),
                "transaction_value": transaction_value,
                "stackcash_value": stackcash_value
            }
    else:
        log.error(f'>> process_stripe_response: Unhandled event type {event["type"]}')
        return return_error(200, f'process_stripe_response: Unhandled event type {event["type"]}')

    return {
        "status_code": 200
    }

'''
    add_stripe_intent
        Add new Stripe purchase intent to DB
'''
def add_stripe_intent(organization_uuid, intent_id, transaction_value, currency, status):
    log.info(":: add_stripe_intent")

    sql_statement = ("""
        -- Add the Stripe purchase intent
        INSERT
            INTO
                sr.stripe_payment (
                    payment_intent_id,
                    payment_intent_status,
                    payment_intent_amount,
                    payment_intent_currency,
                    organization_uuid
                )
            VALUES (
                %(payment_intent_id)s,
                %(payment_intent_status)s,
                %(payment_intent_amount)s,
                %(payment_intent_currency)s,
                %(organization_uuid)s::UUID
            );
    """)

    sql_parameters = {
        'payment_intent_id': intent_id,
        'payment_intent_status': status,
        'payment_intent_amount': transaction_value,
        'payment_intent_currency': currency,
        'organization_uuid': organization_uuid
    }
    log.debug(sql_statement)
    log.debug(sql_parameters)

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> add_stripe_intent: {error}")
        raise error

    try:
        incr_key_prefix('stripe_intent')
    except:
        log.error('>> incr_key_prefix')

'''
'''
def convert_to_stackcash(transaction_value):
    # TODO: Refer to DB table for pricing information regarding USD-to-StackCash conversion
    if int(transaction_value) < 999:
        return 0
    else:
        return ((int(transaction_value) - 999) // 999 + 1) * 100

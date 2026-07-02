import base64
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.coin_bank_transaction import bank_entity_type, coin_bank_transaction
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_post_method
        Process POST method requests
'''
def process_post_method(event):
    log.info(":: process_post_method")

    user_uuid = get_user_uuid(event)
    organization_uuid = get_organization_uuid(event)
    grants = get_user_grants(user_uuid, organization_uuid) + get_be_auth0_scope(event)

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        if (
            'action' in payload_json and
            payload_json['action'] == 'transaction' and
            'transaction' in payload_json and
            'sending_entity_uuid' in payload_json['transaction'] and
            'receiving_entity_uuid' in payload_json['transaction'] and
            'transaction_value' in payload_json['transaction'] and
            payload_json['transaction']['transaction_value'] >= 0
        ):
            transaction = payload_json['transaction']
            try:
                entity_type = bank_entity_type(transaction['sending_entity_uuid'])
            except Exception as error:
                log.error(f'>> bank_entity_type: {error}')
                return return_error(500, 'Invalid entity type')
            authorized = (
                'platform_write' in grants,
                (
                    entity_type == 'organization' and
                    transaction['sending_entity_uuid'] == organization_uuid and
                    'bank_write' in grants
                ),
                (
                    entity_type == 'event' or
                    entity_type == 'team' and
                    (
                        'event_write' in grants or
                        'manage' in get_participant_grants(user_uuid, payload_json['transaction']['sending_entity_uuid'])
                    )
                )
            )
            if any(authorized):
                return coin_bank_transaction(grants, payload_json['transaction'])
            else:
                return return_error(401, 'Not authorized to initiate transaction')
        else:
            return return_error(500, 'Malformed POST JSON payload')
    else:
        return return_error(500, 'process_post_method')

'''
    is_base64
        Test if object is base64 encoded
'''
def is_base64(sb):
    try:
        if isinstance(sb, str):
            # If there's any unicode here, an exception will be thrown and the function will return false
            sb_bytes = bytes(sb, 'ascii')
        elif isinstance(sb, bytes):
            sb_bytes = sb
        else:
            raise ValueError("Argument must be string or bytes")
        # deepcode ignore HandleUnicode: Only care about returning True/False
        return base64.b64encode(base64.b64decode(sb_bytes)) == sb_bytes
    except Exception:
        return False

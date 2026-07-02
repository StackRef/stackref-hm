import base64
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.grant_functions import *
from stackref.coin_bank_transaction import bank_entity_type, coin_bank_transaction
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_fn_method
        Process internal Lambda function method requests
'''
def process_fn_method(event):
    log.info(":: process_fn_method")

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
            return coin_bank_transaction(None, payload_json['transaction'])
        else:
            return return_error(500, 'Malformed JSON payload')
    else:
        return return_error(500, 'process_fn_method')

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

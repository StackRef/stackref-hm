import base64
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.grant_functions import *
from stackref.update_event import complete_event

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_fn_method
        Process internal Lambda function method requests
'''
def process_fn_method(event, int_fn_name):
    log.info(":: process_fn_method")

    if int_fn_name:
        log.info(f':: intFnName: {int_fn_name}')

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        if (
            'action' in payload_json and
            'event' in payload_json and
            payload_json['event']['event_uuid']
        ):
            if payload_json['action'] == 'complete':
                return complete_event(payload_json, int_fn_name)
            else:
                return return_error(500, 'Unhandled action')
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

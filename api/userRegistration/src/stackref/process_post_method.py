import base64
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.grant_functions import *
from stackref.process_user import process_user
from stackref.register_user import register_user

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_post_method
        Process POST method requests
'''
def process_post_method(event):
    log = logging.getLogger(__name__)
    log.info(":: process_post_method")

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        log.info(payload_json)

        if 'event' in payload_json and 'user' in payload_json['event']:
            return process_user(payload_json['event']['user'])
        elif (
            'action' in payload_json and
            payload_json['action'] == 'register' and
            'user' in payload_json and
            get_user_uuid(event) == payload_json['user']['user_uuid']
        ):
            return register_user(payload_json['user'])
        else:
            return return_error(501, 'Malformed POST JSON payload')
    else:
        return return_error(502, 'process_post_method')

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

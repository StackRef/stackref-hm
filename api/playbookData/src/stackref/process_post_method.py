import base64
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_playbooks import process_playbooks
from stackref.process_resources import process_resources
from stackref.process_services import process_services

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_post_method
        Process POST method requests
'''
def process_post_method(event, organization_uuid, event_uuid):
    log = logging.getLogger(__name__)
    log.info(":: process_post_method")

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        #log.info(payload_json)

        if 'playbook' in payload_json:
            return process_playbooks(payload_json['playbook'], organization_uuid, event_uuid)
        elif 'resources' in payload_json:
            return process_resources(payload_json['resources'], organization_uuid, event_uuid)
        elif 'services' in payload_json:
            return process_services(payload_json['services'])
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

import base64
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.create_judging_criterion import create_judging_criterion
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

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    if 'event_write' not in grants:
        return return_error(401, "Not authorized for Organization")

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        if 'criterion' in payload_json:
            # Make sure a User FE request matches their assigned Organization
            if (
                get_auth0_audience(event) == 'fe' and
                payload_json['criterion']['organization_uuid'] != get_organization_uuid(event)
            ):
                return return_error(401, "Not authorized for Organization")
            return create_judging_criterion(payload_json)
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

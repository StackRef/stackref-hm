import base64
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.create_organization import create_organization
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

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        user_uuid = get_user_uuid(event)

        if 'organization' in payload_json:
            authorization = (
                get_auth0_audience(event) == 'be' and
                    'platform_write' in get_be_auth0_scope(event),
                get_auth0_audience(event) == 'fe' and
                    not get_organization_uuid(event),
                user_uuid and not get_organization_by_user(user_uuid)
            )
            if any(authorization):
                return create_organization(payload_json)
            else:
                return return_error(401, 'Not authorized to create new Organizations')
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

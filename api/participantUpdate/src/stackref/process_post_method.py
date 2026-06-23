import base64
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.grant_functions import *
from stackref.update_participant import set_active_event, update_participant

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
            payload_json['action'] != 'set_active_event' and
            'participant' in payload_json and
            'participant_uuid' in payload_json['participant'] and
            'event_uuid' in payload_json['participant']
        ):
            authorization = (
                'event_write' in grants,
                'manage' in get_participant_grants(user_uuid, payload_json['participant']['event_uuid'])
            )
            if any(authorization):
                return update_participant(payload_json['action'], payload_json['participant'])
            else:
                return return_error(401, 'Not authorized')
        elif (
            'action' in payload_json and
            payload_json['action'] == 'set_active_event' and
            'participant' in payload_json and
            'participant_uuid' in payload_json['participant']
        ):
            return set_active_event(user_uuid, payload_json['participant'])
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

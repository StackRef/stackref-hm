import base64
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.grant_functions import *
from stackref.create_team_member import create_team_member

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

    grants = get_user_grants(user_uuid,get_organization_uuid(event)) + get_be_auth0_scope(event)

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        if (
            'action' in payload_json and
            'team_member' in payload_json and
            'team_uuid' in payload_json['team_member']
        ):
            event_uuid = get_event_by_team(payload_json['team_member']['team_uuid'])
            participant_grants = get_participant_grants(user_uuid, event_uuid)
            authorization = (
                'event_write' in grants,
                'manage' in participant_grants,
                'play' in participant_grants and get_event_team_form_mode(event_uuid) == 'Franchisor'
            )
            if any(authorization):
                return create_team_member(payload_json)
            else:
                return return_error(401, 'Not authorized')
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

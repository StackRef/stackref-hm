import base64
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.update_team_event_feedback import update_team_event_feedback
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
    grants = get_user_grants(user_uuid,get_organization_uuid(event)) + get_be_auth0_scope(event)

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        if 'team_event_feedback' in payload_json:
            if 'team_uuid' in payload_json['team_event_feedback']:
                team_uuid = payload_json['team_event_feedback']['team_uuid']
                authorized = (
                    'event_write' in grants,
                    'judge' in get_participant_grants(user_uuid, get_event_by_team(team_uuid))
                )
                if not any(authorized):
                    return return_error(401, "Not authorized")
                else:
                    return update_team_event_feedback(payload_json)
            else:
                return return_error(500, 'Malformed POST JSON payload')
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

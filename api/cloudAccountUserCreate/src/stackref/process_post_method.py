import base64
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_cloud_account_user import process_cloud_account_user
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

        authorization = (
            'platform_write' in grants,
            'manage' in get_participant_grants(user_uuid, get_event_by_team(payload_json['cloud_account_user']['team_uuid'])),
            'play' in get_team_member_grants(user_uuid, payload_json['cloud_account_user']['team_uuid'])
        )

        if any(authorization):
            if 'cloud_account_user' in payload_json:
                # Make sure a User FE request matches their assigned Organization
                '''
                if (
                    get_auth0_audience(event) == 'fe' and
                    payload_json['cloud_account_user']['user_uuid'] != get_organization_uuid(event)
                ):
                    return return_error(401, "Not authorized for Organization")
                '''
                return process_cloud_account_user(payload_json)
            else:
                return return_error(500, 'Malformed POST JSON payload')
        else:
            return return_error(401, "Not authorized for Event or Team")
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

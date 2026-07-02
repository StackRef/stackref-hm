import base64
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.coin_bank_transaction import has_required_funds
from stackref.create_event import create_event
from stackref.create_kickoff import create_kickoff
from stackref.create_judging_criterion import create_judging_criterion
from stackref.exceptions import InsufficientFunds
from stackref.grant_functions import *
from stackref.tator_notify import tator_notify

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

        if 'event' in payload_json:
            # Make sure a User FE request matches their assigned Organization
            if (
                get_auth0_audience(event) == 'fe' and
                payload_json['event']['organization_uuid'] != get_organization_uuid(event)
            ):
                return return_error(401, "Not authorized for Organization")

            try:
                event_uuid = create_event(payload_json)
            except InsufficientFunds as error:
                return return_error(401, f'Create event failed: {error}')
            except Exception as error:
                return return_error(500, f'Create event failed: {error}')

            try:
                create_kickoff(event_uuid, payload_json)
            except Exception as error:
                log.error(f'>> process_post_method: {error}')

            try:
                create_judging_criterion(event_uuid, payload_json)
            except Exception as error:
                log.error(f'>> process_post_method: {error}')

            response_payload = {
                'status_code': 200,
                'event_uuid': event_uuid
            }

            # Send Tator commands to update UI
            try:
                tator_message = {
                    "command": "initializeOrgEvents",
                    "type": "command"
                }
                tator_notify(tator_message, str(payload_json['event']['organization_uuid']))
            except Exception as error:
                log.error(f'>> process_post_method: {error}')

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(response_payload)
            }
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

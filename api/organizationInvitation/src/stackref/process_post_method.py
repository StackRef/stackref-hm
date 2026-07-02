import base64
import botocore.exceptions
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.create_invitation import create_invitation
from stackref.claim_invitation import claim_invitation
from stackref.email_invitation import send_invitation_email
from stackref.grant_functions import *
from stackref.invitation_file import process_invitation_file
from stackref.invalidate_invitation import invalidate_invitation, update_invitation_details

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

        log.debug(payload_json)

        environment = str(event['headers']['host']).split(".")[0]

        organization_uuid = get_organization_uuid(event)
        user_uuid = get_user_uuid(event)

        grants = get_user_grants(user_uuid,organization_uuid) + get_be_auth0_scope(event)

        if 'invitation' in payload_json and 'action' in payload_json['invitation']:
            if payload_json['invitation']['action'] == 'claim':
                if not organization_uuid:
                    return claim_invitation(payload_json['invitation'])
                else:
                    return return_error(401, "Use already part of Organization")
            elif payload_json['invitation']['action'] == 'invalidate':
                if 'invitation_write' not in grants:
                    return return_error(401, "Not authorized")
                else:
                    return invalidate_invitation(payload_json['invitation'])
            elif payload_json['invitation']['action'] == 'upload':
                if 'invitation_write' not in grants:
                    return return_error(401, "Not authorized")
                try:
                    return process_invitation_file(payload_json['invitation'])
                except Exception as error:
                    return return_error(500, error)
            elif payload_json['invitation']['action'] == 'create':
                if 'invitation_write' not in grants:
                    return return_error(401, "Not authorized")

                organization_uuid = payload_json['invitation']['organization_uuid']
                invitation_email = payload_json['invitation']['invitation_email']
                
                try:
                    create_response = create_invitation(payload_json['invitation'])
                    create_response_body = json.loads(create_response['body'])
                    organization_invitation_uuid = create_response_body['invitation']['organization_invitation_uuid']
                    invitation_code = create_response_body['invitation']['invitation_code']
                    log.debug(f":: invitation_code: {invitation_code}")
                except Exception as error:
                    return return_error(500, error)

                try:
                    send_invitation_email(environment, organization_invitation_uuid, invitation_email, invitation_code, organization_uuid)
                    return {
                        'statusCode': create_response['statusCode'],
                        'headers': create_response['headers'],
                        'body': create_response['body']
                    }
                except Exception as error:
                    log.error(f'>> process_post_method: {error}');
                    update_invitation_details(organization_invitation_uuid, organization_uuid, 3)
                    return return_error(500, "Invitation send failed")
            elif payload_json['invitation']['action'] == 'send':
                if 'organization_write' not in grants:
                    return return_error(401, "Not authorized")
                organization_invitation_uuid = payload_json['invitation']['organization_invitation_uuid']
                invitation_email = payload_json['invitation']['invitation_email']
                organization_uuid = payload_json['invitation']['organization_uuid']
                invitation_code = payload_json['invitation']['invitation_code']
                try:
                    send_invitation_email(environment, organization_invitation_uuid, invitation_email, invitation_code, organization_uuid)
                except Exception as error:
                    update_invitation_details(organization_invitation_uuid, organization_uuid, 3)
                    return return_error(500, "Invitation send failed")

                try:
                    response_payload = {
                        'status_code': 200,
                        'organization_invitation_uuid': organization_invitation_uuid
                    }
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        'body': json.dumps(response_payload)
                    }
                except Exception as error:
                    return return_error(500, error)
            else:
                return return_error(500, 'Unhandled action')
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

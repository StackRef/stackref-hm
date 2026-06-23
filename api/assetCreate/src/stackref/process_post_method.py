import base64
import cgi
import json
import logging
from io import BytesIO

import stackref.settings as settings
from stackref.create_asset import create_asset, get_entity_type
from stackref.generate_image import generate_image
from stackref.grant_functions import *
from stackref.settings import return_error

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

    organization_uuid = get_organization_uuid(event)
    user_uuid = get_user_uuid(event)
    asset_type = 'unknown'
    asset_entity_uuid = None

    grants = get_user_grants(user_uuid, organization_uuid) + get_be_auth0_scope(event)

    if 'queryStringParameters' in event and 'asset_entity_uuid' in event['queryStringParameters']:
        asset_entity_uuid = event['queryStringParameters']['asset_entity_uuid']

    if not asset_entity_uuid or asset_entity_uuid == '' or asset_entity_uuid == 'undefined':
        asset_entity_uuid = organization_uuid

    if 'queryStringParameters' in event and 'asset_type' in event['queryStringParameters']:
        asset_type = event['queryStringParameters']['asset_type']

    entity_type = get_entity_type(asset_entity_uuid)

    if entity_type == 'organization':
        if 'organization_write' not in grants:
            return return_error(401, "Not authorized for Organization")
    elif entity_type == 'event':
        authorized = (
            'event_write' in grants,
            'manage' in get_participant_grants(user_uuid, asset_entity_uuid)
        )
        if not any(authorized):
            return return_error(401, "Not authorized for Event")
    elif entity_type == 'team':
        authorized = (
            'event_write' in grants,
            'manage' in get_participant_grants(user_uuid, get_event_by_team(asset_entity_uuid)),
            'manage' in get_team_member_grants(user_uuid, asset_entity_uuid)
        )
        if not any(authorized):
            return return_error(401, "Not authorized for Team")
    else:
        return return_error(401, "Not authorized")

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body'])
        else:
            body = event['body']

        try:
            json_data = json.loads(body)
            entity_name = json_data['entity_name']
            file_to_process = generate_image(asset_type, entity_type, entity_name, asset_entity_uuid)
        except json.JSONDecodeError:
            # If a JSONDecodeError is raised, the body is not a JSON string
            # You can now attempt to use the body with cgi.FieldStorage
            fields = cgi.FieldStorage(
                fp=BytesIO(body),
                headers=event['headers'],
                environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': event['headers'].get('Content-Type', 'text/plain')}
            )

            filepond = fields['filepond']
            file_to_process = {
                'asset_entity_uuid': asset_entity_uuid,
                'asset_type': asset_type,
                'file_name': filepond.filename,
                'file_type': filepond.type,
                'file_data': filepond.file.read()
            }

        if file_to_process:
            try:
                asset_uuid = create_asset(user_uuid, file_to_process)
            except Exception as error:
                return return_error(500, f'Create asset failed: {error}')

            response_payload = {
                'status_code': 200,
                'asset_entity_uuid': asset_entity_uuid,
                'asset_uuid': asset_uuid
            }

            # Send Tator commands to update UI
            '''
            try:
                tator_message = {
                    "command": "initializeOrgEvents",
                    "type": "command"
                }
                tator_notify(tator_message, str(payload_json['event']['organization_uuid']))
            except Exception as error:
                log.error(f'>> process_post_method: {error}')
            '''

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(response_payload)
            }
        else:
            return return_error(500, 'Malformed POST payload')
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

import base64
import json
import logging

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
    process_fn_method
        Process internal Lambda function method requests
'''
def process_fn_method(event, int_fn_name):
    log.info(":: process_fn_method")

    if int_fn_name:
        log.info(f':: intFnName: {int_fn_name}')

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        if (
            'action' in payload_json and
            payload_json['action'] == 'generate_image' and
            'asset_entity_uuid' in payload_json and
            'entity_name' in payload_json and
            'asset_type' in payload_json and
            'user_uuid' in payload_json
        ):
            asset_entity_uuid = payload_json['asset_entity_uuid']
            asset_type = payload_json['asset_type']
            entity_name = payload_json['entity_name']
            entity_type = get_entity_type(payload_json['asset_entity_uuid'])
            user_uuid = payload_json['user_uuid']

            try:
                file_to_process = generate_image(asset_type, entity_type, entity_name, asset_entity_uuid)
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
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        'body': json.dumps(response_payload)
                    }
                else:
                    return return_error(500, 'Error generating image')
            except Exception as error:
                return return_error(500, error)
        else:
            return return_error(500, 'Malformed JSON payload')
    else:
        return return_error(500, 'process_fn_method')

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

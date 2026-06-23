import json
import logging

import stackref.settings as settings
from stackref.amzn_marketplace import get_amzn_marketplace_entitlements
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *
from stackref.update_entitlements import update_entitlements

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_get_method
        Process GET method requests
'''
def process_get_method(event):
    log.info(":: process_get_method")

    amzn_marketplace_token = None

    if 'x-amzn-marketplace-token' in event['headers']:
        amzn_marketplace_token = event['headers']['x-amzn-marketplace-token']
    elif 'queryStringParameters' in event and 'x-amzn-marketplace-token' in event['queryStringParameters']:
        amzn_marketplace_token = event['queryStringParameters']['x-amzn-marketplace-token']
    if 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']
    else:
        organization_uuid = get_organization_uuid(event)

    if not amzn_marketplace_token or not organization_uuid:
        return return_error(500, 'Malformed request')

    user_uuid = get_user_uuid(event)
    grants = get_user_grants(user_uuid,organization_uuid) + get_be_auth0_scope(event)

    authorized = (
        'platform_read' in grants,
        'organization_write' in grants
    )
    if not any(authorized):
        return return_error(401, "Not authorized")

    entitlements = None

    try:
        entitlements = get_amzn_marketplace_entitlements(amzn_marketplace_token)
        if 'entitlements' in entitlements and len(entitlements['entitlements']) > 0:
            active_entitlements = update_entitlements(organization_uuid, entitlements)
    except Exception as error:
        log.error(f'>> process_get_method: {error}')
        raise error

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(active_entitlements, default=str)
    }

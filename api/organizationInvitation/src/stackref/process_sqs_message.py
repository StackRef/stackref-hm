import botocore.exceptions
import hashlib
import json
import logging
from pydash import get

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.create_invitation import create_invitation
from stackref.email_invitation import send_invitation_email
from stackref.grant_functions import *
from stackref.invalidate_invitation import update_invitation_details

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_sqs_message
        Process message received from SQS
'''
def process_sqs_message(body):
    log.info(':: process_sqs_message')

    if (
        'creator_user_uuid' in body and
        'organization_uuid' in body and
        'email_address' in body
    ):
        grants = get_user_grants(body['creator_user_uuid'], body['organization_uuid'])

        if 'organization_write' not in grants:
            log.error('>> Not authorized for Organization')
            return

        invitation = {
            'creator_user_uuid': body['creator_user_uuid'],
            'organization_uuid': body['organization_uuid'],
            'invitation_email': body['email_address']
        }

        try:
            create_response = create_invitation(invitation)
            create_response_body = json.loads(create_response['body'])
            organization_invitation_uuid = create_response_body['invitation']['organization_invitation_uuid']
            invitation_code = create_response_body['invitation']['invitation_code']
            log.debug(f":: invitation_code: {invitation_code}")
        except Exception as error:
            log.error(f'>> process_sqs_message: {error}')
            raise error

        try:
            environment = 'app' # TODO
            send_invitation_email(environment, organization_invitation_uuid, body['email_address'], invitation_code, body['organization_uuid']) 
        except Exception as error:
            log.error(f'>> process_sqs_message: {error}')
            update_invitation_details(organization_invitation_uuid, body['organization_uuid'], 3)
            return
    else:
        log.error('>> Invalid payload')
        return

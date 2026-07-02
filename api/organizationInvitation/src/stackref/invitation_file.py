import json
import logging
from pydash import get
import re

import stackref.settings as settings
from stackref.settings import return_error
from stackref.create_invitation import create_invitation, validate_email
from stackref.email_invitation import send_invitation_email

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_invitation_file
        Process an incoming invitation file upload data
'''
def process_invitation_file(invitation):
  log.info(':: process_invitation_file')

  payload = {}
  create_responses = []
  invitation_file_has_header = False

  if 'invitation_file_data' in invitation:
    for row in invitation['invitation_file_data']:
      if invitation['invitation_file_has_header']:
        for column, value in row.items():
          column = re.sub(r'[^a-zA-Z0-9]', '', column).lower()
          if 'email' in column and validate_email(value):
              payload['creator_user_uuid'] = invitation['creator_user_uuid']
              payload['organization_uuid'] = invitation['organization_uuid']
              payload['invitation_email'] = value

              try:
                create_response = create_invitation(payload)
                create_response_body = json.loads(create_response['body'])
                organization_invitation_uuid = create_response_body['invitation']['organization_invitation_uuid']
                invitation_code = create_response_body['invitation']['invitation_code']
                invitation_email = value
                organization_uuid = invitation['organization_uuid']
                log.debug(f":: invitation_code: {invitation_code}")
                try:
                    send_invitation_email(organization_invitation_uuid, invitation_email, invitation_code, organization_uuid)
                    create_responses.append(create_response['body'])
                except Exception as error:
                    log.error(f'>> process_invitation_file: {error}');
                    return return_error(500, "Invitation send failed")
              except Exception as error:
                raise
      else:
          for value in row:
            if validate_email(value):
              payload['creator_user_uuid'] = invitation['creator_user_uuid']
              payload['organization_uuid'] = invitation['organization_uuid']
              payload['invitation_email'] = value

              try:
                create_response = create_invitation(payload)
                create_response_body = json.loads(create_response['body'])
                organization_invitation_uuid = create_response_body['invitation']['organization_invitation_uuid']
                invitation_code = create_response_body['invitation']['invitation_code']
                invitation_email = value
                organization_uuid = invitation['organization_uuid']
                log.debug(f":: invitation_code: {invitation_code}")
                try:
                    send_invitation_email(organization_invitation_uuid, invitation_email, invitation_code, organization_uuid)
                    create_responses.append(create_response['body'])
                except Exception as error:
                    log.error(f'>> process_invitation_file: {error}');
                    return return_error(500, "Invitation send failed")
              except Exception as error:
                raise
    log.info(create_responses)
    response_payload = {
      'status_code': 200,
      'invitations': create_responses
    }
    log.info(json.dumps(response_payload))
    return {
      'statusCode': 200,
      'headers': {
        'Content-Type': 'application/json'
      },
      'body': json.dumps(response_payload)
    }
  else:
    return return_error(500, 'No invitation file data present')

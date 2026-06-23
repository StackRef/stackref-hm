import boto3
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
  tator_notify
    Sends tator_message to room_uuid
'''
def tator_notify(message, room_uuid):
  log.info(':: tator_notify')

  message_uuid = uuid.uuid4()

  try:
      sqs = boto3.client('sqs')
      response = sqs.send_message(
          QueueUrl = settings.tator_sqs_url,
          MessageBody = json.dumps(message),
          MessageAttributes = {
            'roomUuid': {
              'StringValue': str(room_uuid),
              'DataType': 'String'
            }
          },
          MessageDeduplicationId = str(message_uuid),
          MessageGroupId = str(message_uuid)
      )
  except Exception as error:
    log.error(f'>> tator_notify: {error}')
    raise error

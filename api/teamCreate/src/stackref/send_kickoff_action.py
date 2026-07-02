import boto3
import logging
import uuid

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
  send_kickoff_action
    Sends an action to KickoffSQS queue
'''
def send_kickoff_action(team_uuid):
  log.info(':: send_kickoff_action')

  message_uuid = uuid.uuid4()

  try:
      sqs = boto3.client('sqs')
      sqs.send_message(
          QueueUrl = settings.kickoff_sqs_url,
          MessageBody = '{"action":"team_analysis_create"}',
          MessageAttributes = {
            'teamUuid': {
              'StringValue': str(team_uuid),
              'DataType': 'String'
            }
          },
          MessageDeduplicationId = str(message_uuid),
          MessageGroupId = str(message_uuid)
      )
  except Exception as error:
    log.error(f'>> send_kickoff_action: {error}')
    raise error

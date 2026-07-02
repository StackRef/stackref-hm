import json
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.process_eventbridge_event import process_eventbridge_event
from stackref.process_umpire_event import process_umpire_event

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')

'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if 'source' in event and 'detail-type' in event:
        if 'aws.ec2' in event['source']:
            process_eventbridge_event(event)
        if 'aws.rds' in event['source']:
            log.info(':: Process RDS Event')
        if 'aws.elasticache' in event['source']:
            process_eventbridge_event(event)
        if 'aws.lambda' in event['source']:
            log.info(':: Process Lambda Event')
        if 'aws.dynamodb' in event['source']:
            log.info(':: Process DynamoDB Event')
    elif 'requestContext' in event and event['requestContext']['intFnName'] == 'Umpire':
        process_umpire_event(event)


settings.init()

sentry_sdk.init(
    dsn="https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",

    integrations=[
        AwsLambdaIntegration()
    ],
    traces_sample_rate=1.0,
    release=settings.tator_version
)

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

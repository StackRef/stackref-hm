import json
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.handle_messages import process_sqs_message

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')

'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if (
        'Records' in event and
        'body' in event['Records'][0]
    ):
        for message in event['Records']:
            process_sqs_message(message)


settings.init()

sentry_sdk.init(
    dsn="https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",
    integrations=[
        AwsLambdaIntegration()
    ],
    traces_sample_rate=1.0,
    release=settings.kickoff_version
)

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

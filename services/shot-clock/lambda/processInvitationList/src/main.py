import json
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.process_invitation_file import process_invitation_file

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')

'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if 'Records' in event and len(event['Records']) > 0 and 's3' in event['Records'][0]:
        try:
            process_invitation_file(event['Records'][0]['s3'])
        except Exception as error:
            log.error(f'>> main: {error}')


settings.init()

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

sentry_sdk.init(
    dsn="https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",
    integrations=[
        AwsLambdaIntegration()
    ],
    traces_sample_rate=1.0,
    release=settings.shot_clock_version
)

if __name__ == "__main__":
    main()

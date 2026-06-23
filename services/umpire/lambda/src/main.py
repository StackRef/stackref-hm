import json
import logging
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

from stackref.process_aws_config import process_aws_config
from stackref.process_cloudtrail import process_cloudtrail
import stackref.settings as settings

print(':: Loading function')

'''
    main
'''
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if 'awslogs' in event:
        process_cloudtrail(event['awslogs'])

    elif 'invokingEvent' in event:
        ie = json.loads(event['invokingEvent'])
        if 'configurationItem' in ie:
            try:
                process_aws_config(ie['configurationItem'])
            except Exception as error:
                log.error(f'>> main: {error}')
    else:
        log.info(f':: Unhandled event')


settings.init()

sentry_sdk.init(
    dsn="https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",

    integrations=[
        AwsLambdaIntegration()
    ],
    traces_sample_rate=1.0,
    release=settings.umpire_version
)

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

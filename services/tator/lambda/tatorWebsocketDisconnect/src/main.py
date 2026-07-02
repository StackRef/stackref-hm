import json
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_disconnect import process_disconnect

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')

'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if 'requestContext' in event and 'connectionId' in event['requestContext']:
        connection_id = event['requestContext']['connectionId']
        try:
            disconnect_response = process_disconnect(connection_id)
        except Exception as error:
            log.error('>> Disconnection failed')
    else:
        log.error('>> Connection failed')


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

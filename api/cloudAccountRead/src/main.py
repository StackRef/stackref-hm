import re
import json
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_get_method import process_get_method
from stackref.auth0.auth0_jwt import check_auth0_jwt

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')



'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if (
        'requestContext' in event and
        'http' in event['requestContext'] and
        'method' in event['requestContext']['http']
    ):
        if event['requestContext']['http']['method'] == "GET":
            return process_get_method(event)
        else:
            return return_error(405, 'main: unhandled method')

    return return_error(500, 'main')

settings.init()

sentry_sdk.init(
    integrations=[
        AwsLambdaIntegration()
    ],
    enable_tracing=True,
    profiles_sample_rate=1.0,
    traces_sample_rate=1.0
)

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

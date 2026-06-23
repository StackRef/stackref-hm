import json
import logging
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_fn_method import process_fn_method
from stackref.process_post_method import process_post_method

print(':: Loading function')

sentry_sdk.init(
    dsn="https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",

    integrations=[
        AwsLambdaIntegration()
    ],
    enable_tracing=True,
    profiles_sample_rate=1.0,
    traces_sample_rate=1.0
)

'''
    main
'''
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if (
        'requestContext' in event and
        'http' in event['requestContext'] and
        'method' in event['requestContext']['http']
    ):
        if event['requestContext']['http']['method'] == "POST":
            return process_post_method(event)
        else:
            return return_error(405, 'main: unhandled method')
    elif (
        'requestContext' in event and
        'http' not in event['requestContext'] and
        'intFnName' in event['requestContext']
    ):
        return process_fn_method(event)

    return return_error(500, 'main')

settings.init()

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

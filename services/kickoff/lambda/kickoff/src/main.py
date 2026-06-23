import json
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.handle_kickoff import event_complete, event_start, event_end, event_warn, get_event_obj

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')

'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if 'action' in event and 'event_uuid' in event:
        try:
            event_obj = get_event_obj(event['event_uuid'])
        except Exception as error:
            log.error(f'>> main: {error}')
            raise error

        if not event_obj or 'event_uuid' not in event_obj:
            log.error(f'>> No such event exists. Exiting.')
            return

        send_warning = True

        if event['action'] == 'start':
            try:
                send_warning = event_start(event_obj)
            except Exception as error:
                log.error(f'>> main: {error}')
                raise error
        elif event['action'] == 'end':
            try:
                send_warning = event_end(event_obj)
            except Exception as error:
                log.error(f'>> main: {error}')
        elif event['action'] == 'judging_end':
            try:
                send_warning = event_complete(event_obj)
            except Exception as error:
                log.error(f'>> main: {error}')

        if send_warning:
            try:
                event_warn(event['action'], event_obj)
            except Exception as error:
                log.error(f'>> main: {error}')
    else:
        log.error('>> Malformed payload')

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
    release=settings.kickoff_version
)

if __name__ == "__main__":
    main()

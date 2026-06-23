import re
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_get_method import process_get_method
from stackref.process_post_method import process_post_method
from stackref.auth0.auth0_jwt import check_auth0_jwt

print(":: Loading function")

'''
    main
'''
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if (
        'headers' in event and
        'authorization' in event['headers'] and
        'x-sr-application' in event['headers']
    ):
        id_token = event['headers']['authorization']
        if (
            re.match("^SR/Coach", event['headers']['x-sr-application']) or
            re.match("^SR/WS", event['headers']['x-sr-application']) or
            re.match("^SR/Auth0", event['headers']['x-sr-application'])
        ):
            app = "be"
        else:
            app = "fe"
        if not check_auth0_jwt(id_token, app):
            return return_error(401, 'main')
    else:
        return return_error(401, 'main')

    if 'headers' in event and 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
        log.info(f":: organization_uuid header: {organization_uuid}")
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']
        log.info(f":: organization_uuid query param: {organization_uuid}")

    if 'headers' in event and 'x-sr-event-uuid' in event['headers']:
        event_uuid = event['headers']['x-sr-event-uuid']
    elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
        event_uuid = event['queryStringParameters']['event_uuid']
    else:
        event_uuid = '0'
    log.info(f":: event_uuid: {event_uuid}")
    
    try:
        organization_uuid
    except NameError:
        return return_error(500, 'No organization_uuid set')

    if (
        'requestContext' in event and
        'http' in event['requestContext'] and
        'method' in event['requestContext']['http']
    ):
        if event['requestContext']['http']['method'] == "GET":
            return process_get_method(event, organization_uuid, event_uuid)
        elif event['requestContext']['http']['method'] == "POST":
            return process_post_method(event, organization_uuid, event_uuid)
        else:
            return return_error(405, 'main: unhandled method')

    return return_error(500, 'main')

settings.init()

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

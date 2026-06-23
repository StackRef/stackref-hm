import re
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_get_method import process_get_method_resource, process_get_method_org_event
from stackref.process_post_method import process_post_method
from stackref.auth0.auth0_jwt import check_auth0_jwt

print(':: Loading function')

'''
    main
'''
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    organization_uuid = None
    event_uuid = None
    resource_uuid = None

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

        if 'headers' in event:
            if 'x-sr-organization-uuid' in event['headers']:
                organization_uuid = event['headers']['x-sr-organization-uuid']
            elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
                organization_uuid = event['queryStringParameters']['organization_uuid']

            if 'x-sr-event-uuid' in event['headers']:
                event_uuid = event['headers']['x-sr-event-uuid']
            elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
                event_uuid = event['queryStringParameters']['event_uuid']

            if 'x-sr-resource-uuid' in event['headers']:
                resource_uuid = event['headers']['x-sr-resource-uuid']
            elif 'queryStringParameters' in event and 'resource_uuid' in event['queryStringParameters']:
                resource_uuid = event['queryStringParameters']['resource_uuid']

        # Calls from non-WS calls must at least have these set
        if (
            not re.match("^SR/WS", event['headers']['x-sr-application']) and
            not resource_uuid and
            (not organization_uuid and not event_uuid)
        ):
            return return_error(500, 'No resource_uuid or organization_uuid or event_id set')

    else:
        return return_error(401, 'main')

    if (
        'requestContext' in event and
        'http' in event['requestContext'] and
        'method' in event['requestContext']['http']
    ):
        if event['requestContext']['http']['method'] == "GET":
            if resource_uuid:
                return process_get_method_resource(event, resource_uuid)
            else:
                return process_get_method_org_event(event, organization_uuid, event_uuid)
        elif event['requestContext']['http']['method'] == "POST":
            return process_post_method(event, resource_uuid)
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

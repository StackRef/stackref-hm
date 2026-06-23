import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.process_get_method import process_get_method

print(":: Loading function")

'''
    main
'''
def main(event, context):
    log.debug(":: Received event: " + json.dumps(event, indent=2))

    if 'requestContext' in event and 'http' in event['requestContext'] and 'method' in event['requestContext']['http']:
        if event['requestContext']['http']['method'] == "GET":
            return process_get_method(event)
        else:
            return return_error(405, 'main: unhandled method')

    return return_error(500, 'main')

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

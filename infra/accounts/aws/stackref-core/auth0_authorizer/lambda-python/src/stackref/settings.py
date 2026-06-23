import json
import os
import logging

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)

'''
    init
        Initialize global variables to use across our modules
'''
def init():
    global auth0_token
    global auth0_domain
    global auth0_client_id
    global auth0_client_ids
    global auth0_be_audience

    # Auth0
    auth0_token = os.environ.get('SR_AUTH0_TOKEN')
    auth0_domain = os.environ.get('SR_AUTH0_DOMAIN')
    auth0_client_id = os.environ.get('SR_AUTH0_CLIENT_ID')
    auth0_client_ids = json.loads(os.environ.get('SR_AUTH0_CLIENT_IDS'))
    auth0_be_audience = os.environ.get('SR_AUTH0_BE_AUDIENCE')

'''
    logging_config
        Sets global logging configuration. Set to INFO in testing. Set to WARN or ERROR otherwise
'''
def logging_config():
    global log_level
    log_level = logging.ERROR

    if os.environ['SR_LOGGING_LEVEL']:
        log_level = {
            'DEBUG': logging.DEBUG,
            'INFO': logging.INFO,
            'WARN': logging.WARN,
            'ERROR': logging.ERROR,
            'CRITICAL': logging.CRITICAL
        }.get(os.environ['SR_LOGGING_LEVEL'], logging.ERROR)

'''
    return_error
'''
def return_error(status_code=500, message='An Unknown Error Occurred'):
    log.info(':: return_error')

    body = f'{{"status_code":"{status_code}","error":"{message}"}}'

    print(f':: return_error: {body}')

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': body
    }

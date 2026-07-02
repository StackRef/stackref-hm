import logging

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
'''
def process_message(message, room_uuid):
    log.info(f':: process_message: {message}')

    try:
        tator_notify(message, room_uuid)
    except Exception as error:
        log.error(f'>> process_message: {error}')
        raise error

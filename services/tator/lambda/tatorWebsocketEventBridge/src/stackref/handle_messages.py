import logging
from pydash import get

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.grant_functions import *
from example.cloud_account import get_cloud_account_from_account_id
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
'''
def process_message(event_details, message):
    log.info(f':: process_message: {message}')

    if 'account_id' in event_details:
        try:
            cloud_account = get_cloud_account_from_account_id(event_details['account_id'])
            if cloud_account and 'cloud_account_owner_uuid' in cloud_account:
                account_owner_uuid = cloud_account['cloud_account_owner_uuid']
            else:
                account_owner_uuid = None
        except Exception as error:
            log.error(f'>> process_message: {error}')
            raise error

        if account_owner_uuid:
            try:
                tator_notify(message, account_owner_uuid)
            except Exception as error:
                log.error(f'>> process_message: {error}')
                raise error

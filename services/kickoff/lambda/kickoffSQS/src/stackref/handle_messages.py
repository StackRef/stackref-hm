from decimal import Decimal
import json
import logging

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.create_team_analysis import create_team_analysis
from stackref.delete_team_analysis import delete_team_analysis

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)

'''
'''
def process_sqs_message(message):
    log.info(':: process_sqs_message')

    try:
        body = json.loads(message['body'])
    except Exception as error:
        log.error(f'>> process_sqs_message: {error}')
        raise error

    try:
        if body['action'] == 'team_analysis_create':
            team_uuid = str(message['messageAttributes']['teamUuid']['stringValue'])
            create_team_analysis(team_uuid)
        if body['action'] == 'team_analysis_delete':
            team_uuid = str(message['messageAttributes']['teamUuid']['stringValue'])
            delete_team_analysis(team_uuid)
    except Exception as error:
        log.error(f'>> process_sqs_message: {error}')
        raise error

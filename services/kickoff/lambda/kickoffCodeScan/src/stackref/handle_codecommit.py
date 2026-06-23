import boto3
from decimal import Decimal
import json
import logging

import stackref.settings as settings

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
def execute_pipeline(team_uuid, session):
    log.info(':; executee_pipeline')

    try:
        cp_client = session.client('codepipeline')
        response = cp_client.start_pipeline_execution(
            name=f'sr_team_codescan_{team_uuid}'
        )
    except Exception as error:
        log.error(f'>> execute_pipeline: {error}')
        raise error

'''
'''
def process_commit(event):
    log.info(':: process_commit')

    team_uuid = None

    try:
        if 'customData' in event['Records'][0]:
            custom_data = json.loads(event['Records'][0]['customData'])
            team_uuid = custom_data['team_uuid']

        if not team_uuid:
            raise ValueError('team_uuid must be set')

        codescans_session = assume_role_analysis_codescans()
        execute_pipeline(team_uuid, codescans_session)
    except Exception as error:
        log.error(f'>> process_commit: {error}')
        raise error

'''
    assume_role_analysis_codescans
        Assume the role in the stackref-analysis-codescans account to take action there
'''
def assume_role_analysis_codescans():
    sts_client = boto3.client("sts")

    try:
        response = sts_client.assume_role(
            RoleArn=settings.codescans_role,
            RoleSessionName="codescans-session"
        )
    except Exception as error:
        log.error(f'>> assume_role_analysis_codescans: {error}')
        raise error

    new_session = boto3.Session(aws_access_key_id=response['Credentials']['AccessKeyId'],
                        aws_secret_access_key=response['Credentials']['SecretAccessKey'],
                        aws_session_token=response['Credentials']['SessionToken'])

    return new_session

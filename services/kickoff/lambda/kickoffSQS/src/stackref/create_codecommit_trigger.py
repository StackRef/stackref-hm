import json
import logging

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)


'''
'''
def create_codecommit_trigger(team_uuid, session):
    log.info(':: create_codecommit_trigger')

    cc_client = session.client('codecommit')
    custom_data = {"team_uuid": team_uuid}

    try:
        response = cc_client.put_repository_triggers(
            repositoryName=team_uuid,
            triggers=[
                {
                    'name': f'sr-kickoff-codescan-{team_uuid}',
                    'destinationArn': 'arn:aws:lambda:us-east-1:000000000000:function:kickoffCodeScan',
                    'customData': json.dumps(custom_data),
                    'branches': [
                        'main',
                    ],
                    'events': [
                        'updateReference'
                    ]
                },
            ]
        )
        log.debug(response)
    except Exception as error:
        log.error(f'>> create_codecommit_trigger: {error}')
        raise error

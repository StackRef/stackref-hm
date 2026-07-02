import logging
import os

import stackref.settings as settings
from stackref.delete_teams_analysis import delete_teams_analysis

print(':: Loading function')

'''
    main
'''
def main():

    event_uuid = os.environ.get('SR_EVENT_UUID')

    log.info(f':: Removing all IAM users and CodeCommit repos for Event {event_uuid}')

    if not event_uuid:
        log.error('>> No Event UUID specified. Exiting.')
    else:
        try:
            delete_teams_analysis(event_uuid)
        except Exception as error:
            log.error(f'>> main: {error}')
            raise error

settings.init()

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

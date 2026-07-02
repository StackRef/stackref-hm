import os
import logging

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)

'''
    init
        Initialize global variables to use across our modules
'''
def init():
    global umpire_version

    umpire_version = os.environ.get('SR_UMPIRE_VERSION')

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

import boto3
import json
import os
import logging
import psycopg

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)

'''
    init
        Initialize global variables to use across our modules
'''
def init():
    global shot_clock_version
    global db_secrets
    global memcached_cluster_cfg_ep
    global memcached_cache_ttl
    global org_invitations_sqs_url
    global tator_sqs_url
    global max_emails_per_file

    shot_clock_version = os.environ.get('SR_SHOT_CLOCK_VERSION')

    db_credentials_secrets_store_arn = os.environ.get('SR_DB_SECRET_ARN')
    memcached_cluster_cfg_ep = os.environ.get('SR_MEMCACHED_CFG_EP')
    memcached_cache_ttl = 3600
    org_invitations_sqs_url = os.environ.get('SR_ORG_INVITATIONS_SQS_URL')
    tator_sqs_url = os.environ.get('SR_TATOR_SQS_URL')
    max_emails_per_file = int(os.environ.get('SR_MAX_EMAILS_PER_FILE', 100))

    try:
        secrets_client = boto3.client('secretsmanager')
        db_secret_value = secrets_client.get_secret_value(
            SecretId = db_credentials_secrets_store_arn
        )
    except Exception as error:
        raise error

    if 'SecretString' in db_secret_value:
        db_secrets = json.loads(db_secret_value['SecretString'])

'''
    db_conn
        Reusable database connection
'''
def db_conn():
    database_name = os.environ.get('SR_DB_NAME')
    try:
        return psycopg.connect(
                host = db_secrets['host'],
                port = db_secrets['port'],
                dbname = database_name,
                user = db_secrets['username'],
                password = db_secrets['password']
            )
    except Exception as error:
        raise error

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

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
    global db_secrets
    global memcached_cluster_cfg_ep
    global memcached_cache_ttl
    global codescans_role
    global analysis_account_id

    db_credentials_secrets_store_arn = os.environ.get('SR_DB_SECRET_ARN')
    memcached_cluster_cfg_ep = os.environ.get('SR_MEMCACHED_CFG_EP')
    memcached_cache_ttl = 3600
    codescans_role = os.environ.get('SR_ANALYSIS_CODESCANS_ROLE')
    analysis_account_id = os.environ.get('SR_ANALYSIS_ACCOUNT_ID')

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

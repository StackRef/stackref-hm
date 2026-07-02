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
    global kickoff_version
    global db_secrets
    global db_credentials_secrets_store_arn
    global ec2_client
    global memcached_cluster_cfg_ep
    global memcached_cache_ttl
    global ws_endpoint
    global ws_connections_table
    global ws_rooms_table
    global room_notifications_table
    global user_notifications_table
    global ddb_short_ttl
    global ddb_long_ttl
    global codescans_role
    global analysis_account_id

    kickoff_version = os.environ.get('SR_KICKOFF_VERSION')

    db_credentials_secrets_store_arn = os.environ.get('SR_DB_SECRET_ARN')
    ec2_client = boto3.client('ec2')
    memcached_cluster_cfg_ep = os.environ.get('SR_MEMCACHED_CFG_EP')
    memcached_cache_ttl = 3600
    ws_endpoint = os.environ.get('SR_WEBSOCKET_EP')
    ws_connections_table = os.environ.get('SR_CONNECTIONS_DDB_TABLE')
    ws_rooms_table = os.environ.get('SR_ROOMS_DDB_TABLE')
    room_notifications_table = os.environ.get('SR_ROOM_NOTIFICATIONS_DDB_TABLE')
    user_notifications_table = os.environ.get('SR_USER_NOTIFICATIONS_DDB_TABLE')
    ddb_short_ttl = 1800 # 30m
    ddb_long_ttl = 604800 # 1w
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

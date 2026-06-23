import boto3
import json
import os
import logging

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)

'''
    init
        Initialize global variables to use across our modules
'''
def init():
    global tator_version
    global database_name
    global db_cluster_arn
    global db_credentials_secrets_store_arn
    global ec2_client
    global rds_client
    global memcached_cluster_cfg_ep
    global memcached_cache_ttl
    global ws_connections_table
    global ws_rooms_table
    global auth0_token
    global auth0_domain
    global auth0_client_id
    global auth0_client_ids
    global auth0_be_audience
    global ddb_short_ttl
    global ddb_long_ttl

    tator_version = os.environ.get('SR_TATOR_VERSION')

    database_name = os.environ.get('SR_DB_NAME')
    db_cluster_arn = os.environ.get('SR_DB_ARN')
    db_credentials_secrets_store_arn = os.environ.get('SR_DB_SECRET_ARN')
    ec2_client = boto3.client('ec2')
    rds_client = boto3.client('rds-data')
    memcached_cluster_cfg_ep = os.environ.get('SR_MEMCACHED_CFG_EP')
    memcached_cache_ttl = 3600
    ws_connections_table = os.environ.get('SR_CONNECTIONS_DDB_TABLE')
    ws_rooms_table = os.environ.get('SR_ROOMS_DDB_TABLE')
    ddb_short_ttl = 1800 # 30m
    ddb_long_ttl = 604800 # 1w

    # Auth0
    auth0_token = os.environ.get('SR_AUTH0_TOKEN')
    auth0_domain = os.environ.get('SR_AUTH0_DOMAIN')
    auth0_client_id = os.environ.get('SR_AUTH0_CLIENT_ID')
    auth0_client_ids = json.loads(os.environ.get('SR_AUTH0_CLIENT_IDS'))
    auth0_be_audience = os.environ.get('SR_AUTH0_BE_AUDIENCE')

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

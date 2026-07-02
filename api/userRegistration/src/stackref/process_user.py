import json
import logging
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_user
        Process a received user payload
'''
def process_user(user):
    log.info(":: process_user")

    user_uuid = uuid.uuid4()
    first_name = ''
    last_name = ''
    email_address = ''
    phone = ''
    job_title = ''
    auth_provider_id = user['user_id']
    email_verified = user['email_verified']

    if 'email' in user:
        email_address = user['email']
    if 'given_name' in user:
        first_name = user['given_name']
    if 'family_name' in user:
        last_name = user['family_name']
    if 'phone' in user:
        phone = user['phone']
    if 'job_title' in user:
        job_title = user['job_title']

    sql_statement = ("""
        -- Add the new User
        INSERT
            INTO
            sr.user (
                user_uuid,
                auth_provider_id,
                email_address,
                first_name,
                last_name,
                phone,
                job_title,
                email_verified
            )
        VALUES (
            %(user_uuid)s::UUID,
            %(auth_provider_id)s,
            %(email_address)s,
            %(first_name)s,
            %(last_name)s,
            %(phone)s,
            %(job_title)s,
            %(email_verified)s
        );
    """)
    sql_parameters = {
        'user_uuid': user_uuid,
        'auth_provider_id': auth_provider_id,
        'email_address': email_address,
        'first_name': first_name,
        'last_name': last_name,
        'phone': phone,
        'job_title': job_title,
        'email_verified': email_verified
    }
    log.info(str(sql_statement))
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> process_user: {error}")
        return return_error(503, error) 

    log.info(f":: process_user user_uuid: {user_uuid}")

    try:
        incr_key_prefix('user')
    except:
        log.error('>> incr_key_prefix')

    response_payload = {
        "status_code": 200,
        "user_uuid": str(user_uuid)
    }

    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'body': response_body
    }


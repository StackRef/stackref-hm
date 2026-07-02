import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    register_user
        Process user registration
'''
def register_user(user):
    log.info(":: register_user")

    user_uuid = user['user_uuid']
    first_name = user['first_name']
    last_name = user['last_name']
    email_address = user['email']
    job_title = user['job_title']

    sql_statement = ("""
        -- Set the User registration info
        UPDATE
            sr.user
        SET 
            first_name = %(first_name)s,
            last_name = %(last_name)s,
            email_address = %(email_address)s,
            job_title = %(job_title)s,
            registered = TRUE,
            ts_modified = NOW()
        WHERE
            user_uuid = %(user_uuid)s::UUID;
    """)
    sql_parameters = {
        'user_uuid': user_uuid,
        'first_name': first_name,
        'last_name': last_name,
        'email_address': email_address,
        'job_title': job_title
    }
    log.info(str(sql_statement))
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> assign_cloud_account: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('user')
    except:
        log.error('>> incr_key_prefix')

    log.info(f":: register_user user_uuid: {user_uuid}")

    response_payload ={
        "status_code": 200,
        "user_uuid": user_uuid
    }

    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'body': response_body
    }


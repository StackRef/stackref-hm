import hashlib
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    get_org_users
        Retrieve all Organization Users
'''
def get_org_users(organization_uuid):
    log.info(":: process_get_method")

    sql_parameters = {'organization_uuid': organization_uuid}

    sql_statement = (f""" 
        -- Retrieve Organization Users
        SELECT
            json_agg(users.user_uuid) AS users
        FROM
            (
                SELECT
                    user_uuid
                FROM
                    sr.user
                WHERE
                    organization_uuid = %(organization_uuid)s::UUID
                    AND registered = TRUE
            ) AS users;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('user', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_org_users: {error}")
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('user', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return json.loads(payload)

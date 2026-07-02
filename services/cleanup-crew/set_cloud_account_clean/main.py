import logging
import os

import stackref.settings as settings
from stackref.cache_functions import incr_key_prefix

print(':: Loading function')

'''
    main
'''
def main():

    cloud_account_name = os.environ.get('CLOUD_ACCOUNT_NAME')

    log.info(f':: Setting cloud account {cloud_account_name} status to Clean')

    if not cloud_account_name:
        log.error('>> No cloud account specified. Exiting.')
    else:
        sql_statement = ("""
            -- Set cloud_account status to Clean
            UPDATE
                sr.cloud_account
            SET
                cloud_account_owner_uuid = UUID('00000000-0000-0000-0000-000000000000'),
                cloud_account_status_id = (
                    SELECT
                        cloud_account_status_id
                    FROM
                        sr.cloud_account_status
                    WHERE
                        cloud_account_status_name = 'Clean'
                ),
                ts_modified = NOW()
            WHERE
                cloud_account_name = %(cloud_account_name)s;
        """)
        sql_parameters = {'cloud_account_name': cloud_account_name}

        log.debug(sql_statement)
        try:
            with settings.db_conn() as db_conn: 
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
        except Exception as error:
            log.error(f">> main: {error}")
            raise error

        try:
            incr_key_prefix('cloud_account')
            incr_key_prefix('cloud_account_user')
            incr_key_prefix('team')
        except Exception as error:
            log.error(f'>> main: incr_key_prefix: {error}')
            raise error

settings.init()

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

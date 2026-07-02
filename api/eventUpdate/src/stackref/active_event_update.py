import hashlib
import json
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.send_kickoff_action import send_kickoff_action

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    unset_active_event
        Set Event for all Participants to not active
'''
def unset_active_event(event_uuid):
    log.info(":: unset_active_event")

    sql_statement = ("""
        -- Unset active Event for all Participants
        UPDATE
            sr.participant
        SET
            is_active = FALSE,
            ts_modified = NOW()
        WHERE
            event_uuid = %(event_uuid)s::UUID;
    """)
    sql_parameters = {'event_uuid': event_uuid}

    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> unset_active_event: {error}")
        raise error

    try:
        incr_key_prefix('participant')
    except:
        log.error('>> incr_key_prefix')

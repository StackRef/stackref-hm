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
    archive_judging_criterion
        Archive a Judging Criterion and return judging_criterion_uuid and status
'''
def archive_judging_criterion(payload_json):
    log.info(":: archive_judging_criterion")

    organization_uuid = str(payload_json['criterion']['organization_uuid'])
    judging_criterion_uuid = str(payload_json['criterion']['judging_criterion_uuid'])

    sql_statement = ("""
        -- Archive the Judging Criterion
        UPDATE
            sr.judging_criterion
        SET
            judging_criterion_status_id = (
                SELECT
                    judging_criterion_status_id
                FROM
                    sr.judging_criterion_status
                WHERE
                    judging_criterion_status_name = 'Archived'
            ),
            ts_modified = NOW()
        WHERE
            organization_uuid = %(organization_uuid)s::UUID
            AND judging_criterion_uuid = %(judging_criterion_uuid)s::UUID;
    """)
    sql_parameters = {
        'judging_criterion_uuid': judging_criterion_uuid,
        'organization_uuid': organization_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> archive_judging_criterion: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('judging_criterion')
        incr_key_prefix('team_score_item')
    except:
        log.error('>> incr_key_prefix')

    response_payload = {
        'status_code': 200,
        'event_uuid': str(judging_criterion_uuid)
    }
    response_body = json.dumps(response_payload)

    log.info(response_body)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

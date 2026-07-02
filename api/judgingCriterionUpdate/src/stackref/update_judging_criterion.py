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
    update_judging_criterion
        Update a Judging Criterion and return judging_criterion_uuid and status
'''
def update_judging_criterion(payload_json):
    log.info(":: update_judging_criterion")

    organization_uuid = str(payload_json['criterion']['organization_uuid'])
    judging_criterion_uuid = str(payload_json['criterion']['judging_criterion_uuid'])
    criterion_weight = int(json.dumps(payload_json['criterion']['criterion_weight']))
    judging_criterion_category_id = int(json.dumps(payload_json['criterion']['category_id']))
    criterion_details = json.dumps(payload_json['criterion']['criterion_details'])

    sql_statement = ("""
        -- Update the Judging Criterion
        UPDATE
            sr.judging_criterion
        SET
            criterion_weight = %(criterion_weight)s,
            judging_criterion_category_id = %(judging_criterion_category_id)s,
            criterion_details = %(criterion_details)s::JSONB,
            ts_modified = NOW()
        WHERE
            organization_uuid = %(organization_uuid)s::UUID
            AND judging_criterion_uuid = %(judging_criterion_uuid)s::UUID;
    """)
    sql_parameters = {
        'organization_uuid': organization_uuid,
        'judging_criterion_uuid': judging_criterion_uuid,
        'criterion_weight': int(criterion_weight),
        'judging_criterion_category_id': int(judging_criterion_category_id),
        'criterion_details': criterion_details
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_judging_criterion: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('judging_criterion')
    except:
        log.error('>> incr_key_prefix')

    response_payload = {
        'status_code': 200,
        'judging_criterion_uuid': str(judging_criterion_uuid)
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

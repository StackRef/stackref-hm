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
    create_judging_criterion
        Create single judging criterion and return its details
'''
def create_judging_criterion(payload_json):
    log.info(":: create_judging_criterion")

    criterion_uuid = uuid.uuid4()

    organization_uuid = str(payload_json['criterion']['organization_uuid'])
    event_uuid = str(payload_json['criterion']['event_uuid'])
    criterion_weight = int(json.dumps(payload_json['criterion']['criterion_weight']))
    judging_criterion_category_id = int(json.dumps(payload_json['criterion']['category_id']))
    criterion_details = json.dumps(payload_json['criterion']['criterion_details'])

    sql_statement = ("""
        -- Create new judging criterion for the Organization
        INSERT
            INTO
            sr.judging_criterion (
                judging_criterion_uuid,
                organization_uuid,
                event_uuid,
                criterion_weight,
                judging_criterion_category_id,
                criterion_details
            )
        VALUES (
            %(criterion_uuid)s::UUID,
            %(organization_uuid)s::UUID,
            %(event_uuid)s::UUID,
            %(criterion_weight)s,
            %(judging_criterion_category_id)s,
            %(criterion_details)s::JSONB
        );
    """)
    sql_parameters = {
        'criterion_uuid': criterion_uuid,
        'organization_uuid': organization_uuid,
        'event_uuid': event_uuid,
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
        log.error(f">> create_judging_criterion: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('judging_criterion')
        incr_key_prefix('team_score_item')
    except:
        log.error('>> incr_key_prefix')

    response_payload = {
        'status_code': 200,
        'judging_criterion_uuid': str(criterion_uuid)
    }
    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

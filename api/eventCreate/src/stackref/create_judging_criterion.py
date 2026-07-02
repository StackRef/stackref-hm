import json
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_judging_criterion
        Create single judging criterion and return its details
'''
def create_judging_criterion(event_uuid, payload_json):
    log.info(":: create_judging_criterion")

    criterion_uuid = uuid.uuid4()

    organization_uuid = str(payload_json['event']['organization_uuid'])
    criterion_weight = 1
    judging_criterion_category_id = 1
    criterion_details_json = {
        "criterion_name": "Overall",
        "criterion_summary": "Overall score",
        "criterion_description": "Default criterion for new events"
    }
    criterion_details = json.dumps(criterion_details_json)

    sql_statement = ("""
        -- Create default judging criterion for a new Event
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
    log.debug(sql_parameters)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_judging_criterion: {error}")
        raise error

    try:
        incr_key_prefix('judging_criterion')
    except:
        log.error('>> incr_key_prefix')

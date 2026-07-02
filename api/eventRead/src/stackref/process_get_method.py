import hashlib
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.event_activity import event_activity
from stackref.grant_functions import *
from stackref.judging_status import judging_status

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_get_method
        Process GET method requests
'''
def process_get_method(event):
    log.info(":: process_get_method")

    organization_uuid = None
    event_uuid = None
    action = None

    if 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']
    if 'x-sr-event-uuid' in event['headers'] and event['headers']['x-sr-event-uuid'] != "undefined":
        event_uuid = event['headers']['x-sr-event-uuid']
    elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
        event_uuid = event['queryStringParameters']['event_uuid']
    if 'x-sr-action' in event['headers'] and event['headers']['x-sr-action'] != "undefined":
        action = event['headers']['x-sr-action']
    elif 'queryStringParameters' in event and 'action' in event['queryStringParameters']:
        action = event['queryStringParameters']['action']

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    if action == 'judging_status':
        if 'event_read' not in grants:
            return return_error(401, "Not authorized")
        return judging_status(event_uuid)

    if action and "event_activity" in action:
        offset, count = action.split('-')[1:]
        if not count or not offset:
            offset = 0
            count = 25
        if 'event_read' not in grants:
            return return_error(401, "Not authorized")
        return event_activity(event_uuid, offset, count)

    # TODO: We won't return Archived Events but we should be able to with an option and grants.
    where_clause = """
        WHERE
            e.event_status_id !=
                (
                    SELECT
                        event_status_id
                    FROM
                        sr.event_status
                    WHERE
                        event_status_name = 'Archived'
                )
    """
    sql_parameters = {}

    # Check if requester's grant permits either:
    #   - Able to read all Events in the Organization (event_read)
    #   - Is a Participant in the queried Event
    authorized = (
        'event_read' in grants,
        len(get_participant_grants(get_user_uuid(event), event_uuid)) > 0
    )
    if not any(authorized):
        return return_error(401, "Not authorized")

    # Only allow Users or BE with 'platform_read' access to see all Organizations
    if not organization_uuid and 'platform_read' not in grants:
        return return_error(401, "Not authorized")

    if organization_uuid:
        where_clause += ' AND organization_uuid = %(organization_uuid)s::UUID'
        sql_parameters['organization_uuid'] = organization_uuid
    if event_uuid:
        where_clause += ' AND event_uuid = %(event_uuid)s::UUID'
        sql_parameters['event_uuid'] = event_uuid

    sql_statement = (f"""
        -- Retrieve event(s)
        SELECT
            json_agg(row_to_json(events))
        FROM
            (
                SELECT
                    event.event_uuid,
                    event.ts_event_start,
                    event.ts_event_end,
                    event.event_judging_minutes,
                    event.cloud_accounts_enabled,
                    event.event_details,
                    event.participant_roles AS participant_roles,
                    bank.balance_value AS bank_balance,
                    event.event_status_id,
                    event.event_status_name,
                    event.event_type_id,
                    event.event_type_name,
                    event.event_team_form_mode_id,
                    event.event_team_form_mode_name,
                    event.event_team_form_mode_description,
                    event.event_is_judging,
                    event.event_time_elapsed,
                    entity_asset.entity_asset_uuid AS banner_image_uuid
                FROM
                    (
                        SELECT
                            e.event_uuid,
                            e.organization_uuid,
                            to_char(e.ts_event_start, 'YYYY-MM-DD HH24:MI:SS') AS ts_event_start,
                            to_char(e.ts_event_end, 'YYYY-MM-DD HH24:MI:SS') AS ts_event_end,
                            e.event_judging_minutes,
                            e.cloud_accounts_enabled,
                            e.event_details,
                            es.event_status_id AS event_status_id,
                            es.event_status_name AS event_status_name,
                            et.event_type_id AS event_type_id,
                            et.event_type_name AS event_type_name,
                            tfm.event_team_form_mode_id AS event_team_form_mode_id,
                            tfm.event_team_form_mode_name AS event_team_form_mode_name,
                            tfm.event_team_form_mode_description AS event_team_form_mode_description,
                            e.ts_event_end + INTERVAL '1 minute' * e.event_judging_minutes < NOW() AND e.ts_event_end > NOW() AS event_is_judging,
                            NOW() > e.ts_event_end AS event_time_elapsed,
                            (
                                SELECT
                                    json_agg(row_to_json(x))
                                FROM
                                    (
                                        SELECT
                                            participant_role_id,
                                            participant_role_name
                                        FROM
                                            sr.participant_role
                                    ) x
                            ) AS participant_roles
                        FROM
                            sr.event AS e
                        LEFT JOIN sr.event_status es ON 
                            e.event_status_id = es.event_status_id
                        LEFT JOIN sr.event_type et ON 
                            e.event_type_id = et.event_type_id
                        LEFT JOIN sr.event_team_form_mode tfm ON 
                            e.event_team_form_mode_id = tfm.event_team_form_mode_id
                        {where_clause}
                        ORDER BY
                            e.event_status_id,
                            e.ts_event_start DESC
                    ) AS event
                LEFT JOIN LATERAL (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(event.event_uuid) AS balance_value
                ) AS bank ON
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        entity_asset_uuid
                    FROM
                        sr.entity_asset
                    WHERE
                        entity_uuid = event.event_uuid
                        AND entity_asset_type_id = (
                            SELECT
                                entity_asset_type_id
                            FROM
                                sr.entity_asset_type
                            WHERE
                                entity_asset_type_name = 'banner_image'
                        )
                    ORDER BY
                        ts_modified ASC
                    LIMIT 1
                ) AS entity_asset ON
                TRUE
            ) AS events; 
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('event', hashed_query)
    if cached_data:
        log.info(':: Using cached data')
        payload = cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> process_get_method: {error}")
            return return_error(503, error)

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '[]'

        try:
            cache_query_response('event', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

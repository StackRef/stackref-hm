import hashlib
import logging

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *
from stackref.grant_functions import *

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

    team_uuid = None

    if 'x-sr-team-uuid' in event['headers'] and event['headers']['x-sr-team-uuid'] != "undefined":
        team_uuid = event['headers']['x-sr-team-uuid']
    elif 'queryStringParameters' in event and 'team_uuid' in event['queryStringParameters']:
        team_uuid = event['queryStringParameters']['team_uuid']

    if not team_uuid:
        return return_error(500, 'Malformed request')

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) + get_be_auth0_scope(event)

    sql_parameters = {'team_uuid':team_uuid}

    if 'platform_read' not in grants and 'team_read' not in grants:
        return return_error(401, "Not authorized")

    sql_statement = ("""
        -- Retrieve kanban items for Team
        SELECT
            json_build_object(
                'kanban_item_statuses', (
                    SELECT json_agg(row_to_json(kis))
                    FROM (
                        SELECT
                            kanban_item_status_id,
                            kanban_item_status_name,
                            kanban_item_status_description
                        FROM
                            sr.kanban_item_status
                    ) AS kis
                ),
                'kanban_items', (
                    SELECT json_agg(row_to_json(ki))
                    FROM (
                        SELECT
                            ki.kanban_item_uuid,
                            ki.kanban_item_status_id,
                            ki.kanban_item_priority,
                            ki.kanban_item_issuer_uuid,
                            ki.kanban_item_owner_uuid,
                            ki.kanban_item_details,
                            ki.ts_modified,
                            (
                                SELECT row_to_json(kii)
                                FROM (
                                    SELECT
                                        tm.team_member_uuid,
                                        u.first_name,
                                        u.last_name,
                                        u.email_address
                                    FROM
                                        sr.team_member AS tm
                                    LEFT JOIN sr.participant p ON
                                        tm.participant_uuid = p.participant_uuid
                                    LEFT JOIN sr."user" u ON
                                        p.user_uuid = u.user_uuid
                                    WHERE
                                        tm.team_member_uuid = ki.kanban_item_issuer_uuid
                                ) AS kii
                            ) AS kanban_item_issuer,
                            (
                                SELECT row_to_json(kio)
                                FROM (
                                    SELECT
                                        tm.team_member_uuid,
                                        u.first_name,
                                        u.last_name,
                                        u.email_address
                                    FROM
                                        sr.team_member AS tm
                                    LEFT JOIN sr.participant p ON
                                        tm.participant_uuid = p.participant_uuid
                                    LEFT JOIN sr."user" u ON
                                        p.user_uuid = u.user_uuid
                                    WHERE
                                        tm.team_member_uuid = ki.kanban_item_owner_uuid
                                ) AS kio
                            ) AS kanban_item_owner
                        FROM
                            sr.kanban_item AS ki
                        LEFT JOIN sr.kanban_item_status kis ON
                            ki.kanban_item_status_id = kis.kanban_item_status_id
                        WHERE
                            ki.team_uuid = %(team_uuid)s::UUID
                        ORDER BY
                            ki.kanban_item_status_id,
                            ki.kanban_item_priority,
                            ki.ts_modified DESC
                    ) AS ki
                )
            ) AS result;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('kanban_item', hashed_query)
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
            cache_query_response('kanban_item', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

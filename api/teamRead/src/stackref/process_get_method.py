import botocore.exceptions
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
    process_get_method
        Process GET method requests
'''
def process_get_method(event):
    log.info(":: process_get_method")

    event_uuid = None
    team_uuid = None

    if 'x-sr-event-uuid' in event['headers'] and event['headers']['x-sr-event-uuid'] != "undefined":
        event_uuid = event['headers']['x-sr-event-uuid']
    elif 'queryStringParameters' in event and 'event_uuid' in event['queryStringParameters']:
        event_uuid = event['queryStringParameters']['event_uuid']
    if 'x-sr-team-uuid' in event['headers'] and event['headers']['x-sr-team-uuid'] != "undefined":
        team_uuid = event['headers']['x-sr-team-uuid']
    elif 'queryStringParameters' in event and 'team_uuid' in event['queryStringParameters']:
        team_uuid = event['queryStringParameters']['team_uuid']

    user_uuid = get_user_uuid(event)

    grants = get_user_grants(user_uuid,get_organization_uuid(event)) + get_be_auth0_scope(event)

    # TODO: We won't return Archived Teams but we should be able to with an option and grants.
    #       Also need to check for 'Archived' by name not ID (4).
    where_clause = 'WHERE t.team_status_id != 4'
    sql_parameters = {}

    # Check if requester's grant permits either:
    #   - Able to read all Events in the Organization (event_read)
    #   - Is a Participant in the queried Event
    authorized = (
        'event_read' in grants,
        len(get_participant_grants(user_uuid, event_uuid)) > 0
    )
    if not any(authorized):
        return return_error(401, "Not authorized")

    # Only allow Users or BE with 'event_read' access to see all Events
    if not event_uuid and 'event_read' not in grants:
        return return_error(401, "Not authorized")

    if event_uuid:
        where_clause += ' AND event_uuid = %(event_uuid)s::UUID'
        sql_parameters['event_uuid'] = event_uuid

    private_links_clause = ''
    codecommit_query_1 = ''
    codecommit_query_2 = ''

    if team_uuid:
        authorized = (
            'platform_read' in grants,
            len(get_team_member_grants(user_uuid, team_uuid)) > 0
        )
        if not any(authorized): # Non-team member can only see non-private Team links and Git credentials
            private_links_clause = ' AND tel.team_private = false'
        else:
            codecommit_query_1 = ', codecommit.codecommit_info AS codecommit_info'
            codecommit_query_2 = """
                LEFT JOIN LATERAL (
                    SELECT row_to_json(z) AS codecommit_info
                        FROM
                            (
                                SELECT
                                    team_codecommit_repo_url,
                                    team_codecommit_user,
                                    team_codecommit_password
                                FROM
                                    sr.team_codecommit
                                WHERE
                                    team_uuid = e1.team_uuid
                            ) AS z
                ) AS codecommit ON
                TRUE 
            """
        where_clause += ' AND team_uuid = %(team_uuid)s::UUID'
        sql_parameters['team_uuid'] = team_uuid

    sql_statement = (f"""
        -- Retrieve team(s)
        SELECT
            json_agg(row_to_json(teams)) AS teams
        FROM
            (
                SELECT
                    e1.team_uuid AS team_uuid,
                    e1.event_uuid AS event_uuid,
                    e1.team_details AS team_details,
                    e1.team_status_name AS team_status_name,
                    e3.team_total_score AS team_total_score,
                    bank.balance_value AS bank_balance,
                    e1.team_member_roles AS team_member_roles,
                    e4.team_members AS team_members,
                    e2.team_external_links AS team_external_links,
                    e5.cloud_account AS cloud_account,
                    e6.entity_asset_uuid AS banner_image_uuid,
                    e7.entity_asset_uuid AS avatar_image_uuid
                    {codecommit_query_1}
                FROM
                    (
                        SELECT
                            t.team_uuid,
                            t.event_uuid,
                            t.team_details,
                            ts.team_status_name,
                            (
                                SELECT
                                    json_agg(row_to_json(x))
                                FROM
                                    (
                                        SELECT
                                            team_member_role_id,
                                            team_member_role_name
                                        FROM
                                            sr.team_member_role
                                    ) AS x
                                ) AS team_member_roles
                        FROM
                            sr.team AS t
                        LEFT JOIN sr.team_status ts ON
                            t.team_status_id = ts.team_status_id
                        {where_clause}
                        ORDER BY
                            t.team_status_id
                    ) AS e1
                LEFT JOIN LATERAL (
                        SELECT
                            json_agg(row_to_json(a)) AS team_external_links
                        FROM
                            (
                                SELECT
                                    tel.team_external_link_uuid,
                                    tel.team_private,
                                    elt.external_link_type_name,
                                    tel.team_external_link_name,
                                    tel.team_external_link_url
                                FROM
                                    sr.team_external_link AS tel
                                LEFT JOIN sr.external_link_type elt ON
                                    elt.external_link_type_id = tel.external_link_type_id
                                WHERE
                                    tel.team_uuid = e1.team_uuid
                                    {private_links_clause}
                                ORDER BY
                                    tel.ts_created
                            ) AS a
                    ) AS e2 ON
                    TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        COALESCE(SUM(jc.criterion_weight * tsi.team_score_item_value),0) AS team_total_score
                    FROM
                        sr.team_score_item AS tsi
                    LEFT JOIN sr.judging_criterion AS jc ON
                        jc.judging_criterion_uuid = tsi.judging_criterion_uuid
                    WHERE
                        tsi.team_uuid = e1.team_uuid
                ) AS e3 ON
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        json_agg(row_to_json(b)) AS team_members
                    FROM
                        (
                            SELECT
                                tm.team_member_uuid,
                                tm.participant_uuid
                            FROM
                                sr.team_member AS tm
                            WHERE
                                tm.team_uuid = e1.team_uuid
                        ) AS a
                        LEFT JOIN LATERAL (
                            SELECT
                                a.team_member_uuid,
                                p.user_uuid
                            FROM
                                sr.participant AS p
                            WHERE
                                p.participant_uuid = a.participant_uuid
                        ) AS b ON
                        TRUE
                ) AS e4 ON
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        row_to_json(c) AS cloud_account
                    FROM
                        (
                            SELECT
                                cloud_account_uuid,
                                cloud_account_name
                            FROM
                                sr.cloud_account
                            WHERE
                                cloud_account_owner_uuid = e1.team_uuid AND
                                cloud_account_status_id = 4
                        ) AS c
                ) AS e5 ON
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(e1.team_uuid) AS balance_value
                ) AS bank ON
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        entity_asset_uuid
                    FROM
                        sr.entity_asset
                    WHERE
                        entity_uuid = e1.team_uuid
                        AND entity_asset_type_id = (
                            SELECT
                                entity_asset_type_id
                            FROM
                                sr.entity_asset_type
                            WHERE
                                entity_asset_type_name = 'banner_image'
                        )
                    ORDER BY
                        ts_modified DESC
                    LIMIT 1
                ) AS e6 ON
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        entity_asset_uuid
                    FROM
                        sr.entity_asset
                    WHERE
                        entity_uuid = e1.team_uuid
                        AND entity_asset_type_id = (
                            SELECT
                                entity_asset_type_id
                            FROM
                                sr.entity_asset_type
                            WHERE
                                entity_asset_type_name = 'avatar_image'
                        )
                    ORDER BY
                        ts_modified DESC
                    LIMIT 1
                ) AS e7 ON
                TRUE
                {codecommit_query_2}
            ) AS teams;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team', hashed_query)
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
            cache_query_response('team', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

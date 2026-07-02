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

    organization_uuid = None

    if 'x-sr-organization-uuid' in event['headers']:
        organization_uuid = event['headers']['x-sr-organization-uuid']
    elif 'queryStringParameters' in event and 'organization_uuid' in event['queryStringParameters']:
        organization_uuid = event['queryStringParameters']['organization_uuid']

    grants = get_user_grants(get_user_uuid(event),get_organization_uuid(event)) +  get_be_auth0_scope(event)

    where_clause = ''
    sql_parameters = []

    # Check if requester's grant permits either:
    #   - Able to read all Organizations (platform_read)
    #   - Is a User in the Organization
    authorized = (
        'platform_read' in grants,
        get_organization_uuid(event) == organization_uuid
    )
    if not any(authorized):
        return return_error(401, "Not authorized")

    if organization_uuid:
        where_clause = 'WHERE o.organization_uuid = %(organization_uuid)s::UUID'
        sql_parameters = {'organization_uuid': organization_uuid}

    sql_statement = (f"""
        --- Retrieve Organization(s)
        SELECT
            json_agg(row_to_json(organizations))
        FROM
            (
                SELECT
                    o.organization_uuid,
                    o.organization_name,
                    o.organization_domain,
                    o.organization_logo_image,
                    o.primary_contact_email,
                    o.street_address_1,
                    o.street_address_2,
                    o.city,
                    o.state_region,
                    o.postal_code,
                    o.phone,
                    os.organization_status_name AS organization_status,
                    mpe.entitlements AS amazon_marketplace_entitlements,
                    bank.balance_value AS bank_balance,
                    (
                        SELECT
                            json_agg(row_to_json(x))
                        FROM
                            (
                                SELECT
                                    user_role_id,
                                    user_role_name
                                FROM
                                    sr.user_role
                            ) x
                    ) AS user_roles
                FROM
                    sr.organization AS o
                LEFT JOIN sr.organization_status os ON 
                    o.organization_status_id = os.organization_status_id
                LEFT JOIN LATERAL (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(o.organization_uuid) AS balance_value
                ) AS bank ON
                TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        json_agg(row_to_json(x)) AS entitlements
                    FROM
                        (
                            SELECT
                                entitlement_uuid
                            FROM
                                sr.amazon_marketplace_entitlement AS mpe
                            WHERE
                                mpe.organization_uuid = o.organization_uuid AND
                                mpe.entitlement_value > 0 AND
                                mpe.entitlement_value_used = mpe.entitlement_value AND
                                mpe.entitlement_expiration_date > NOW()
                        ) x
                ) AS mpe ON
                TRUE
                {where_clause}
                ORDER BY
                    o.organization_status_id,
                    o.organization_name
            ) organizations;
    """)
    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('organization', hashed_query)
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
            cache_query_response('organization', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': payload
    }

import hashlib
import json
import logging
from pydash import get
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    claim_invitation
        Claim the received Organization invitation to a User
'''
def claim_invitation(invitation):
    log.info(":: claim_invitation")

    invitation_code = invitation['invitation_code']
    claiming_user_uuid = invitation['claiming_user_uuid']

    status_code = 200

    log.info(f":: Processing Organization invitation code {invitation_code} for User {claiming_user_uuid}")

    invitation_details = get_invitation_details(invitation_code)
    if not invitation_details:
        status_code = 401
        response_payload = {
            'status_code': status_code,
            'error': 'No valid invitation found'
        }
    else:
        organization_uuid = invitation_details['organization_uuid']
        organization_invitation_uuid = invitation_details['organization_invitation_uuid']
        log.info(f":: organization_uuid: {organization_uuid}")

        try:
            add_user_to_organization(organization_uuid, claiming_user_uuid)
            try:
                set_user_role(claiming_user_uuid, organization_uuid)
                status_code = 200
                response_payload = {
                    'status_code': status_code,
                    'organization_invitation_uuid': organization_invitation_uuid
                }
            except Exception as error:
                raise error
        except Exception as error:
            log.error(f'>> claim_invitation: {error}')
            status_code = 500
            response_payload = {
                'status_code': status_code,
                'error': error
            }

        try:
            update_invitation_details(organization_invitation_uuid, organization_uuid, 4)
        except Exception as error:
            log.error(f'>> claim_invitation: {error}')
            status_code = 500
            response_payload = {
                'status_code': status_code,
                'error': error
            }

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(response_payload)
    }

'''
    get_invitation_details
        Return details of Organization invitation if unclaimed and unexpired.
'''
def get_invitation_details(invitation_code):
    log.info(":: get_invitation_details")

    sql_statement = ("""
        -- Get Organization invitation details
        SELECT
            row_to_json(r)
        FROM 
            (
                SELECT 
                    oi.organization_invitation_uuid, 
                    oi.organization_uuid,
                    oi.organization_invitation_status_id, 
                    oi.ts_claimed, 
                    oi.ts_expires
                FROM
                    sr.organization_invitation AS oi,
                    sr.organization AS o
                WHERE
                    oi.invitation_code = %(invitation_code)s
                    AND oi.organization_uuid = o.organization_uuid
                    AND oi.ts_claimed IS NULL
                    AND oi.organization_invitation_status_id NOT IN (
                        4, 5, 6, 7
                    )
                    AND (
                        oi.ts_expires IS NULL
                        OR oi.ts_expires > NOW()
                    )
            ) AS r;
    """)
    sql_parameters = {'invitation_code': invitation_code}

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('organization_invitation', hashed_query)
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
            log.error(f">> get_invitation_details: {error}")
            return None

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        try:
            cache_query_response('organization_invitation', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return json.loads(payload)

'''
    add_user_to_organization
        Add User to Organization attached to invitation.
'''
def add_user_to_organization(organization_uuid, claiming_user_uuid):
    log.info(":: add_user_to_organization")

    sql_statement = ("""
        -- Add User to Organization
        UPDATE
            sr.user
        SET 
            organization_uuid = %(organization_uuid)s::UUID, 
            ts_modified = NOW()
        WHERE
            user_uuid = %(claiming_user_uuid)s::UUID;
    """)
    sql_parameters = {
        'organization_uuid': organization_uuid,
        'claiming_user_uuid': claiming_user_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> assign_cloud_account: {error}")
        raise error

    try:
        incr_key_prefix('user')
    except:
        log.error('>> incr_key_prefix')

'''
    update_invitation_details
        Update Organization invitation details.
'''
def update_invitation_details(organization_invitation_uuid, claiming_user_uuid, organization_invitation_status_id=4):
    log.info(":: update_invitation_details")

    ts_claimed = ''
    if organization_invitation_status_id == 4:
        ts_claimed = "ts_claimed = NOW(),"

    sql_statement = (f"""
        -- Update invitation details
        UPDATE
            sr.organization_invitation
        SET 
            organization_invitation_status_id = %(organization_invitation_status_id)s, 
            claiming_user_uuid = %(claiming_user_uuid)s::UUID, 
            {ts_claimed}
            ts_modified = NOW()
        WHERE
            organization_invitation_uuid = %(organization_invitation_uuid)s::UUID;
    """)
    sql_parameters = {
        'organization_invitation_uuid': organization_invitation_uuid,
        'organization_invitation_status_id': organization_invitation_status_id,
        'claiming_user_uuid': claiming_user_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> update_invitation_details: {error}")
        raise error

    try:
        incr_key_prefix('organization_invitation')
    except:
        log.error('>> incr_key_prefix')

'''
    set_user_role
        Set the role for the User.
'''
def set_user_role(claiming_user_uuid, organization_uuid, user_role_id=1):
    log.info(":: set_user_role")

    user_role_member_uuid = uuid.uuid4()

    sql_statement = ("""
        -- Set User role
        INSERT
            INTO
            sr.user_role_member (
                user_role_member_uuid,
                user_uuid,
                organization_uuid,
                user_role_id,
                ts_modified
            )
        VALUES (
            %(user_role_member_uuid)s::UUID,
            %(claiming_user_uuid)s::UUID,
            %(organization_uuid)s::UUID,
            %(user_role_id)s,
            NOW()
        );
    """)
    sql_parameters = {
        'user_role_member_uuid': user_role_member_uuid,
        'claiming_user_uuid': claiming_user_uuid,
        'organization_uuid': organization_uuid,
        'user_role_id': user_role_id
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> set_user_role: {error}")
        raise error

    try:
        incr_key_prefix('user')
        incr_key_prefix('user_role_member')
    except:
        log.error('>> incr_key_prefix')

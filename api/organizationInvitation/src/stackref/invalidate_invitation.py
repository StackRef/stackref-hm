import json
import logging

import stackref.settings as settings
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    invalidate_invitation
        Invalidate the received Organization invitation.
'''
def invalidate_invitation(invitation):
    log.info(":: invalidate_invitation")

    organization_invitation_uuid = invitation['organization_invitation_uuid']
    organization_uuid = invitation['organization_uuid']

    log.info(f":: Invalidating Organization invitation {organization_invitation_uuid} for Organization {organization_uuid}")

    try:
        update_invitation_details(organization_invitation_uuid, organization_uuid, 7)
        status_code = 200
        response_payload = {
            'status_code': status_code,
            'organization_invitation_uuid': organization_invitation_uuid
        }
    except BaseException as error:
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
    update_invitation_details
        Update Organization invitation details.
'''
def update_invitation_details(organization_invitation_uuid, organization_uuid, organization_invitation_status_id=7):
    log.info(":: update_invitation_details")

    sql_statement = ("""
        -- Update invitation details
        UPDATE
            sr.organization_invitation
        SET 
            organization_invitation_status_id = %(organization_invitation_status_id)s,
            ts_modified = NOW()
        WHERE
            organization_invitation_uuid = %(organization_invitation_uuid)s::UUID
            AND organization_uuid = %(organization_uuid)s::UUID;
    """)
    sql_parameters = {
        'organization_invitation_uuid': organization_invitation_uuid,
        'organization_invitation_status_id': organization_invitation_status_id,
        'organization_uuid': organization_uuid
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

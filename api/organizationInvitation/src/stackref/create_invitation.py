import json
import logging
from pydash import get
import re
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.tator_notify import tator_notify
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    validate_email
        Check that the email address is at least formatted correctly.
'''
def validate_email(email):
    log.info(":: validate_email")
    regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'

    if(re.fullmatch(regex, email)):
        return True
    else:
        return False

'''
    validate_organization
        Returns True for an valid Organization with valid status
'''
def validate_organization(organization_uuid):
    log.info(":: validate_organization")
    sql_statement = ("""
        -- Check Organization status
        SELECT
            COUNT(*)
        FROM
            sr.organization
        WHERE
            organization_uuid = %(organization_uuid)s::UUID
            AND organization_status_id IN(1, 4);
    """)
    sql_parameters = {'organization_uuid': organization_uuid}

    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> validate_organization: {error}")
        return False

    if response and response[0]:
        if response[0] == 1:
            return True
        else:
            return False
    else:
        return False

'''
    create_invitation
        Create an invitation as requested by Organization admin and return its value.
'''
def create_invitation(invitation):
    log.info(":: create_invitation")

    creator_user_uuid = invitation['creator_user_uuid']
    organization_uuid = invitation['organization_uuid']
    invitation_email = invitation['invitation_email']

    if not validate_organization(organization_uuid):
        log.error(f'>> {organization_uuid} is not a valid Organization')
        return return_error(500, 'create_invitation')
    if not validate_email(invitation_email):
        log.error(f'>> {validate_email} is not a valid email address')
        return return_error(500, 'create_invitation')

    organization_invitation_uuid = str(uuid.uuid4())
    # Create a random invitation_code
    invitation_code = uuid.uuid4().hex.upper()[0:10]

    log.info(f":: Creating invitation {organization_invitation_uuid} invitation_code {invitation_code} for {invitation_email} to Organization {organization_uuid} by User {creator_user_uuid}")

    sql_statement = ("""
        -- Create Organization invitation
        WITH r AS
        (
            INSERT
                INTO
                sr.organization_invitation (
                    organization_invitation_uuid, 
                    organization_uuid, 
                    invitation_code,
                    invitation_email,
                    creator_user_uuid,
                    ts_expires
                )
            VALUES (
                %(organization_invitation_uuid)s::UUID, 
                %(organization_uuid)s::UUID, 
                %(invitation_code)s,
                %(invitation_email)s, 
                %(creator_user_uuid)s::UUID, 
                NOW() + INTERVAL '1 week'
            )
            RETURNING
                organization_invitation_uuid,
                ts_expires
        )
        SELECT ROW_TO_JSON(r) 
            FROM r;
    """)
    sql_parameters = {
        'organization_invitation_uuid': organization_invitation_uuid,
        'organization_uuid': organization_uuid,
        'invitation_code': invitation_code,
        'invitation_email': invitation_email,
        'creator_user_uuid': creator_user_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> create_invitation: {error}")
        return return_error(503, error)

    if response and response[0]:
        invitation_details = response[0]
        ts_expires = invitation_details['ts_expires']
        status_code = 200
    else:
        return return_error(204, 'no data')


    # Send Tator commands to update UI
    try:
        tator_message = {
            "command": "initializeOrgInvitations",
            "type": "command"
        }
        tator_notify(tator_message, organization_uuid)
    except Exception as error:
        log.error(f'>> create_invitation: {error}')

    response_payload = {
        'status_code': status_code,
        'invitation': {
            'organization_invitation_uuid': organization_invitation_uuid,
            'invitation_code': invitation_code,
            'organization_uuid': organization_uuid,
            'invitation_email': invitation_email,
            'organization_invitation_status_name': 'Ready',
            'ts_expires': ts_expires
        }
    }

    try:
        incr_key_prefix('organization_invitation')
    except:
        log.error('>> incr_key_prefix')

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(response_payload)
    }

import boto3
import botocore.exceptions
import hashlib
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    send_invitation_email
        Email the created invitation to the email address assigned to it.
'''
def send_invitation_email(environment, organization_invitation_uuid, invitation_email, invitation_code, organization_uuid):
    if get_invitation_send_count(organization_invitation_uuid) > settings.max_invitation_send_count:
        raise Exception("Invite resend count exceeded")

    ses_client = boto3.client('ses')

    organization_name = get_organization_name(organization_uuid)
    organization_domain = get_organization_domain(organization_uuid)
    if not organization_name:
        organization_name = 'UNDEFINED'

    try:
        response = ses_client.send_templated_email(
            Source='StackRef <invitations@bounce.example.com>',
            Destination={
                'ToAddresses': [invitation_email],
                'BccAddresses': ['invitations@example.com']
            },
            ReplyToAddresses=[
                'invitations@example.com',
            ],
            Template='OrganizationInvitation',
            TemplateData=f"""{{
                "invitation_code":"{invitation_code}",
                "organization_name":"{organization_name}",
                "organization_domain":"{organization_domain}",
                "environment":"{environment}"
            }}"""
        )
        log.info(f':: ses_response: {response}')
    except TypeError as error:
        log.error(f">> send_invitation_email TypeError: {error}")
        raise
    except botocore.exceptions.ClientError as error:
        log.error(f">> send_invitation_email ClientError: {error}")
        raise
    except Exception as error:
        log.error(f">> send_invitation_email {type(error)} Error: {error}")
        raise

    try:
        increment_invitation_send_count(organization_invitation_uuid)
    except Exception as error:
        raise

    return

'''
    get_organization_name
        Retrieve organization_name from organization_uuid
'''
def get_organization_name(organization_uuid):
    log.info(":: get_organization_name")

    sql_statement = (""" 
        SELECT
            organization_name
        FROM
            sr.organization
        WHERE
            organization_uuid = %(organization_uuid)s::UUID;
    """)
    sql_parameters = {'organization_uuid': organization_uuid}

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
            log.error(f">> assign_cloud_account: {error}")
            return None

        if response and response[0]:
            payload = response[0]
        else:
            return None

        try:
            cache_query_response('organization', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return payload

'''
    get_organization_domain
        Retrieve organization_domain from organization_uuid
'''
def get_organization_domain(organization_uuid):
    log.info(":: get_organization_domain")

    sql_statement = (""" 
        SELECT
            organization_domain
        FROM
            sr.organization
        WHERE
            organization_uuid = %(organization_uuid)s::UUID;
    """)
    sql_parameters = {'organization_uuid': organization_uuid}

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
            log.error(f">> get_organization_domain: {error}")
            return None

        if response and response[0]:
            payload = response[0]
        else:
            return None

        try:
            cache_query_response('organization', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return payload

'''
    increment_invitation_send_count
        Update Organization invitation send count
'''
def increment_invitation_send_count(organization_invitation_uuid):
    log.info(":: increment_invitation_send_count")

    sql_statement = ("""
        -- Increment invitation send count
        UPDATE
            sr.organization_invitation
        SET 
            send_count = send_count + 1,
            ts_modified = NOW()
        WHERE
            organization_invitation_uuid = %(organization_invitation_uuid)s::UUID;
    """)
    sql_parameters = {'organization_invitation_uuid': organization_invitation_uuid}

    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> increment_invitation_send_count: {error}")
        raise error

    try:
        incr_key_prefix('organization_invitation')
    except:
        log.error('>> incr_key_prefix')

    return

'''
    get_invitation_send_count
        Retrieve the send_count of the organization_invitation
'''
def get_invitation_send_count(organization_invitation_uuid):
    log.info(":: get_invitation_send_count")

    sql_statement = (""" 
        SELECT
            send_count
        FROM
            sr.organization_invitation
        WHERE
            organization_invitation_uuid = %(organization_invitation_uuid)s::UUID;
    """)
    sql_parameters = {'organization_invitation_uuid': organization_invitation_uuid}

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
            log.error(f">> get_invitation_send_count: {error}")
            return None

        if response and response[0]:
            payload = response[0]
        else:
            return 0

        try:
            cache_query_response('organization_invitation', hashed_query, payload)
        except:
            log.error(f">> cache_query_response")

    return payload

import json
import logging
import uuid

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import incr_key_prefix
from stackref.coin_bank_transaction import coin_bank_transaction

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_organization
        Create an Organization and return its UUID
'''
def create_organization(payload_json):
    log.info(":: create_organization")

    organization_uuid = uuid.uuid4()

    user_uuid = str(payload_json['user_uuid'])
    organization_name = str(payload_json['organization']['organization_name'])
    organization_domain = str(payload_json['organization']['organization_domain'])
    primary_contact_email = str(payload_json['organization']['primary_contact_email'])
    street_address_1 = str(payload_json['organization']['street_address_1'])
    street_address_2 = str(payload_json['organization']['street_address_2'])
    city = str(payload_json['organization']['city'])
    state_region = str(payload_json['organization']['state_region'])
    postal_code = str(payload_json['organization']['postal_code'])
    phone = str(payload_json['organization']['phone'])

    sql_statement = ("""
        -- Create a new Organization
        INSERT
            INTO
            sr.organization (
                organization_uuid,
                organization_name,
                organization_domain,
                primary_contact_email,
                street_address_1,
                street_address_2,
                city,
                state_region,
                postal_code,
                phone
            )
        VALUES (
            %(organization_uuid)s::UUID,
            %(organization_name)s,
            %(organization_domain)s,
            %(primary_contact_email)s,
            %(street_address_1)s,
            %(street_address_2)s,
            %(city)s,
            %(state_region)s,
            %(postal_code)s,
            %(phone)s
        );
    """)
    sql_parameters = {
        'organization_uuid': organization_uuid,
        'organization_name': organization_name,
        'organization_domain': organization_domain,
        'primary_contact_email': primary_contact_email,
        'street_address_1': street_address_1,
        'street_address_2': street_address_2,
        'city': city,
        'state_region': state_region,
        'postal_code': postal_code,
        'phone': phone
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_organization: {error}")
        return return_error(503, error) 

    try:
        add_user_to_organization(organization_uuid, user_uuid)
    except Exception as error:
        # TODO: Do we roll back Organization creation success if User addition failed?
        return return_error(500, error)

    try:
        set_organization_owner(organization_uuid, user_uuid)
    except Exception as error:
        # TODO: Do we roll back Organization creation success if User role set failed?
        log.error(f'>> create_organization: {error}')
        return return_error(500, error)

    # Uncomment if we want to give every organization 100 StackCash on creation
    '''
    try:
        coin_bank_transaction(organization_uuid, 100)
    except Exception as error:
        log.error(f'>> create_organization: {error}')
    '''

    try:
        incr_key_prefix('organization')
        incr_key_prefix('user')
        incr_key_prefix('user_role_member')
    except:
        log.error('>> incr_key_prefix')

    response_payload = {
        'status_code': 200,
        'organization_uuid': str(organization_uuid)
    }
    response_body = json.dumps(response_payload)

    log.info(response_body)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

'''
    add_user_to_organization
        Add user to organization they created
'''
def add_user_to_organization(organization_uuid, user_uuid):
    log.info(":: add_user_to_organization")

    sql_statement = ("""
        -- Add Organization creator User to Organization
        UPDATE
            sr.user
        SET 
            organization_uuid = %(organization_uuid)s::UUID, 
            ts_modified = NOW()
        WHERE
            user_uuid = %(user_uuid)s::UUID;
    """)
    sql_parameters = {
        'organization_uuid': organization_uuid,
        'user_uuid': user_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> add_user_to_organization: {error}")
        raise error

'''
    set_organization_owner
        Set the newly-created Organization owner to the one who created it
'''
def set_organization_owner(organization_uuid, user_uuid):
    log.info(":: set_organization_owner")

    user_role_member_uuid = uuid.uuid4()

    sql_statement = ("""
        -- Set Organization creator User as Organization owner
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
            %(user_uuid)s::UUID,
            %(organization_uuid)s::UUID,
            (
                SELECT
                    user_role_id
                FROM
                    sr.user_role
                WHERE
                    user_role_name = 'Owner'
            ), 
            NOW()
        );
    """)
    sql_parameters = {
        'user_role_member_uuid': user_role_member_uuid,
        'user_uuid': user_uuid,
        'organization_uuid': organization_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> set_organization_owner: {error}")
        raise error

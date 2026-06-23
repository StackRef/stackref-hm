import json
import logging

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.settings import return_error
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    update_organization
        Update an Organization and return organization_uuid and status
'''
def update_organization(payload_json):
    log.info(":: update_organization")

    organization_uuid = str(payload_json['organization']['organization_uuid'])
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
        -- Update the Organization
        UPDATE
            sr.organization
        SET
            organization_name = %(organization_name)s,
            organization_domain = %(organization_domain)s,
            primary_contact_email = %(primary_contact_email)s,
            street_address_1 = %(street_address_1)s,
            street_address_2 = %(street_address_2)s,
            city = %(city)s,
            state_region = %(state_region)s,
            postal_code = %(postal_code)s,
            phone = %(phone)s,
            ts_modified = NOW()
        WHERE
            organization_uuid = %(organization_uuid)s::UUID;
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
        log.error(f">> update_organization: {error}")
        return return_error(503, error) 

    try:
        incr_key_prefix('organization')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        tator_message = {
            "command": "initializeOrganization",
            "type": "command"
        }
        tator_notify(tator_message, organization_uuid)
    except Exception as error:
        log.error(f'>> update_organization: {error}')

    response_payload = {
        'status_code': 200,
        'organization_uuid': organization_uuid
    }
    response_body = json.dumps(response_payload)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': response_body
    }

import boto3
import csv
import io
import logging
import openpyxl
import re
import uuid

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.grant_functions import *
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_invitation_file
        Process the incoming invitation file
'''
def process_invitation_file(s3_info):
    log.info(":: process_invitation_file")

    bucket_name = s3_info['bucket']['name']
    filename = s3_info['object']['key']

    path_parts = filename.split('/')

    entity_uuid = path_parts[1]

    if not is_valid_organization(entity_uuid):
        log.error(f">> Invalid Organization UUID: {entity_uuid}")
        return

    try:
        s3 = boto3.client('s3')
        response = s3.get_object(Bucket=bucket_name, Key=filename)
        file_content = response['Body'].read()
        content_type = response['ContentType']
    except Exception as error:
        log.error(f'>> process_invitation_file: {error}')
        raise

    creator_user_uuid = '00000000-0000-0000-0000-000000000000'
    original_filename = ''

    try:
        response = s3.get_object_tagging(
            Bucket=bucket_name,
            Key=filename
        )
        tags = response['TagSet']

        for tag in tags:
            if tag['Key'] == 'creator_user_uuid':
                creator_user_uuid = tag['Value']
                log.info(f':: creator_user_uuid: {creator_user_uuid}')
            if tag['Key'] == 'original_filename':
                original_filename = tag['Value']
                log.info(f':: original_filename: {original_filename}')
    except Exception as error:
        log.error(f'>> process_invitation_file: {error}')

    grants = get_user_grants(creator_user_uuid, entity_uuid)

    if 'invitation_write' not in grants:
        log.error(f">> User {creator_user_uuid} does not have write access to Organization {entity_uuid}")
        return

    email_addresses = []
    log.info(f':: Processing {content_type} file')

    # Process the file based on its type:
    # For Excel (.xlsx) files:
    if content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        file_stream = io.BytesIO(file_content)
        workbook = openpyxl.load_workbook(file_stream, read_only=True, data_only=True)
        sheet = workbook.active
        for row in sheet.iter_rows(values_only=True):
            for value in row:
                email_matches = re.findall(r'[\w.-]+@[\w.-]+', str(value))
                email_addresses.extend(email_matches)

    # For CSV and TSV files:
    elif content_type in ('text/csv', 'text/tab-separated-values'):
        file_stream = io.StringIO(file_content.decode('utf-8'))
        reader = csv.reader(file_stream, delimiter=',' if content_type == 'text/csv' else '\t')
        for row in reader:
            for item in row:
                email_matches = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', item)
                email_addresses.extend(email_matches)

    log.debug(f':: email_addresses: {email_addresses}')

    email_addresses = list(set(email_addresses)) # Remove duplicates

    if len(email_addresses) == 0 or len(email_addresses) > settings.max_emails_per_file:
        try:
            original_filename_str = f"'{original_filename}'" if original_filename != '' else ''
            address_str = "address" if len(email_addresses) == 1 else "addresses"

            message = {
                'title': 'Invitation File Not Processed',
                'description': f"Unable to process invitation file {original_filename_str} with {len(email_addresses)} email {address_str}.",
                'status': 'error',
                'type': 'invitation_file'
            }

            tator_notify(message, creator_user_uuid)
        except Exception as error:
            log.error(f'>> process_invitation_file: {error}')

        return

    for email_address in email_addresses:
        try:
            if validate_email(email_address):
                add_to_sqs_queue(creator_user_uuid, entity_uuid, email_address)
            else:
                log.info(f':: Invalid email address: {email_address}')
        except Exception as error:
            log.error(f'>> process_invitation_file: {error}')
            continue

    try:
        original_filename_str = f"'{original_filename}'" if original_filename != '' else ''
        address_str = "address" if len(email_addresses) == 1 else "addresses"

        message = {
            'title': 'Invitation File Processed',
            'description': f"Processed invitation file {original_filename_str} with {len(email_addresses)} email {address_str}.",
            'status': 'success',
            'type': 'invitation_file'
        }

        tator_notify(message, creator_user_uuid)
    except Exception as error:
        log.error(f'>> process_invitation_file: {error}')

'''
    add_to_sqs_queue
        Add invitation email to SQS queue for processing
'''
def add_to_sqs_queue(creator_user_uuid, organization_uuid, email_address):
    log.info(':: add_to_sqs_queue')

    log.info(f':: Adding {email_address} to organization_uuid {organization_uuid} SQS queue')

    message = {
        'creator_user_uuid': creator_user_uuid,
        'organization_uuid': organization_uuid,
        'email_address': email_address
    }

    try:
        sqs = boto3.client('sqs')
        response = sqs.send_message(
            QueueUrl = settings.org_invitations_sqs_url,
            MessageBody = json.dumps(message)
        )
    except Exception as error:
        log.error(f'>> add_to_sqs_queue: {error}')
        raise error

'''
    is_valid_organization
        Return True if organization_uuid is valid and active
'''
def is_valid_organization(organization_uuid):
    try:
        uuid.UUID(organization_uuid)
    except ValueError as error:
        return False

    sql_statement = ("""
    -- Check if Organization exists and is active
    SELECT
        1
    FROM
        sr.organization
    WHERE
        organization_uuid = %(organization_uuid)s::UUID AND
        organization_status_id NOT IN (
            SELECT
                organization_status_id
            FROM
                sr.organization_status
            WHERE
                organization_status_name IN ('Hold', 'Inactive', 'Archived')
        );
    """)
    log.debug(sql_statement)

    sql_parameters = {'organization_uuid': organization_uuid}

    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
                response = cur.fetchone()
                log.debug(f":: response: {response}")
    except Exception as error:
        log.error(f">> is_valid_organization: {error}")
        raise

    if response and response[0] and response[0] == 1:
        return True
    else:
        return False

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

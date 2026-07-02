import boto3
import botocore.exceptions
import hashlib
import json
import logging
from pydash import get
import re
import requests

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    find_user
        Return true/false if the AWS user already exists
'''
def find_user(email_address):
    log.info(':: find_user')

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.aws_scim_api_token}"
    }

    try:
        response = requests.get(f"{settings.aws_scim_api_url}/Users?filter='userName eq \"{email_address}\"'", headers=headers)
        log.debug(response)
        response_json = json.loads(response.content)
    except Exception as error:
        raise error

    if (not 'Resources' in response_json) or (len(response_json['Resources']) == 0):
        log.info(f':: User {email_address} not found')
        # no user found for the query
        return None, False

    user = response_json['Resources'][0]

    return user['id'], user['active']

'''
    user_body
        Create JSON payload for the AWS user creation
'''
def user_body(user_details):
    log.info(':: user_body')

    user_uuid         = user_details['user_uuid']
    given_name        = user_details['first_name']
    family_name       = user_details['last_name']
    user_name         = user_details['email_address']
    email             = user_details['email_address']
    organization_uuid = user_details['organization_uuid']
    settings          = user_details['settings']
    #extra_attributes = payload['extra_attributes']

    timezone = 'America/New_York'

    if settings:
        if 'timezone' in settings:
            timezone = settings['timezone']

    display_name = f"{given_name} {family_name}"

    base_body = {
        'userName': user_name,
        'name': {
            'familyName': family_name,
            'givenName': given_name,
        },
        'displayName': display_name,
        'emails': [
            {
                'value': email,
                'type': 'work',
                'primary': True,
            },
        ],
        'active': True,
        'timezone': timezone,
        'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
            'employeeNumber': user_uuid,
            'organization': organization_uuid
        }
    }

    #return {**base_body, **extra_attributes}  # merge two dicts together
    return {**base_body}

'''
    create_cloud_user
        Create the Cloud Account User in AWS
'''
def create_cloud_user(cloud_account_group, user_details):
    log.info(':: create_cloud_user')

    log.debug(cloud_account_group)
    log.debug(user_details)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.aws_scim_api_token}"
    }

    body = {**user_body(user_details)}


    try:
        response = requests.post(
            f"{settings.aws_scim_api_url}/Users",
            headers=headers,
            json=body
        )
        response_json = response.json()
        log.debug(':: RESPONSE')
        log.debug(response)
    except Exception as error:
        log.error(f'>> create_cloud_user: {response.text}')
        raise error

    if response.status_code not in range(200, 300):
        log.error(f">> create_cloud_user: {response.text}")
        return None

    return response_json['id']

'''
    add_user_to_group
        Add the Cloud Account User to their assigned AWS group
'''
def add_user_to_group(cloud_account_group, user_id):
    log.info(':: add_user_to_group')

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.aws_scim_api_token}"
    }

    body = {
        "schemas":[
            "urn:ietf:params:scim:api:messages:2.0:PatchOp"
        ],
        "Operations": [
            {
                "op": "add",
                "path": "members",
                "value": [
                    {
                        "value": f"{user_id}"
                    }
                ]
            }
        ]
    }

    try:
        log.debug(f":: request: {settings.aws_scim_api_url}/Groups/{cloud_account_group['cloud_account_group_id']}")
        response = requests.patch(
            f"{settings.aws_scim_api_url}/Groups/{cloud_account_group['cloud_account_group_id']}",
            headers=headers,
            json=body
        )
    except BaseException as error: 
        log.error(f'>> add_user_to_group: {error}')
        raise error

    if response.status_code not in range(200, 300):
        log.error(f'>> add_user_to_group: {response.text}')
        raise Exception

    return True

'''
    aws_account_access
        Process the creation of a Cloud Account User in AWS
'''
def aws_account_access(cloud_account_group, user_details):
    log.info(':: aws_account_access')

    try:
        # Check if user already exists
        user_id, user_active = find_user(user_details['email_address'])
        log.debug(f':: user_id: {user_id}, user_active: {user_active}')

        if user_id is None:
            user_id = create_cloud_user(cloud_account_group, user_details)
            log.debug(f':: user_id: {user_id}')
        remove_deny_user_policy(cloud_account_group, user_details['user_uuid'])
        add_user_to_group(cloud_account_group, user_id)
    except Exception as error:
        log.error(f'>> aws_account_access: {error}')
        raise error

    return str(user_id)

'''
    remove_deny_user_policy
        Remove any inline policies to the Permission Set attached to the AWS User's group
        that might otherwise limit their access.
'''
def remove_deny_user_policy(cloud_account_group, user_uuid):
    log.info(':: remove_deny_user_policy')

    sso_client = boto3.client('sso-admin')

    # Policy Sid can only be alphanumerics
    policy_sid = str(re.sub(r'[^a-zA-Z0-9]+', '', user_uuid))

    try:
        cloud_account_cloud_id = get_aws_account_id(cloud_account_group['cloud_account_uuid'])
        permission_set = get_permission_set(cloud_account_cloud_id, cloud_account_group['cloud_account_group_name'])
    except Exception as error:
        log.error(f'>> remove_deny_user_policy: {error}')
        raise error

    # Get the current inline policy for the permission set
    try:
        response = sso_client.get_inline_policy_for_permission_set(
            InstanceArn = settings.sso_instance_arn,
            PermissionSetArn = permission_set
        )
    except Exception as error:
        log.error(f'>> remove_deny_user_policy (get_inline_policy_for_permission_set): {error}')
        raise error

    current_inline_policy = get(response, 'InlinePolicy')

    if current_inline_policy:
        current_inline_policy_json = json.loads(str(current_inline_policy))

        log.debug(f":: current_inline_policy (unmodified): {json.dumps(current_inline_policy_json)}")

        if 'Statement' in current_inline_policy_json:
            try:
                if len(current_inline_policy_json['Statement']) > 1:
                    for index, statement in enumerate(current_inline_policy_json['Statement']):
                        if 'Sid' in statement and str(statement['Sid']) == policy_sid:
                            log.debug(f":: Deleting existing statement: {statement['Sid']}")
                            del current_inline_policy_json['Statement'][index]
                elif len(current_inline_policy_json['Statement']) == 1 and 'Sid' in current_inline_policy_json['Statement'][0] and str(current_inline_policy_json['Statement'][0]['Sid']) == policy_sid:
                    current_inline_policy_json = {}
            except Exception as error:
                log.error(f'>> remove_deny_user_policy: {error}')
                raise error

            log.debug(f":: current_inline_policy (processed): {json.dumps(current_inline_policy_json)}")

            if not current_inline_policy_json:
                log.debug(':: Delete the inline policy')
                # Delete inline policy from the User's assigned permission set, since it was the only one
                try:
                    response = sso_client.delete_inline_policy_from_permission_set(
                        InstanceArn = settings.sso_instance_arn,
                        PermissionSetArn = permission_set
                    )
                except Exception as error:
                    log.error(f'>> remove_deny_user_policy (delete_inline_policy_from_permission_set): {error}')
                    raise error
            else:
                # Attach the update inline policy to the User's assigned permission set
                try:
                    response = sso_client.put_inline_policy_to_permission_set(
                        InstanceArn = settings.sso_instance_arn,
                        PermissionSetArn = permission_set,
                        InlinePolicy = json.dumps(current_inline_policy_json)
                    )
                except Exception as error:
                    log.error(f'>> remove_deny_user_policy (put_inline_policy_to_permission_set): {error}')
                    raise error

            # Push the update
            try:
                response = sso_client.update_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set
                )
            except Exception as error:
                log.error(f'>> remove_deny_user_policy: {error}')
                raise error

            # Now provision it to the account
            try:
                response = sso_client.provision_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set,
                    TargetId = cloud_account_cloud_id,
                    TargetType = 'AWS_ACCOUNT'
                )
            except Exception as error:
                log.error(f'>> remove_deny_user_policy: {error}')
                raise error
        else:
            log.info(f":: No current inline policy exists for cloud_account_group {cloud_account_group['cloud_account_group_name']}")
    else:
        log.info(f":: No current inline policy exists for cloud_account_group {cloud_account_group['cloud_account_group_name']}")

'''
    get_permission_set
        Return ARN of an AWS SSO Permission Set
'''
def get_permission_set(account_id, cloud_account_group_name):
    log.info(':: get_permission_set')

    sso_client = boto3.client('sso-admin')

    try:
        response = sso_client.list_permission_sets_provisioned_to_account(
            InstanceArn = settings.sso_instance_arn,
            AccountId = account_id,
            ProvisioningStatus = 'LATEST_PERMISSION_SET_PROVISIONED',
            MaxResults = 100
        )
    except Exception as error:
        log.error(f'>> get_permission_set: {error}')
        raise error

    permission_sets = get(response, 'PermissionSets')

    for permission_set in permission_sets:
        try:
            response = sso_client.describe_permission_set(
                InstanceArn = settings.sso_instance_arn,
                PermissionSetArn = permission_set
            )
        except Exception as error:
            log.error(f'>> get_permission_set: {error}')
            raise error

        permission_set_name = str(get(response, 'PermissionSet.Name'))
        if permission_set_name == cloud_account_group_name:
            permission_set_arn = permission_set
            log.debug(f':: permission_set_name: {permission_set_name}')
            log.debug(f':: permission_set_arn: {permission_set_arn}')

    if permission_set_arn:
        return permission_set_arn
    else:
        return None

'''
    get_aws_account_id
        Retrieve cloud_account_cloud_id from cloud_account_uuid
'''
def get_aws_account_id(cloud_account_uuid):
    log.info(f':: get_aws_account_id')
    log.debug(f':: get_aws_account_id: {cloud_account_uuid}')

    sql_statement = ("""
        -- Return cloud_account_cloud_id from cloud_account from cloud_account_uuid
        SELECT
            cloud_account_cloud_id
        FROM
            sr.cloud_account
        WHERE
            cloud_account_uuid = %(cloud_account_uuid)s::UUID;
    """)
    sql_parameters = {'cloud_account_uuid': cloud_account_uuid}

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('cloud_account', hashed_query)
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
            log.error(f">> get_aws_account_id: {error}")
            raise error

        if response and response[0]:
            payload = response[0]
        else:
            payload = ''

        cache_query_response('cloud_account', hashed_query, payload)

    if payload != '':
        return payload
    else:
        return None

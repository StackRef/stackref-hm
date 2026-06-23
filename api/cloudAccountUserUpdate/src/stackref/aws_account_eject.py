import boto3
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


def eject_user_from_groups(cloud_account_uuid, user_id):
    log.info(':: eject_user_from_groups')

    try:
        cloud_account_groups = get_cloud_account_groups(cloud_account_uuid)
    except Exception as error: 
        log.error(f'>> eject_user_from_group: {error}')
        raise error

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.aws_scim_api_token}"
    }

    for cloud_account_group in cloud_account_groups:
        log.info(f":: Processing cloud_account_group {cloud_account_group['cloud_account_group_name']}")
        log.debug(json.dumps(cloud_account_group))

        body = {
            "schemas":[
                "urn:ietf:params:scim:api:messages:2.0:PatchOp"
            ],
            "Operations": [
                {
                    "op": "remove",
                    "path": "members",
                    "value": [
                        {
                            "value": f"{user_id}"
                        }
                    ]
                }
            ]
        }

        log.debug(body)

        try:
            log.debug(f":: request: {settings.aws_scim_api_url}/Groups/{cloud_account_group['cloud_account_group_id']}")
            response = requests.patch(
                f"{settings.aws_scim_api_url}/Groups/{cloud_account_group['cloud_account_group_id']}",
                headers=headers,
                json=body
            )
        except Exception as error: 
            log.error(f'>> eject_user_from_groups: {error}')
            raise error

        if response.status_code not in range(200, 300):
            log.error(f'>> eject_user_from_groups: {response.text}')
            raise Exception

    return True

'''
'''
def aws_account_eject(user_details, cloud_account_uuid):
    log.info(':: aws_account_eject')

    # Add the inline policy for each cloud_account to Deny user access to resources
    try:
        add_deny_user_policy(cloud_account_uuid, user_details)
    except Exception as error:
        log.error(f'>> aws_account_eject: {error}')
        raise error

    try:
        user_id, user_active = find_user(user_details['email_address'])
        log.debug(f':: user_id: {user_id}, user_active: {user_active}')

        if user_id:
            eject_user_from_groups(cloud_account_uuid, user_id)
    except Exception as error:
        log.error(f'>> aws_account_eject: {error}')
        raise error

    return str(user_id)

'''
    get_cloud_account_groups
        Return cloud_account_group details from cloud_account_uuid
'''
def get_cloud_account_groups(cloud_account_uuid):
    log.info(':: get_cloud_account_groups')

    sql_statement = ("""
        -- Retrieve cloud account group(s)
        SELECT
            json_agg(row_to_json(cloud_account_groups))
        FROM
            (
                SELECT
                    cloud_account_uuid,
                    cloud_account_group_id,
                    cloud_account_group_name
                FROM
                    sr.cloud_account_group
                WHERE
                    cloud_account_uuid = %(cloud_account_uuid)s::UUID
            ) cloud_account_groups;
    """)
    sql_parameters = {'cloud_account_uuid': cloud_account_uuid}

    log.debug(sql_statement)

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('cloud_account_group', hashed_query)
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
            log.error(f">> get_cloud_account_groups: {error}")
            raise error

        if response and response[0]:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        cache_query_response('cloud_account_group', hashed_query, payload)

    return json.loads(payload)

'''
    get_aws_account_id
        Retrieve cloud_account_cloud_id from cloud_account_uuid
'''
def get_aws_account_id(cloud_account_uuid):
    log.info(':: get_aws_account_id')

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

'''
    add_deny_user_policy
        Add an explicit Deny policy to the Cloud Account User's previously-assigned
        group's Permission Set to quickly deny all access to all resources.
'''
def add_deny_user_policy(cloud_account_uuid, user_details):
    log.info(':: add_deny_user_policy')

    sso_client = boto3.client('sso-admin')

    # Policy Sid can only be alphanumerics
    policy_sid = re.sub(r'[^a-zA-Z0-9]+', '', user_details['user_uuid'])

    try:
        cloud_account_cloud_id = get_aws_account_id(cloud_account_uuid)
        cloud_account_groups = get_cloud_account_groups(cloud_account_uuid)
    except Exception as error:
        log.error(f'>> add_deny_user_policy: {error}')
        raise error

    if cloud_account_groups:
        for cloud_account_group in cloud_account_groups:
            log.debug(f":: Processing cloud_account_group {cloud_account_group['cloud_account_group_name']}")

            permission_set = get_permission_set(cloud_account_cloud_id, cloud_account_group['cloud_account_group_name'])

            new_inline_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": policy_sid,
                        "Effect": "Deny",
                        "Action": ["*"],
                        "Resource": ["*"],
                        "Condition": {
                            "StringLike": {
                                "aws:userid": f"*:{user_details['email_address']}"
                            }
                        }
                    }
                ]
            }

            # Get the current inline policy for the permission set
            try:
                response = sso_client.get_inline_policy_for_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set
                )
            except Exception as error:
                log.error(f'>> add_deny_user_policy: {error}')
                raise error

            current_inline_policy = get(response, 'InlinePolicy')

            # Merge the current_inline_policy with new_inline_policy
            if current_inline_policy:
                current_inline_policy_json = json.loads(str(current_inline_policy))

                for statement in current_inline_policy_json['Statement']:
                    if str(statement['Sid']) != policy_sid:
                        log.debug(f":: Appending existing statement: {statement['Sid']}")
                        new_inline_policy['Statement'].append(statement)
                    else:
                        # sid already exists, so don't add it again
                        log.debug(':: Statement exists. Not appending.')

            # Attach an inline policy to the User's assigned permission set
            try:
                response = sso_client.put_inline_policy_to_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set,
                    InlinePolicy = json.dumps(new_inline_policy)
                )
            except Exception as error:
                log.error(f'>> add_deny_user_policy: {error}')
                raise error

            # Push the update
            try:
                response = sso_client.update_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set
                )
            except Exception as error:
                log.error(f'>> add_deny_user_policy: {error}')
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
                log.error(f'>> add_deny_user_policy: {error}')
                raise error

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

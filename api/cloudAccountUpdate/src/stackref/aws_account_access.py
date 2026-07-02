import boto3
import hashlib
import json
import logging
from pydash import get
import requests

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    add_deny_all_policy
        Add an explicit Deny policy to the Cloud Account group's
        Permission Set to quickly deny all access to all resources.
'''
def add_deny_all_policy(cloud_account_uuid):
    log.info(':: add_deny_all_policy')

    sso_client = boto3.client('sso-admin')

    try:
        cloud_account_cloud_id = get_aws_account_id(cloud_account_uuid)
        cloud_account_groups = get_cloud_account_groups(cloud_account_uuid)
    except Exception as error:
        log.error(f'>> add_deny_all_policy: {error}')
        raise error

    if cloud_account_groups:
        for cloud_account_group in cloud_account_groups:
            log.debug(f":: Processing cloud_account_group {cloud_account_group['cloud_account_group_name']}")

            permission_set = get_permission_set(cloud_account_cloud_id, cloud_account_group['cloud_account_group_name'])

            new_inline_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "UnassignedDenyAll",
                        "Effect": "Deny",
                        "Action": ["*"],
                        "Resource": ["*"],
                        "Condition": {
                            "StringNotLike": {
                                "aws:userid": f"*:*@example.com"
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
                log.error(f'>> add_deny_all_policy: {error}')
                raise error

            current_inline_policy = get(response, 'InlinePolicy')

            # Merge the current_inline_policy with new_inline_policy
            if current_inline_policy:
                current_inline_policy_json = json.loads(str(current_inline_policy))

                for statement in current_inline_policy_json['Statement']:
                    if str(statement['Sid']) != 'UnassignedDenyAll':
                        log.debug(f":: Appending existing statement: {statement['Sid']}")
                        new_inline_policy['Statement'].append(statement)
                    else:
                        # sid already exists, so don't add it again
                        log.debug(':: Statement exists. Not appending.')

            # Attach an inline policy to the assigned permission set
            try:
                response = sso_client.put_inline_policy_to_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set,
                    InlinePolicy = json.dumps(new_inline_policy)
                )
            except Exception as error:
                log.error(f'>> add_deny_all_policy: {error}')
                raise error

            # Push the update
            try:
                response = sso_client.update_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set
                )
            except Exception as error:
                log.error(f'>> add_deny_all_policy: {error}')
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
                log.error(f'>> add_deny_all_policy: {error}')
                raise error

'''
    remove_deny_all_policy
        Remove the explicit Deny policy to the Cloud Account group's
        Permission Set so it can be used
'''
def remove_deny_all_policy(cloud_account_uuid):
    log.info(':: remove_deny_all_policy')

    sso_client = boto3.client('sso-admin')

    try:
        cloud_account_cloud_id = get_aws_account_id(cloud_account_uuid)
        cloud_account_groups = get_cloud_account_groups(cloud_account_uuid)
    except Exception as error:
        log.error(f'>> remove_deny_all_policy: {error}')
        raise error

    if cloud_account_groups:
        for cloud_account_group in cloud_account_groups:
            log.debug(f":: Processing cloud_account_group {cloud_account_group['cloud_account_group_name']}")

            permission_set = get_permission_set(cloud_account_cloud_id, cloud_account_group['cloud_account_group_name'])

            # Get the current inline policy for the permission set
            try:
                response = sso_client.get_inline_policy_for_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set
                )
            except Exception as error:
                log.error(f'>> remove_deny_all_policy: {error}')
                raise error

            current_inline_policy = get(response, 'InlinePolicy')
    if current_inline_policy:
        current_inline_policy_json = json.loads(str(current_inline_policy))

        log.debug(f":: current_inline_policy (unmodified): {json.dumps(current_inline_policy_json)}")

        if 'Statement' in current_inline_policy_json:
            try:
                if len(current_inline_policy_json['Statement']) > 1:
                    for index, statement in enumerate(current_inline_policy_json['Statement']):
                        if 'Sid' in statement and str(statement['Sid']) == 'UnassignedDenyAll':
                            log.debug(f":: Deleting existing statement: {statement['Sid']}")
                            del current_inline_policy_json['Statement'][index]
                elif len(current_inline_policy_json['Statement']) == 1 and 'Sid' in current_inline_policy_json['Statement'][0] and str(current_inline_policy_json['Statement'][0]['Sid']) == 'UnassignedDenyAll':
                    current_inline_policy_json = {}
            except Exception as error:
                log.error(f'>> remove_deny_all_policy: {error}')
                raise error

            log.debug(f":: current_inline_policy (processed): {json.dumps(current_inline_policy_json)}")

            if not current_inline_policy_json:
                log.debug(':: Delete the inline policy')
                # Delete inline policy from the permission set, since it was the only one
                try:
                    response = sso_client.delete_inline_policy_from_permission_set(
                        InstanceArn = settings.sso_instance_arn,
                        PermissionSetArn = permission_set
                    )
                except Exception as error:
                    log.error(f'>> remove_deny_all_policy (delete_inline_policy_from_permission_set): {error}')
                    raise error
            else:
                # Attach the updated inline policy to the permission set
                try:
                    response = sso_client.put_inline_policy_to_permission_set(
                        InstanceArn = settings.sso_instance_arn,
                        PermissionSetArn = permission_set,
                        InlinePolicy = json.dumps(current_inline_policy_json)
                    )
                except Exception as error:
                    log.error(f'>> remove_deny_all_policy (put_inline_policy_to_permission_set): {error}')
                    raise error

            # Push the update
            try:
                response = sso_client.update_permission_set(
                    InstanceArn = settings.sso_instance_arn,
                    PermissionSetArn = permission_set
                )
            except Exception as error:
                log.error(f'>> remove_deny_all_policy: {error}')
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
                log.error(f'>> remove_deny_all_policy: {error}')
                raise error
        else:
            log.info(f":: No current inline policy exists for cloud_account_group {cloud_account_group['cloud_account_group_name']}")
    else:
        log.info(f":: No current inline policy exists for cloud_account_group {cloud_account_group['cloud_account_group_name']}")

'''
    remove_users_from_group
        Remove all Cloud Account Users from the AWS group
'''
def remove_users_from_group(cloud_account_group):
    log.info(':: remove_users_from_group')

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
                "op": "remove",
                "path": "members"
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
        response.raise_for_status()
    except requests.exceptions.HTTPError as error:
        log.error(f'>> remove_users_from_group HTTPError: {error}')
        raise error
    except Exception as error: 
        log.error(f'>> remove_users_from_group: {error}')
        raise error

    if response.status_code not in range(200, 300):
        log.error(f'>> remove_users_from_group: {response.text}')
        raise Exception(f'>> remove_users_from_group: {response.text}')

    return True

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

        if response:
            payload = response[0]
        else:
            payload = ''

        cache_query_response('cloud_account', hashed_query, payload)

    if payload != '':
        return payload
    else:
        return None

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
            log.error(f">> process_post_method: {error}")
            return return_error(503, error)

        if response:
            payload = json.dumps(response[0])
        else:
            payload = '{}'

        cache_query_response('cloud_account_group', hashed_query, payload)

    return json.loads(payload)

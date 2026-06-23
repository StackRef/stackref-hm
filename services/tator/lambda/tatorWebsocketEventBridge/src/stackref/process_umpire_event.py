import base64
import json
import logging

import stackref.settings as settings
from example.cloud_account import get_cloud_account_from_account_id, has_required_funds
from stackref.handle_ec2_resources import stop_aws_ec2_instance
from stackref.handle_messages import process_message
from stackref.handle_record_resource import *
from stackref.process_aws_config import process_aws_config

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_umpire_event
        Process internal Umpire Lambda function method requests
'''
def process_umpire_event(event):
    log.info(":: process_umpire_event")

    if 'body' in event:
        if(is_base64(event['body'])):
            body = base64.b64decode(event['body']).decode('utf-8')
        else:
            body = event['body']
        payload_json = json.loads(body)

        if 'event_source' in payload_json and payload_json['event_source'] == 'aws.config':
            process_aws_config(payload_json)
        elif (
            'event_source' in payload_json and
            'account_id' in payload_json and
            'event_name' in payload_json and
            'response_elements' in payload_json and
            payload_json['response_elements'] is not None
        ):
            log.debug(f':: payload_json: {payload_json}')

            account_id = payload_json['account_id']

            # If this is stackref-core account, ignore
            if account_id == '000000000000':
                return

            request_parameters = payload_json['request_parameters']
            response_elements = payload_json['response_elements']
            cloud_resource_id = None
            resource_status = None
            resource_type = payload_json['event_source']
            event_name = payload_json['event_name']

            if 'aRN' in response_elements:
                cloud_resource_id = response_elements['aRN']
            elif 'functionArn' in response_elements:
                cloud_resource_id = response_elements['functionArn']
                resource_type = 'aws.lambda.function'
            elif 'volumeId' in response_elements:
                cloud_resource_id = response_elements['volumeId']
                resource_type = 'aws.ec2.volume'

            if 'state' in response_elements:
                resource_status = response_elements['state']
            elif 'status' in response_elements:
                resource_status = response_elements['status']
            elif 'dBInstanceStatus' in response_elements:
                resource_type = 'aws.rds.instance'
                resource_status = response_elements['dBInstanceStatus']
            elif (
                'ModifyVolumeResponse' in response_elements and
                'volumeModification' in response_elements['ModifyVolumeResponse'] and
                'modificationState' in response_elements['ModifyVolumeResponse']['volumeModification']
            ):
                resource_type = 'aws.ec2.volume'
                resource_status = response_elements['ModifyVolumeResponse']['volumeModification']['modificationState']
                cloud_resource_id = response_elements['ModifyVolumeResponse']['volumeModification']['volumeId']
            elif request_parameters is not None and 'volumeId' in request_parameters:
                cloud_resource_id = request_parameters['volumeId']
                resource_type = 'aws.ec2.volume'
                if event_name == 'DeleteVolume':
                    resource_status = 'deleting'

            cloud_account = None
            can_deploy = False
            message = {}

            resource_uuid = resource_uuid_from_cloud_resource_id(cloud_resource_id)

            event_details = {
                'resource_uuid': str(resource_uuid),
                'account_id': account_id,
                'resource_type': resource_type,
                'cloud_resource_id': cloud_resource_id,
                'resource_status': resource_status,
                'response_elements': response_elements
            }

            if resource_uuid:
                try:
                    update_resource_in_cloud_resource_table(resource_uuid, event_details)
                except Exception as error:
                    log.error(f'>> process_umpire_event: {error}')
                    raise error

            if resource_status in ['creating','running']:
                try:
                    if resource_uuid:
                        # Resource was already deployed once with same ARN/ID
                        log.debug(f':: Resource already exists: {resource_uuid}')
                        # TODO: Log the resource state change in coach.resources
                        # TODO: Send resource state change to location for websocket
                    else:
                        cloud_account = get_cloud_account_from_account_id(account_id)
                        log.debug(json.dumps(cloud_account))

                        if cloud_account and 'cloud_account_uuid' in cloud_account:
                            try:
                                can_deploy, funds_required = has_required_funds(account_id, resource_type)
                            except Exception as error:
                                log.error(f'>> {error}')
                                raise error

                            log.info(f":: Account: {account_id}, cloud_account_uuid: {cloud_account['cloud_account_uuid']}, can_deploy: {'True' if can_deploy else 'False'}")

                            if not can_deploy:
                                message['title'] = "Resource provisioning failed"
                                message['description'] = f"Insufficient StackCash. Requires {funds_required} StackCash."
                                message['status'] = "error"
                                message['type'] = "cloud_account"
                                log.info(f":: Cloud Account owner {cloud_account['cloud_account_owner_uuid']} has insufficient funds for transaction.")
                                process_message(event_details, message)
                                if resource_type == 'aws.ec2':
                                    try:
                                        response = stop_aws_ec2_instance(account_id, cloud_resource_id)
                                        log.debug(f':: {response}')
                                    except Exception as error:
                                        log.error(f'>> process_umpire_event: {error}')
                                        raise error
                            else:
                                transaction_value = 0
                                try:
                                    transaction_value = log_resource_transaction(event_details)
                                except Exception as error:
                                    log.error(f'>> process_umpire_event: {error}')
                                    message['title'] = "Resource provisioning failed"
                                    message['description'] = "An unknown error occurred"
                                    message['status'] = "error"
                                    message['type'] = "cloud_account"
                                    process_message(event_details, message)

                                try:
                                    add_resource_to_cloud_resource_table(event_details)
                                    message['title'] = "New resource provisioned"
                                    message['description'] = f"StackCash transaction: -{transaction_value}"
                                    message['status'] = "success"
                                    message['type'] = "cloud_account"
                                except Exception as error:
                                    log.error(f'>> process_umpire_event: {error}')
                                    message['title'] = "Resource provisioning failed"
                                    message['description'] = "An unknown error occurred"
                                    message['status'] = "error"
                                    message['type'] = "cloud_account"

                                process_message(event_details, message)
                        else:
                            log.error(f':: Account {account_id} not present in cloud_account table')
                except Exception as error:
                    log.error(f'>> process_umpire_event: {error}')
                    raise error
            else:
                log.info(f':: resource_status: {resource_status}')

'''
    is_base64
        Test if object is base64 encoded
'''
def is_base64(sb):
    try:
        if isinstance(sb, str):
            # If there's any unicode here, an exception will be thrown and the function will return false
            sb_bytes = bytes(sb, 'ascii')
        elif isinstance(sb, bytes):
            sb_bytes = sb
        else:
            raise ValueError("Argument must be string or bytes")
        # deepcode ignore HandleUnicode: Only care about returning True/False
        return base64.b64encode(base64.b64decode(sb_bytes)) == sb_bytes
    except Exception:
        return False

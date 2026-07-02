import hashlib
import logging
import uuid

import stackref.settings as settings
from stackref.cache_functions import *
from example.cloud_account import get_cloud_account_from_account_id, has_required_funds
from stackref.handle_ec2_resources import stop_aws_ec2_instance
from stackref.handle_messages import process_message
from stackref.handle_record_resource import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)


'''
    process_eventbridge_event
        Process an event from EventBridge
'''
def process_eventbridge_event(event):
    log.info(":: process_eventbridge_event")

    account_id = event['account']

    # If this is stackref-core account, ignore
    if account_id == '000000000000':
        return

    resource_type = event['source']

    if 'responseElements' in event['detail'] and event['detail']['responseElements'] is not None and 'aRN' in event['detail']['responseElements']:
        cloud_resource_id = event['detail']['responseElements']['aRN']
    else:
        cloud_resource_id = event['resources'][0]

    resource_status = None
    response_elements = {}

    if 'responseElements' in event['detail']:
        response_elements = event['detail']['responseElements']

    # Handle anything supporting this field
    if 'EventCategories' in event['detail']:
        resource_status = event['detail']['EventCategories'][0]

    # Handle EC2
    if 'state' in event['detail']:
        resource_status = event['detail']['state']
        resource_type = f'{resource_type}.instance'
    elif 'responseElements' in event['detail'] and event['detail']['responseElements'] is not None:
        # Handle ElastiCache Redis
        if 'status' in event['detail']['responseElements']:
            resource_status = event['detail']['responseElements']['status']
            resource_type = f'{resource_type}.replicationgroup'
        # Handle ElastiCache Memcache
        elif 'cacheClusterStatus' in event['detail']['responseElements']:
            resource_status = event['detail']['responseElements']['cacheClusterStatus']
            resource_type = f'{resource_type}.cachecluster'

    cloud_account = None
    can_deploy = False
    message = {}

    resource_uuid = resource_uuid_from_cloud_resource_id(cloud_resource_id)

    event_details = {
        'resource_uuid': resource_uuid,
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
            log.error(f'>> process_eventbridge_event: {error}')
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
                        try:
                            process_message(event_details, message)
                        except Exception as error:
                            log.error(f'>> process_eventbridge_event: {error}')
                        if resource_type == 'aws.ec2.instance':
                            try:
                                response = stop_aws_ec2_instance(account_id, cloud_resource_id)
                                log.debug(f':: {response}')
                            except Exception as error:
                                log.error(f'>> process_eventbridge_event: {error}')
                                raise error
                        else:
                            log.info(f':: process_eventbridge_event: Unhandled resource_type: {resource_type}')
                    else:
                        try:
                            transaction_value = log_resource_transaction(event_details)
                        except Exception as error:
                            log.error(f'>> process_eventbridge_event: {error}')
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
                            log.error(f'>> process_eventbridge_event: {error}')
                            message['title'] = "Resource provisioning failed"
                            message['description'] = "An unknown error occurred"
                            message['status'] = "error"
                            message['type'] = "cloud_account"

                        process_message(event_details, message)
                else:
                    log.error(f':: Account {account_id} not present in cloud_account table')
        except Exception as error:
            log.error(f'>> process_eventbridge_event: {error}')
            raise error

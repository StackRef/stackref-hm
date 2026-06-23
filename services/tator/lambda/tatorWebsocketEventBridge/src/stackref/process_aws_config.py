import base64
import json
import logging

import stackref.settings as settings
from example.cloud_account import get_cloud_account_from_account_id, has_required_funds
from stackref.handle_ec2_resources import stop_aws_ec2_instance
from stackref.handle_messages import process_message
from stackref.handle_record_resource import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)


'''
'''
def process_aws_config(payload):
    log.debug(':: process_aws_config')

    account_id = payload['account_id']

    # If this is stackref-core account, ignore
    if account_id == '000000000000':
        return

    config_item = payload['config_item']
    resource_type = config_item['resourceType']
    resource_status = config_item['configurationItemStatus']

    if 'resourceId' in config_item and config_item['resourceId'] is not None:
        cloud_resource_id = config_item['resourceId']
    elif 'ARN' in config_item:
        cloud_resource_id = config_item['ARN']

    if resource_type == 'AWS::EC2::Volume':
        resource_type = 'aws.ec2.volume'

    resource_uuid = resource_uuid_from_cloud_resource_id(cloud_resource_id)

    event_details = {
        'resource_uuid': resource_uuid,
        'account_id': account_id,
        'resource_type': resource_type,
        'cloud_resource_id': cloud_resource_id,
        'resource_status': resource_status,
        'configuration_item': config_item
    }

    if resource_uuid:
        try:
            update_resource_in_cloud_resource_table(resource_uuid, event_details)
        except Exception as error:
            log.error(f'>> process_umpire_event: {error}')
            raise error

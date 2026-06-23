import boto3
import botocore.exceptions
import logging

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

def stop_aws_ec2_instance(account_id, cloud_resource_id):
    """
        stop_aws_ec2_instance
            Stop the provided AWS EC2 instance ID

        :param account_id: The AWS account ID where the EC2 instance lives (string)
        :param cloud_resource_id: The ARN of the EC2 instance (string)
        :return: Response from stop_instances (object)
    """ 

    if account_id and cloud_resource_id:
        try:
            instance_id = cloud_resource_id.split('/')[-1]
            sts = boto3.client('sts')
            team_account = sts.assume_role(
                RoleArn=f"arn:aws:iam::{account_id}:role/stackref/admin/sr-tator-websocket",
                RoleSessionName="tator_team_access"
            )

            ec2_client = boto3.client(
                'ec2',
                aws_access_key_id = team_account['Credentials']['AccessKeyId'],
                aws_secret_access_key = team_account['Credentials']['SecretAccessKey'],
                aws_session_token = team_account['Credentials']['SessionToken']
            )

            log.info(f':: Stopping {instance_id}')
            response = ec2_client.stop_instances(
                InstanceIds=[f'{instance_id}'],
                Force=True
            )
            return response
        except botocore.exceptions.ClientError as error:
            if error.response['Error']['Code'] == 'IncorrectInstanceState':
                log.info(':: Waiting for instance to be in running state')
                instance_running_waiter = ec2_client.get_waiter('instance_running')
                instance_running_waiter.wait(
                    InstanceIds=[f'{instance_id}'],
                    WaiterConfig={
                        'Delay': 5,
                        'MaxAttempts': 6
                    }
                )
                log.info(f':: Stopping {instance_id}')
                response = ec2_client.stop_instances(
                    InstanceIds=[f'{instance_id}'],
                    Force=True
                )
                return response
            else:
                log.error(f'>> {error}')
                raise error
        except Exception as error:
            log.error(f'>> {error}')
            raise error

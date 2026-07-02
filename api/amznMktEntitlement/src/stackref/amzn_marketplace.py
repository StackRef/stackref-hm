import boto3
import botocore.exceptions
import logging

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.grant_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    get_amzn_marketplace_customer
        Retrieve valid Amazon Marketplace customer ID for the provided token
'''
def get_amzn_marketplace_customer(token, session):
    log.info(":: get_amzn_marketplace_customer")

    mp_client = session.client('meteringmarketplace')

    try:
        customer = mp_client.resolve_customer(
            RegistrationToken=token
        )

        log.debug(customer)
    except botocore.exceptions.ClientError as error:
        log.error(f'>> get_amzn_marketplace_customer ClientError: {error}')
        raise error
    except Exception as error:
        log.error(f'>> get_amzn_marketplace_customer: {error}')
        raise error

    customer_id = None
    customer_aws_account_id = None

    if 'CustomerIdentifier' in customer:
        customer_id = str(customer['CustomerIdentifier'])
    if 'CustomerAWSAccountId' in customer:
        customer_aws_account_id = str(customer['CustomerAWSAccountId'])

    return customer_id, customer_aws_account_id


'''
    get_amzn_marketplace_entitlements
        Retrieve valid Amazon Marketplace entitlements for provided token
'''
def get_amzn_marketplace_entitlements(token):
    log.info(":: get_amzn_marketplace_entitlements")

    customer_id = None
    customer_aws_account_id = None
    entitlements = []

    try:
        mp_session = assume_role_marketplace()
        customer_id, customer_aws_account_id = get_amzn_marketplace_customer(token, mp_session)
    except Exception as error:
        log.error(f'>> get_amzn_marketplace_entitlements: {error}')
        raise error

    if customer_id:
        mpe_client = mp_session.client('marketplace-entitlement')

        response = mpe_client.get_entitlements(
            ProductCode=settings.marketplace_product_code,
            Filter={
                'CUSTOMER_IDENTIFIER': [customer_id]
                }
            )
        log.debug(response)

        if 'Entitlements' in response:
            entitlements = response['Entitlements']

    return {
        'customer_id': customer_id,
        'customer_aws_account_id': customer_aws_account_id,
        'entitlements': entitlements
    }

'''
    assume_role_marketplace
        Assume the role in the stackref-marketplace account to take action there
'''
def assume_role_marketplace():
    sts_client = boto3.client("sts")

    try:
        response = sts_client.assume_role(
            RoleArn=settings.marketplace_role,
            RoleSessionName="marketplace-session"
        )
    except Exception as error:
        log.error(f'>> assume_role_marketplace: {error}')
        raise error

    new_session = boto3.Session(aws_access_key_id=response['Credentials']['AccessKeyId'],
                        aws_secret_access_key=response['Credentials']['SecretAccessKey'],
                        aws_session_token=response['Credentials']['SessionToken'])

    return new_session

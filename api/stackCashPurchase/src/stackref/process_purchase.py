import logging

import stackref.settings as settings
from stackref.process_amazon import process_amz_purchase
from stackref.process_stripe import process_stripe_intent
from stackref.settings import return_error

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    process_purchase
        Process the StackCash purchase request
'''
def process_purchase(organization_uuid, purchase_details):
    log.info(":: process_purchase")

    if purchase_details['method'] == 'amz_mkt_metering':
        return process_amz_purchase(organization_uuid, purchase_details)
    elif purchase_details['method'] == 'stripe':
        # We use Stripe's iFrame now
        # return process_stripe_intent(organization_uuid, purchase_details)
        return return_error(500, 'Invalid purchase method')
    else:
        return return_error(500, 'Invalid purchase method')

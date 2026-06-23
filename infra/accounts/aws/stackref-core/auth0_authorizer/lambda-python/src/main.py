import json
import jwt
from jwt import PyJWKClient
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.auth0.auth0_jwt import check_auth0_jwt

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')

sentry_sdk.init(
    dsn="https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",

    integrations=[
        AwsLambdaIntegration()
    ],
    traces_sample_rate=1.0
)

'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    if 'headers' in event and 'Authorization' in event['headers']:
        id_token = event['headers']['Authorization']
        token = id_token.replace('Bearer ','')
    elif 'queryStringParameters' in event and 'auth' in event['queryStringParameters']:
        token = event['queryStringParameters']['auth']

    jwks_url = f'https://{settings.auth0_domain}/.well-known/jwks.json'
    jwks_client = PyJWKClient(jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    claimset = jwt.decode(token, options={"verify_signature": False})
    audience = claimset['aud']

    effect = 'Deny'
    token_data = None

    try:
        token_data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=audience,
            options={"verify_exp": True}
        )
    except Exception as error:
        token_data = None
        log.error(f'>> ${error}')
        effect = 'Deny'
        pass

    try:
        if check_auth0_jwt(token):
            effect = 'Allow'
        else:
            effect = 'Deny'
    except Exception as error:
        log.error(f'>> ${error}')
        effect = 'Deny'
        pass

    auth_response = {}
    if token_data and 'sub' in token_data:
        auth_response['principalId'] = token_data['sub']
    else:
        auth_response['principalId'] = '*'
    resource = event['methodArn']
    policy_document = {
        'Version': '2012-10-17',
        'Statement': [
            {
                'Sid': '',
                'Action': 'execute-api:Invoke',
                'Effect': effect,
                'Resource': resource
            }
        ]
    }
    auth_response['policyDocument'] = policy_document

    log.debug(json.dumps(auth_response))

    return(auth_response)

settings.init()

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

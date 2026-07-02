import auth0.exceptions
from auth0.authentication.token_verifier import TokenVerifier, AsymmetricSignatureVerifier
import jwt
import logging
import time

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)


'''
    check_auth0_jwt
        Check sent JWT header for authorization
'''
def check_auth0_jwt(token):
    log.debug(':: check_auth0_jwt')

    time_now = int(time.time())

    try:
        claimset = jwt.decode(token, options={"verify_signature": False})

        audience = claimset['aud']
        expire_time = int(claimset['exp'])
        issuer = claimset['iss']
        issued_at = int(claimset['iat'])

        if issuer != f'https://{settings.auth0_domain}/':
            raise Exception(f'Invalid issuer: {issuer}')

        if settings.auth0_be_audience not in audience:
            raise Exception('Invalid audience')

        if issued_at > time_now:
            raise Exception('Token issued for the future')

        if time_now >= expire_time:
            raise Exception('Expired token')
    except Exception as error:
        log.error(f'>> check_auth0_jwt: {error}')
        return False

    return True

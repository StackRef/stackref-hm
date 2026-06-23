import sys
sys.path.insert(0, 'package/')

import auth0.exceptions
from auth0.authentication.token_verifier import TokenVerifier, AsymmetricSignatureVerifier
import logging

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    check_auth0_jwt
        Check sent JWT header for authorization
'''
def check_auth0_jwt(id_token, app):
    log.debug(':: check_auth0_jwt')

    jwks_url = f'https://{settings.auth0_domain}/.well-known/jwks.json'
    issuer = f'https://{settings.auth0_domain}/'

    bearer, _, token = id_token.partition(' ')
    if bearer != 'Bearer':
        log.error(">> Invalid token")
        #raise ValueError('>> Invalid token')
        return False

    if app == "be":
        audience = settings.auth0_be_audience
        log.info(":: Authenticating Back-End Service")
    else:
        audience = settings.auth0_client_id
        log.info(":: Authenticating Front-End Service")

    try:
        sv = AsymmetricSignatureVerifier(jwks_url)
        tv = TokenVerifier(signature_verifier=sv, issuer=issuer, audience=audience)
        tv.verify(token)
    except auth0.exceptions.TokenValidationError as error:
        log.error(f">> check_auth0_jwt TokenValidationError: {error}")
        return False
    except Exception as error:
        log.error(f">> check_auth0_jwt Exception: {error}")
        return False

    log.info(f":: check_auth0_jwt: Valid token received: {token}")
    return True

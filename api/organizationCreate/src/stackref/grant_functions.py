import hashlib
import json
import logging
from pydash import get

import stackref.settings as settings
from stackref.settings import return_error
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    get_auth0_audience
        Return Auth0 Audience as either back-end (be) or front-end/user (fe)
'''
def get_auth0_audience(event):
    aud = get(event, 'requestContext.authorizer.jwt.claims.aud')
    auds = [s.strip("[]") for s in aud.split() if s.startswith("[") or s.endswith("]")]
    if aud == settings.auth0_be_audience:
        return 'be'
    elif settings.auth0_be_audience in auds:
        return 'be'
    elif any(item in auds for item in settings.auth0_client_ids):
        return 'fe'
    else:
        return None

'''
    get_be_auth0_scope
        Return back-end permissions as defined in Auth0
'''
def get_be_auth0_scope(event):
    scope = ''
    if get(event, 'requestContext.authorizer.jwt.claims.aud') == settings.auth0_be_audience:
        scope = get(event, 'requestContext.authorizer.jwt.claims.scope')

    return scope.split()

'''
    get_auth_provider_id
        Return auth_provider_id from API response payload if it exists. Otherwise return None.
'''
def get_auth_provider_id(event):
    return get(event, 'requestContext.authorizer.jwt.claims.sub')

'''
    get_user_uuid
        Return user_uuid from API response payload if it exists. Otherwise return None.
'''
def get_user_uuid(event):
    return get(event, 'requestContext.authorizer.jwt.claims.https://stackref\.com/sr-user-uuid')

'''
    get_organization_uuid
        Return organization_uuid from API response payload if it exists. Otherwise return None.
'''
def get_organization_uuid(event):
    return get(event, 'requestContext.authorizer.jwt.claims.https://stackref\.com/sr-organization-uuid')

'''
    get_user_grants
        Return user-level grants array
'''
def get_user_grants(user_uuid, organization_uuid):
    if not user_uuid or not organization_uuid:
        return []

    sql_statement = ("""
    -- Get User's user-level grants for the Organization
    SELECT
        json_agg(DISTINCT x.grant) AS user_role_grants
    FROM
        (
            SELECT
                urm.user_uuid AS user_uuid,
                urm.organization_uuid AS organization_uuid,
                row_to_json(jsonb_each(ur.user_role_grants))->>'key' AS grant,
                (row_to_json(jsonb_each(ur.user_role_grants))->>'value')::bool AS value
            FROM
                sr.user u
            LEFT JOIN sr.user_role_member urm ON
                u.user_uuid = urm.user_uuid
            LEFT JOIN sr.user_role ur ON
                ur.user_role_id = urm.user_role_id
        ) AS x
    WHERE
        x.value
        AND x.user_uuid = %(user_uuid)s::UUID
        AND x.organization_uuid = %(organization_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {
        'user_uuid': user_uuid,
        'organization_uuid': organization_uuid
    }

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('user', hashed_query)
    if cached_data:
        log.info(':: get_user_grants: Using cached data')
        return json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_user_grants: {error}")
            return return_error(503, error)

        if not response and not response[0]:
            return []

        user_roles = json.dumps(response[0])

        # Don't cache these for long (5s)
        cache_query_response('user', hashed_query, user_roles, 5)

        return json.loads(user_roles)

'''
    get_event_by_team
        Return the event_uuid that the team_uuid belongs to
'''
def get_event_by_team(team_uuid):
    if not team_uuid:
        return None

    sql_statement = ("""
    -- Get Event that Team is part of
    SELECT
        event_uuid
    FROM
        sr.team
    WHERE
        team_uuid = %(team_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {'team_uuid': team_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team', hashed_query)
    if cached_data:
        log.info(':: get_event_by_team: Using cached data')
        return cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_event_by_team: {error}")
            return None

        if response and response[0]:
            event_uuid = response[0]
        else:
            event_uuid = None

        cache_query_response('team', hashed_query, event_uuid)

        return event_uuid

'''
    get_participant_grants
        If the User is a Participant in the Event, return Participant grants
'''
def get_participant_grants(user_uuid, event_uuid):
    if not user_uuid or not event_uuid:
        return []

    sql_statement = ("""
    -- Get User's Participant grants for Event
    SELECT
        json_agg(DISTINCT x.grant) AS participant_role_grants
    FROM
        (
            SELECT
                p.user_uuid AS user_uuid,
                p.event_uuid AS event_uuid,
                prm.participant_uuid AS participant_uuid,
                row_to_json(jsonb_each(pr.participant_role_grants))->>'key' AS grant,
                (row_to_json(jsonb_each(pr.participant_role_grants))->>'value')::bool AS value
            FROM
                sr.participant p
            LEFT JOIN sr.participant_role_member prm ON
                p.participant_uuid = prm.participant_uuid
            LEFT JOIN sr.participant_role pr ON
                pr.participant_role_id = prm.participant_role_id
        ) AS x
    WHERE
        x.value
        AND x.user_uuid = %(user_uuid)s::UUID
        AND x.event_uuid = %(event_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {
        'user_uuid': user_uuid,
        'event_uuid': event_uuid
    }

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('participant', hashed_query)
    if cached_data:
        log.info(':: get_participant_grants: Using cached data')
        return json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_participant_grants: {error}")
            return []

        if response and response[0]:
            participant_roles = response[0]
        else:
            participant_roles = []

        # Don't cache these for long (5s)
        cache_query_response('participant', hashed_query, json.dumps(participant_roles), 5)

        return participant_roles

'''
    get_team_member_grants
        If the User is a Participant in a Team in the Event, return Team Member grants
'''
def get_team_member_grants(user_uuid, team_uuid):
    if not user_uuid or not team_uuid:
        return []

    sql_statement = ("""
    -- Get a Team Member's grants for Team
    SELECT
        json_agg(DISTINCT x.grant) AS team_member_role_grants
    FROM
        (
            SELECT
                p.user_uuid AS user_uuid,
                p.participant_uuid AS participant_uuid,
                t.team_uuid AS team_uuid,
                tmrm.team_member_uuid AS team_member_uuid,
                row_to_json(jsonb_each(tmr.team_member_role_grants))->>'key' AS grant,
                (row_to_json(jsonb_each(tmr.team_member_role_grants))->>'value')::BOOL AS value
            FROM
                sr.team_member tm
            LEFT JOIN sr.team t ON
                t.team_uuid = tm.team_uuid
            LEFT JOIN sr.participant p ON
                tm.participant_uuid = p.participant_uuid
            LEFT JOIN sr.team_member_role_member tmrm ON
                tm.team_member_uuid = tmrm.team_member_uuid
            LEFT JOIN sr.team_member_role tmr ON
                tmr.team_member_role_id = tmrm.team_member_role_id
        ) AS x
    WHERE
        x.value
        AND x.user_uuid = %(user_uuid)s::UUID
        AND x.team_uuid = %(team_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {
        'user_uuid': user_uuid,
        'team_uuid': team_uuid
    }

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team_member', hashed_query)
    if cached_data:
        log.info(':: get_team_member_grants: Using cached data')
        return json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_team_member_grants: {error}")
            return []

        if response and response[0]:
            team_member_roles = response[0]
        else:
            return []

        # Don't cache these for long (5s)
        cache_query_response('team_member', hashed_query, json.dumps(team_member_roles), 5)

        return team_member_roles

'''
    get_organization_by_user
        Return the organization_uuid that the user_uuid belongs to
'''
def get_organization_by_user(user_uuid):
    if not user_uuid:
        return None

    sql_statement = ("""
    -- Get Organization that User is part of
    SELECT
        organization_uuid
    FROM
        sr.user
    WHERE
        user_uuid = %(user_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {'user_uuid': user_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('user', hashed_query)
    if cached_data:
        log.info(':: get_organization_by_user: Using cached data')
        return cached_data
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_organization_by_user: {error}")
            return None

        if response and response[0]:
            organization_uuid = response[0]
        else:
            organization_uuid = None

        cache_query_response('user', hashed_query, organization_uuid)

        return organization_uuid

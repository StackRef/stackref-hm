import boto3
import hashlib
import logging

import stackref.settings as settings
from stackref.cache_functions import *

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    delete_teams_analysis
        Delete CodeCommit repo and IAM credentials for Event Teams
'''
def delete_teams_analysis(event_uuid):
    log.info(':: delete_teams_analysis')

    event_teams = get_event_teams(event_uuid)

    for event_team in event_teams:
        try:
            delete_team_analysis(str(event_team['team_uuid']))
        except Exception as error:
            log.error(f'>> delete_teams_analysis: {error}')
            raise error

'''
    delete_team_analysis
        Delete CodeCommit repo and IAM credentials for Team
'''
def delete_team_analysis(team_uuid):
    log.info(':: delete_team_analysis')

    try:
        codescans_session = assume_role_analysis_codescans()
    except Exception as error:
        log.error(f'>> delete_team_iam_account: {error}')
        raise error

    try:
        delete_team_repo(team_uuid, codescans_session)
    except Exception as error:
        log.error(f'>> delete_team_analysis: {error}')
        raise error

    try:
        delete_team_iam_account(team_uuid, codescans_session)
    except Exception as error:
        log.error(f'>> delete_team_analysis: {error}')
        raise error


'''
'''
def delete_team_iam_account(team_uuid, session):
    iam_client = session.client('iam')

    try:
        iam_client.delete_user_policy(
            UserName=team_uuid,
            PolicyName=f'team-codecommit-{team_uuid}'
        )
    except iam_client.exceptions.NoSuchEntityException as error:
        log.error(f'>> delete_team_iam_account: {error}')
        pass
    except Exception as error:
        log.error(f'>> delete_team_iam_account: {error}')
        raise error

    try:
        credentials = iam_client.list_service_specific_credentials(
            UserName=team_uuid)['ServiceSpecificCredentials']

        for credential in credentials:
            credential_id = credential['ServiceSpecificCredentialId']
            iam_client.delete_service_specific_credential(
                UserName=team_uuid,
                ServiceSpecificCredentialId=credential_id
            )
    except iam_client.exceptions.NoSuchEntityException as error:
        log.error(f'>> delete_team_iam_account: {error}')
        pass
    except Exception as error:
        log.error(f'>> delete_team_iam_account: {error}')
        raise error

    try:
        iam_client.delete_user(
            UserName=team_uuid
        )
    except iam_client.exceptions.NoSuchEntityException as error:
        log.error(f'>> delete_team_iam_account: {error}')
        pass
    except Exception as error:
        log.error(f'>> delete_team_iam_account {error}')
        raise error


'''
'''
def delete_team_repo(team_uuid, session):
    cc_client = session.client('codecommit')

    try:
        response = cc_client.delete_repository(
            repositoryName=team_uuid
        )
        log.debug(f':: delete_team_repo: {response}')
    except Exception as error:
        log.error(f'>> delete_team_repo: {error}')
        raise error


'''
    assume_role_analysis_codescans
        Assume the role in the stackref-analysis-codescans account to take action there
'''
def assume_role_analysis_codescans():
    sts_client = boto3.client("sts")

    try:
        response = sts_client.assume_role(
            RoleArn=settings.codescans_role,
            RoleSessionName="codescans-session"
        )
    except Exception as error:
        log.error(f'>> assume_role_analysis_codescans: {error}')
        raise error

    new_session = boto3.Session(aws_access_key_id=response['Credentials']['AccessKeyId'],
                        aws_secret_access_key=response['Credentials']['SecretAccessKey'],
                        aws_session_token=response['Credentials']['SessionToken'])

    return new_session

'''
'''
def get_event_teams(event_uuid):

    sql_statement = ("""
        -- Retrieve Event Team UUIDs
        SELECT
            json_agg(teams) AS teams
        FROM
            (
                SELECT
                    team_uuid
                FROM
                    sr.team
                WHERE
                    event_uuid = %(event_uuid)s::UUID
            ) AS teams;
    """)
    log.debug(sql_statement)
    sql_parameters = {
        'event_uuid': event_uuid
    }

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('event', hashed_query)
    payload = []
    if cached_data:
        log.info(':: Using cached data')
        payload = json.loads(cached_data)
    else:
        log.info(':: Fetching data to cache')
        try:
            with settings.db_conn() as db_conn:
                with db_conn.cursor() as cur:
                    cur.execute(sql_statement, sql_parameters)
                    response = cur.fetchone()
                    log.debug(f":: response: {response}")
        except Exception as error:
            log.error(f">> get_event_teams: {error}")
            return payload

        if response and response[0]:
            payload = response[0]

        try:
            cache_query_response('event', hashed_query, json.dumps(payload))
        except:
            log.error(f">> cache_query_response")

    return payload

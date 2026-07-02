import boto3
import json
import logging

import stackref.settings as settings
from stackref.cache_functions import incr_key_prefix

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

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

    return True


'''
'''
def delete_team_iam_account(team_uuid, session):
    iam_client = session.client('iam')

    try:
        response = iam_client.delete_user(
            UserName=team_uuid
        )
    except Exception as error:
        log.error(f'>> delete_team_iam_account {error}')
        raise error

    sql_statement = ("""
        -- Delete Team CodeCommit info
        DELETE FROM
            sr.team_codecommit
        WHERE
            team_uuid = %(team_uuid)s::UUID;
    """)
    sql_parameters = {
        'team_uuid': team_uuid
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> delete_team_iam_account: {error}")
        raise error

    return True


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

    return True


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

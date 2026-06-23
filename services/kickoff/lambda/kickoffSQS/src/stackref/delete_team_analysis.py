import logging
import time
from botocore.exceptions import ClientError

import stackref.settings as settings
from stackref.create_team_analysis import assume_role_analysis_codescans

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

    max_retries = 5
    backoff_time = 1

    try:
        codescans_session = assume_role_analysis_codescans()
    except Exception as error:
        log.error(f'>> delete_team_iam_account: {error}')
        raise error

    for i in range(max_retries):
        try:
            delete_codescan_pipeline(team_uuid, codescans_session)
            break 
        except ClientError as error:
            if error.response['Error']['Code'] == 'ThrottlingException':
                if i < max_retries - 1:
                    log.warning(f'>> delete_codescan_pipeline: ThrottlingException, retrying in {backoff_time} seconds')
                    time.sleep(backoff_time)
                    backoff_time *= 2
                else:
                    log.error(f'>> delete_codescan_pipeline: ThrottlingException, reached max retries: {max_retries}')
                    raise error
            else:
                log.error(f'>> delete_codescan_pipeline: {error}')
                raise error
    for i in range(max_retries):
        try:
            delete_team_repo(team_uuid, codescans_session)
            break 
        except ClientError as error:
            if error.response['Error']['Code'] == 'ThrottlingException':
                if i < max_retries - 1:
                    log.warning(f'>> delete_team_repo: ThrottlingException, retrying in {backoff_time} seconds')
                    time.sleep(backoff_time)
                    backoff_time *= 2
                else:
                    log.error(f'>> delete_team_repo: ThrottlingException, reached max retries: {max_retries}')
                    raise error
            else:
                log.error(f'>> delete_team_repo: {error}')
                raise error
    for i in range(max_retries):
        try:
            delete_team_iam_account(team_uuid, codescans_session)
            break 
        except ClientError as error:
            if error.response['Error']['Code'] == 'ThrottlingException':
                if i < max_retries - 1:
                    log.warning(f'>> delete_team_iam_account: ThrottlingException, retrying in {backoff_time} seconds')
                    time.sleep(backoff_time)
                    backoff_time *= 2
                else:
                    log.error(f'>> delete_team_iam_account: ThrottlingException, reached max retries: {max_retries}')
                    raise error
            else:
                log.error(f'>> delete_team_iam_account: {error}')
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
        log.info(f'>> delete_team_iam_account: {error}')
        pass
    except ClientError:
        raise
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
        log.info(f'>> delete_team_iam_account: {error}')
        pass
    except ClientError:
        raise
    except Exception as error:
        log.error(f'>> delete_team_iam_account: {error}')
        raise error

    try:
        iam_client.delete_user(
            UserName=team_uuid
        )
    except iam_client.exceptions.NoSuchEntityException as error:
        log.info(f'>> delete_team_iam_account {error}')
        pass
    except ClientError:
        raise
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


'''
'''
def delete_team_repo(team_uuid, session):
    cc_client = session.client('codecommit')

    try:
        response = cc_client.delete_repository(
            repositoryName=team_uuid
        )
        log.debug(f':: delete_team_repo: {response}')
    except ClientError:
        raise
    except Exception as error:
        log.error(f'>> delete_team_repo: {error}')
        raise error


'''
'''
def delete_codescan_pipeline(team_uuid, session):
    cp_client = session.client('codepipeline')

    try:
        response = cp_client.delete_pipeline(
            name=f'sr_team_codescan_{team_uuid}'
        )
        log.debug(f':: delete_codescan_pipeline: {response}')
    except ClientError:
        raise
    except Exception as error:
        log.error(f'>> delete_codescan_pipeline: {error}')
        raise error

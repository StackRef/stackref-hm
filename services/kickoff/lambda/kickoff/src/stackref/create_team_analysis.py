import boto3
import json
import logging

import stackref.settings as settings

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
    create_team_analysis
        Create CodeCommit repo and IAM credentials for Team
'''
def create_team_analysis(team_uuid):
    log.info(':: create_team_analysis')

    try:
        codescans_session = assume_role_analysis_codescans()
    except Exception as error:
        log.error(f'>> create_team_iam_account: {error}')
        raise error

    try:
        create_team_repo(team_uuid, codescans_session)
    except Exception as error:
        log.error(f'>> create_team_analysis: {error}')
        raise error

    try:
        create_team_iam_account(team_uuid, codescans_session)
    except Exception as error:
        log.error(f'>> create_team_analysis: {error}')
        raise error


'''
'''
def create_team_iam_account(team_uuid, session):
    iam_client = session.client('iam')

    try:
        response = iam_client.create_user(
            Path='/team_users/',
            UserName=team_uuid
        )
    except Exception as error:
        log.error(f'>> create_team_iam_account {error}')
        raise error

    try:
        response = iam_client.create_service_specific_credential(
            UserName=team_uuid,
            ServiceName='codecommit.amazonaws.com'
        )
        log.debug(f':: create_team_iam_account: {response}')
        git_username = response['ServiceSpecificCredential']['ServiceUserName']
        git_password = response['ServiceSpecificCredential']['ServicePassword']
    except Exception as error:
        log.error(f'>> create_team_iam_account: {error}')
        raise error

    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "IAMReadOnlyConsoleAccess",
                "Effect": "Allow",
                "Action": [
                    "iam:ListSSHPublicKeys",
                    "iam:ListServiceSpecificCredentials"
                ],
                "Resource": "arn:aws:iam::*:user/${aws:username}"
            },
            {
                "Sid": "IAMUserSSHKeys",
                "Effect": "Allow",
                "Action": [
                    "iam:GetSSHPublicKey",
                    "iam:ListSSHPublicKeys"
                ],
                "Resource": "arn:aws:iam::*:user/${aws:username}"
            },
            {
                "Sid": "GitPermissions",
                "Effect": "Allow",
                "Action": [
                    "codecommit:Cancel*",
                    "codecommit:Describe*",
                    "codecommit:Get*",
                    "codecommit:Git*",
                    "codecommit:Evaluate*",
                    "codecommit:Merge*",
                    "codecommit:Post*",
                    "codecommit:CreateBranch",
                    "codecommit:ListBranches",
                    "codecommit:PutCommentReaction",
                    "codecommit:DeleteCommentContent",
                    "codecommit:ListPullRequests",
                    "codecommit:PutFile",
                    "codecommit:CreateCommit",
                    "codecommit:BatchGetPullRequests",
                    "codecommit:BatchDescribeMergeConflicts",
                    "codecommit:CreateUnreferencedMergeCommit",
                    "codecommit:DeletePullRequestApprovalRule",
                    "codecommit:BatchGetCommits",
                    "codecommit:CreatePullRequest",
                    "codecommit:DeleteFile",
                    "codecommit:DeleteBranch"
                ],
                "Resource": f"arn:aws:codecommit:us-east-1:{settings.analysis_account_id}:{team_uuid}"
            }
        ]
    }

    try:
        iam_client.put_user_policy(
            UserName=team_uuid,
            PolicyName=f'team-codecommit-{team_uuid}',
            PolicyDocument=json.dumps(policy_document)
        )
    except Exception as error:
        log.error(f'>> create_team_iam_account: {error}')
        raise error

    team_codecommit_repo_url = f'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/{team_uuid}'

    sql_statement = ("""
        -- Team CodeCommit info
        INSERT
            INTO
            sr.team_codecommit (
                team_uuid,
                team_codecommit_repo_url,
                team_codecommit_user,
                team_codecommit_password
            )
        VALUES (
            %(team_uuid)s::UUID,
            %(team_codecommit_repo_url)s,
            %(team_codecommit_user)s,
            %(team_codecommit_password)s
        );
    """)
    sql_parameters = {
        'team_uuid': team_uuid,
        'team_codecommit_repo_url': team_codecommit_repo_url,
        'team_codecommit_user': git_username,
        'team_codecommit_password': git_password
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn:
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> create_team_iam_account: {error}")
        raise error


'''
'''
def create_team_repo(team_uuid, session):
    cc_client = session.client('codecommit')

    try:
        response = cc_client.create_repository(
            repositoryName=team_uuid,
            repositoryDescription=f'Team {team_uuid}'
        )
        log.debug(f':: create_team_repo: {response}')
    except Exception as error:
        log.error(f'>> create_team_repo: {error}')
        raise error

    readme_file = """
        # README.md
        
        Code added to this default branch (`main`) will be automatically scanned as part of
        event judging analysis, once your team's event has ended.
    """

    try:
        response = cc_client.create_commit(
            repositoryName=team_uuid,
            branchName='main',
            commitMessage='Initial commit',
            putFiles=[
                {
                    'filePath': 'README.md',
                    'fileMode': 'NORMAL',
                    'fileContent': readme_file.encode('utf-8')
                }
            ]
        )
        log.debug(f':: create_team_repo: {response}')
    except Exception as error:
        log.error(f'>> create_team_repo: {error}')
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

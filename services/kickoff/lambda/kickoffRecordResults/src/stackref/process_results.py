import boto3
import hashlib
import io
import json
import logging
import uuid
import zipfile

import stackref.settings as settings
from stackref.cache_functions import *
from stackref.tator_notify import tator_notify

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

'''
'''
def process_results(artifact, aws_credentials):
    log.info(':: process_results')

    team_uuid = None

    try:
        s3_client = boto3.client('s3')

        artifact_name = artifact['name']
        bucket_name = artifact['location']['s3Location']['bucketName']
        file_key = artifact['location']['s3Location']['objectKey']

        log.debug(f':: Bucket: {bucket_name}, Key: {file_key}')

        team_uuid = artifact_name.split('_')[1]

        if not team_uuid:
            raise ValueError('team_uuid must be set')

        log.info(f':: Logging results for Team {team_uuid}')
    except Exception as error:
        log.error(f'>> process_results: {error}')
        raise error

    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
        file_content = response['Body'].read()

        with zipfile.ZipFile(io.BytesIO(file_content), 'r') as zip_file:
            # Extract the first file in the zip
            first_file = zip_file.namelist()[0]
            extracted_content = zip_file.read(first_file).decode('utf-8')

        if extracted_content:
            log.debug(extracted_content)

            file_json = json.loads(extracted_content)
            if file_json:
                result_source = "undefined"

                # Do our best to detect results source/provider
                if 'runs' in file_json:
                    result_source = "snyk"
                elif 'projects' in file_json:
                    result_source = "infracost"
                elif 'code_summary' in file_json:
                    result_source = "cossell"
                elif isinstance(file_json, list) and file_json[0] and 'Name' in file_json[0]:
                    result_source = "scc"
                elif isinstance(file_json, list) and file_json[0] and 'type' in file_json[0]:
                    result_source = "codeclimate"

                log.debug(f':: Result source: {result_source}')

                record_results(team_uuid, result_source, file_json)
            else:
                log.info(':: Zero-length JSON -- not processing')
        else:
            log.info(':: Zero-byte file extracted -- not processing')
    except Exception as error:
        log.error(f'>> process_results: {error}')
        raise error


'''
'''
def record_results(team_uuid, result_source, file_json):

    result_uuid = uuid.uuid4()

    sql_statement = ("""
        -- Record analysis result for Team
        INSERT
            INTO
            sr.team_analysis_result (
                team_analysis_result_uuid,
                team_uuid,
                team_analysis_result_source,
                team_analysis_result_json
            )
        VALUES (
            %(team_analysis_result_uuid)s::UUID,
            %(team_uuid)s::UUID,
            %(team_analysis_result_source)s,
            %(team_analysis_result_json)s::JSONB
        );
    """)
    sql_parameters = {
        'team_analysis_result_uuid': result_uuid,
        'team_uuid': team_uuid,
        'team_analysis_result_source': result_source,
        'team_analysis_result_json': json.dumps(file_json)
    }
    log.debug(sql_statement)
    try:
        with settings.db_conn() as db_conn: 
            with db_conn.cursor() as cur:
                cur.execute(sql_statement, sql_parameters)
    except Exception as error:
        log.error(f">> record_results: {error}")
        raise error

    try:
        incr_key_prefix('team')
        incr_key_prefix('team_codecommit')
        incr_key_prefix('team_analysis_result')
        incr_key_prefix('event')
    except:
        log.error('>> incr_key_prefix')

    # Send Tator command to update UI
    try:
        event_uuid = get_event_by_team(team_uuid)
        tator_message = {
            "command": "initializeEventActivity",
            "type": "command",
            "args": event_uuid
        }
        tator_notify(tator_message, event_uuid)
    except Exception as error:
        log.error(f'>> event_end: {error}')

'''
'''
def put_codepipeline_result(job_id, result='success'):
    try:
        codescans_session = assume_role_analysis_codescans()
    except Exception as error:
        log.error(f'>> create_team_iam_account: {error}')
        raise error

    cp_client = codescans_session.client('codepipeline')

    if result == 'success':
        try:
            response = cp_client.put_job_success_result(
                jobId=job_id
            )
        except Exception as error:
            log.error(f'>> put_codepipeline_result: {error}')
            raise error
    else:
        try:
            response = cp_client.put_job_failure_result(
                jobId=job_id,
                failureDetails={
                    'type': 'JobFailed',
                    'message': str(result)
                }
            )
        except Exception as error:
            log.error(f'>> put_codepipeline_result: {error}')
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
    get_organization_by_team
        Return the organization_uuid that the team_uuid belongs to
'''
def get_organization_by_team(team_uuid):
    if not team_uuid:
        return None

    sql_statement = (f"""
    -- Get Organization that Team is part of
    SELECT
        e.organization_uuid
    FROM
        sr.team AS t
    LEFT JOIN
        sr.event AS e
    ON
        t.event_uuid = e.event_uuid
    WHERE
        team_uuid = %(team_uuid)s::UUID;
    """)
    log.debug(sql_statement)

    sql_parameters = {'team_uuid': team_uuid}

    hashed_query = hashlib.sha256(f'{str(sql_statement)}_{str(sql_parameters)}'.encode('utf-8')).hexdigest()
    cached_data = retrieve_query_response('team', hashed_query)
    if cached_data:
        log.info(':: get_organization_by_team: Using cached data')
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
            log.error(f">> get_organization_by_team: {error}")
            return None

        if response and response[0]:
            organization_uuid = response[0]
        else:
            organization_uuid = None

        cache_query_response('team', hashed_query, organization_uuid)

        return str(organization_uuid)

'''
    get_event_by_team
        Return the event_uuid that the team_uuid belongs to
'''
def get_event_by_team(team_uuid):
    if not team_uuid:
        return None

    sql_statement = (f"""
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

        return str(event_uuid)

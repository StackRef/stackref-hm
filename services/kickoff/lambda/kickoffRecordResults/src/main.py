import json
import logging
#import newrelic.agent
#import newrelic.agent
import sentry_sdk
from sentry_sdk.integrations.aws_lambda import AwsLambdaIntegration

import stackref.settings as settings
from stackref.process_results import process_results, put_codepipeline_result

print(':: Loading function')
#newrelic.agent.initialize('newrelic/newrelic.ini')

'''
    main
'''
#@newrelic.agent.lambda_handler()
def main(event, context):
    log.debug(f":: Received event: {json.dumps(event, indent=2)}")

    job_id = event['CodePipeline.job']['id']

    if (
        'data' in event['CodePipeline.job'] and
        'inputArtifacts' in event['CodePipeline.job']['data']
    ):
        aws_credentials = event['CodePipeline.job']['data']['artifactCredentials']
        for artifact in event['CodePipeline.job']['data']['inputArtifacts']:
            try:
                process_results(artifact, aws_credentials)
            except Exception as error:
                put_codepipeline_result(job_id, str(error))
                raise error

        put_codepipeline_result(job_id, 'success')
    else:
        put_codepipeline_result(job_id, 'Invalid CodePipeline payload received')


settings.init()

sentry_sdk.init(
    dsn="https://YOUR_SENTRY_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT",
    integrations=[
        AwsLambdaIntegration()
    ],
    traces_sample_rate=1.0,
    release=settings.kickoff_version
)

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger(__name__)
settings.logging_config()
log.setLevel(settings.log_level)

if __name__ == "__main__":
    main()

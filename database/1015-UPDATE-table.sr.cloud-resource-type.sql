-- Database:    sr
-- Table:       cloud_resource_type
-- Description: Add more resource costs and change aws.ec2 to aws.ec2.instance

UPDATE
    sr."cloud_resource_type"
SET
    cloud_resource_type_name = 'aws.ec2.instance',
    ts_modified = NOW()
WHERE
    cloud_resource_type_name = 'aws.ec2'
;

INSERT INTO sr."cloud_resource_type" ( 
    cloud_resource_type_name, cloud_resource_type_description, stackcash_cost, cloud_account_provider_id
) VALUES
    (
        'aws.ec2.volume',
        'AWS EC2 EBS Volume',
        10.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.rds.instance',
        'AWS RDS Instance',
        200.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.elasticache.replicationgroup',
        'AWS ElastiCache Redis Replication Group',
        100.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.elasticache.cachecluster',
        'AWS ElastiCache Memcache Cluster',
        100.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.lambda.function',
        'AWS Lambda Function',
        0.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.s3.bucket',
        'AWS S3 Bucket',
        10.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.dynamodb.table',
        'AWS DynamoDB Table',
        10.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.apigateway.rest',
        'AWS REST API Gateway',
        10.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    ),
    (
        'aws.cloudfront.distribution',
        'AWS CloudFront Distribution',
        100.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    )
;

INSERT INTO sr."cloud_resource_type" ( 
    cloud_resource_type_name, cloud_resource_type_description, stackcash_cost, cloud_account_provider_id
) VALUES
    (
        'aws.apigateway.http',
        'AWS HTTP API Gateway',
        10.00,
        (
            SELECT
                cloud_account_provider_id
            FROM
                sr.cloud_account_provider
            WHERE
                cloud_account_provider_name = 'AWS'
        )
    )
;

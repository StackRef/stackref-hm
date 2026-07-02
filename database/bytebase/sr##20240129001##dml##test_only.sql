-- Database:    sr
-- Table:       cloud_resource_type
-- Description: Just testing bytebase changes

UPDATE
    sr."cloud_resource_type"
SET
    cloud_resource_type_name = 'aws.ec2.instance',
    ts_modified = NOW()
WHERE
    cloud_resource_type_name = 'aws.ec2'
;

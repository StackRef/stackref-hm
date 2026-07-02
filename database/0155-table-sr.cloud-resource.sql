-- Database:    sr
-- Table:       cloud_resource
-- Description: Inventory and status of cloud resources

ALTER TABLE IF EXISTS sr."cloud_resource" DROP CONSTRAINT IF EXISTS fk_cloud_resource_type_id;
DROP TABLE IF EXISTS sr."cloud_resource";

CREATE TABLE sr."cloud_resource" (
    cloud_resource_uuid UUID NOT NULL,
    cloud_resource_type_id INT4 NOT NULL DEFAULT 1,
    cloud_resource_details JSONB NULL,
    cloud_resource_tags JSONB NULL,
    cloud_account_owner_uuid UUID NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_checkedin TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    CONSTRAINT cloud_resource_pk PRIMARY KEY (cloud_resource_uuid)
);

ALTER TABLE sr.cloud_resource ADD CONSTRAINT fk_cloud_resource_type_id
    FOREIGN KEY (cloud_resource_type_id)
    REFERENCES sr.cloud_resource_type(cloud_resource_type_id);

-- Permissions

ALTER TABLE sr."cloud_resource" OWNER TO sradmin;
GRANT ALL ON TABLE sr."cloud_resource" TO sradmin;

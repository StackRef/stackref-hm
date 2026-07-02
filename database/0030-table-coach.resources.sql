DROP TABLE IF EXISTS coach."resources";

CREATE TABLE coach."resources" (
    resource_uuid UUID NOT NULL,
    resource_provider VARCHAR(50) NULL,
    provider_service VARCHAR(50) NULL,
    resource_details JSONB NULL,
    resource_tags JSONB NULL,
    organization_uuid UUID NULL,
    event_uuid UUID,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_checkedin TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT resources_pk PRIMARY KEY (resource_uuid)
);

-- Permissions

ALTER TABLE coach."resources" OWNER TO sradmin;
GRANT ALL ON TABLE coach."resources" TO sradmin;

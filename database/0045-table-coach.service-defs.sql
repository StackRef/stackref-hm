DROP TABLE IF EXISTS coach."service-defs";

CREATE TABLE coach."service-defs" (
    service_uuid UUID NOT NULL,
    service_name VARCHAR(50) NULL,
    service_version VARCHAR(50) NULL,
    service_availability INT4 NULL,
    service_details JSONB NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (service_uuid)
);

-- Permissions

ALTER TABLE coach."service-defs" OWNER TO sradmin;
GRANT ALL ON TABLE coach."service-defs" TO sradmin;

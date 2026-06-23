DROP TABLE IF EXISTS coach."services";

CREATE TABLE coach."services" (
    service_id VARCHAR(100) NOT NULL,
    service_image VARCHAR(255) NULL,
    service_command VARCHAR(255) NULL,
    service_created TIMESTAMP WITHOUT TIME ZONE NULL,
    service_status VARCHAR(100) NULL,
    service_ports VARCHAR(100) NULL,
    service_names VARCHAR(255) NULL,
    service_labels JSONB NULL,
    service_details JSONB NULL,
    resource_uuid uuid NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_checkedin TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (service_id)
);

-- Permissions

ALTER TABLE coach."services" OWNER TO sradmin;
GRANT ALL ON TABLE coach."services" TO sradmin;

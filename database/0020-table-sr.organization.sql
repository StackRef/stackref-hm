-- Database:    sr
-- Table:       organization
-- Description: Details of an organization using the platform

DROP TABLE IF EXISTS sr."organization";

CREATE TABLE IF NOT EXISTS sr."organization" (
    organization_uuid UUID NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_status_id INT NOT NULL DEFAULT(1),
    organization_domain VARCHAR(255) NULL,
    organization_logo_image BYTEA NULL,
    primary_contact_email VARCHAR(100) NULL,
    street_address_1 VARCHAR(100) NULL,
    street_address_2 VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    state_region VARCHAR(100) NULL,
    postal_code VARCHAR(25) NULL,
    phone VARCHAR(20),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (organization_uuid)
);

ALTER TABLE sr."organization" ADD CONSTRAINT fk_organization_status
    FOREIGN KEY(organization_status_id) 
    REFERENCES sr.organization_status(organization_status_id);

INSERT INTO sr."organization" (
    organization_uuid,
    organization_name
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    'N/A'
);

ALTER TABLE sr."organization" OWNER TO sradmin;
GRANT ALL ON TABLE sr."organization" TO sradmin;

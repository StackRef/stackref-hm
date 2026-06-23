-- Database:    sr
-- Table:       user
-- Description: Details of organization user using the platform

ALTER TABLE IF EXISTS sr."user" DROP CONSTRAINT IF EXISTS fk_user_role_id;
ALTER TABLE IF EXISTS sr."user" DROP CONSTRAINT IF EXISTS fk_organization;
DROP TABLE IF EXISTS sr."user";

CREATE TABLE IF NOT EXISTS sr."user" (
    user_uuid UUID NOT NULL,
    email_address VARCHAR(100) NOT NULL,
    organization_uuid UUID NULL,
    auth_provider_id VARCHAR(100) NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT(false),
    registered BOOLEAN NOT NULL DEFAULT(false),
    settings JSONB NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_last_login TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (user_uuid)
);

ALTER TABLE sr."user" ADD CONSTRAINT fk_organization
    FOREIGN KEY(organization_uuid) 
    REFERENCES sr.organization(organization_uuid);

INSERT INTO sr."user" (
    user_uuid,
    organization_uuid,
    email_address
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000'),
    'N/A'
);

ALTER TABLE sr."user" OWNER TO sradmin;
GRANT ALL ON TABLE sr."user" TO sradmin;

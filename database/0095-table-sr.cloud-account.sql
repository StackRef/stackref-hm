-- Database:    sr
-- Table:       cloud_account
-- Description: Cloud account details

ALTER TABLE IF EXISTS sr."cloud_account" DROP CONSTRAINT IF EXISTS fk_cloud_account_provider_id;
ALTER TABLE IF EXISTS sr."cloud_account" DROP CONSTRAINT IF EXISTS fk_cloud_account_status_id;
DROP TABLE IF EXISTS sr."cloud_account";
DROP TYPE IF EXISTS sr.cloud_account_owner_type;

CREATE TYPE sr."cloud_account_owner_type" AS ENUM (
    'stackref',
    'organization',
    'event',
    'participant',
    'team',
    'team_member',
    'user'
);

CREATE TABLE sr."cloud_account" (
    cloud_account_uuid UUID NOT NULL,
    cloud_account_cloud_id VARCHAR(100) NULL,
    cloud_account_provider_id INT4 NOT NULL DEFAULT 1,
    cloud_account_name VARCHAR(50) NULL,
    cloud_account_status_id INT4 NOT NULL DEFAULT 1,
    cloud_account_owner_uuid UUID NULL,
    cloud_account_owner_type sr.cloud_account_owner_type DEFAULT 'stackref',
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (cloud_account_uuid)
);

ALTER TABLE sr.cloud_account ADD CONSTRAINT fk_cloud_account_provider_id
    FOREIGN KEY (cloud_account_provider_id)
    REFERENCES sr.cloud_account_provider(cloud_account_provider_id);

ALTER TABLE sr.cloud_account ADD CONSTRAINT fk_cloud_account_status_id
    FOREIGN KEY (cloud_account_status_id)
    REFERENCES sr.cloud_account_status(cloud_account_status_id);

INSERT INTO sr."cloud_account" (
    cloud_account_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr.cloud_account OWNER TO sradmin;

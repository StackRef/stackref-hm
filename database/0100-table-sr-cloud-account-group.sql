-- Database:    sr
-- Table:       cloud_account_group
-- Description: Cloud Account Group information

ALTER TABLE IF EXISTS sr."cloud_account_group" DROP CONSTRAINT IF EXISTS fk_cloud_account_uuid;
ALTER TABLE IF EXISTS sr."cloud_account_group" DROP CONSTRAINT IF EXISTS fk_cloud_account_access_level;
DROP TABLE IF EXISTS sr."cloud_account_group";

CREATE TABLE IF NOT EXISTS sr."cloud_account_group" (
    cloud_account_group_uuid UUID NOT NULL,
    cloud_account_group_id VARCHAR(250) NOT NULL,
    cloud_account_group_name VARCHAR(250),
    cloud_account_uuid UUID NOT NULL,
    cloud_account_access_level_id INT NOT NULL DEFAULT(1),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (cloud_account_group_uuid)
);

ALTER TABLE sr."cloud_account_group" ADD CONSTRAINT fk_cloud_account_uuid
    FOREIGN KEY(cloud_account_uuid) 
    REFERENCES sr.cloud_account(cloud_account_uuid);

ALTER TABLE sr."cloud_account_group" ADD CONSTRAINT fk_cloud_account_access_level
    FOREIGN KEY(cloud_account_access_level_id) 
    REFERENCES sr.cloud_account_access_level(cloud_account_access_level_id);

INSERT INTO sr."cloud_account_group" (
    cloud_account_group_uuid,
    cloud_account_group_id,
    cloud_account_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    'N/A',
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."cloud_account_group" OWNER TO sradmin;
GRANT ALL ON TABLE sr."cloud_account_group" TO sradmin;

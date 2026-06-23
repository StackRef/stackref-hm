-- Database:    sr
-- Table:       cloud_account_group_member
-- Description: Users assigned to Cloud Account Groups

ALTER TABLE IF EXISTS sr."cloud_account_group_member" DROP CONSTRAINT IF EXISTS fk_cloud_account_group;
ALTER TABLE IF EXISTS sr."cloud_account_group_member" DROP CONSTRAINT IF EXISTS fk_cloud_account_user;
DROP TABLE IF EXISTS sr."cloud_account_group_member";

CREATE TABLE IF NOT EXISTS sr."cloud_account_group_member" (
    cloud_account_group_member_uuid UUID NOT NULL,
    cloud_account_group_uuid UUID NOT NULL,
    cloud_account_user_uuid UUID NOT NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (cloud_account_group_member_uuid)
);

ALTER TABLE sr."cloud_account_group_member" ADD CONSTRAINT fk_cloud_account_group
    FOREIGN KEY(cloud_account_group_uuid) 
    REFERENCES sr.cloud_account_group(cloud_account_group_uuid);

ALTER TABLE sr."cloud_account_group_member" ADD CONSTRAINT fk_cloud_account_user
    FOREIGN KEY(cloud_account_user_uuid) 
    REFERENCES sr.cloud_account_user(cloud_account_user_uuid);

INSERT INTO sr."cloud_account_group_member" (
    cloud_account_group_member_uuid,
    cloud_account_group_uuid,
    cloud_account_user_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."cloud_account_group_member" OWNER TO sradmin;
GRANT ALL ON TABLE sr."cloud_account_group_member" TO sradmin;

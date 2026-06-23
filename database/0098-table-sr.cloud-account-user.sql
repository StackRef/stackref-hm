-- Database:    sr
-- Table:       cloud_account_user
-- Description: User assignment to cloud_account(s)

ALTER TABLE IF EXISTS sr."cloud_account_user" DROP CONSTRAINT IF EXISTS fk_user;
ALTER TABLE IF EXISTS sr."cloud_account_user" DROP CONSTRAINT IF EXISTS fk_cloud_account;
DROP TABLE IF EXISTS sr."cloud_account_user";

CREATE TABLE IF NOT EXISTS sr."cloud_account_user" (
    cloud_account_user_uuid UUID NOT NULL,
    user_uuid UUID NOT NULL,
    cloud_account_uuid UUID NOT NULL,
    cloud_account_user_id VARCHAR(250),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (cloud_account_user_uuid)
);

ALTER TABLE sr."cloud_account_user" ADD CONSTRAINT fk_user
    FOREIGN KEY(user_uuid) 
    REFERENCES sr.user(user_uuid);

ALTER TABLE sr."cloud_account_user" ADD CONSTRAINT fk_cloud_account
    FOREIGN KEY(cloud_account_uuid) 
    REFERENCES sr.cloud_account(cloud_account_uuid);

INSERT INTO sr."cloud_account_user" (
    cloud_account_user_uuid,
    user_uuid,
    cloud_account_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."cloud_account_user" OWNER TO sradmin;
GRANT ALL ON TABLE sr."cloud_account_user" TO sradmin;

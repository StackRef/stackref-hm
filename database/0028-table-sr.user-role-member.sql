-- Database:    sr
-- Table:       user_role_member
-- Description: User-to-role(s) relationships

ALTER TABLE IF EXISTS sr."user_role_member" DROP CONSTRAINT IF EXISTS fk_user_uuid;
ALTER TABLE IF EXISTS sr."user_role_member" DROP CONSTRAINT IF EXISTS fk_user_role_id;
DROP TABLE IF EXISTS sr."user_role_member";

CREATE TABLE IF NOT EXISTS sr."user_role_member" (
    user_role_member_uuid UUID NOT NULL,
    user_uuid UUID NOT NULL,
    organization_uuid UUID NOT NULL,
    user_role_id INT NOT NULL DEFAULT(1),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (user_role_member_uuid)
);

ALTER TABLE sr."user_role_member" ADD CONSTRAINT fk_user_uuid
    FOREIGN KEY(user_uuid) 
    REFERENCES sr.user(user_uuid);

ALTER TABLE sr."user_role_member" ADD CONSTRAINT fk_organization_uuid
    FOREIGN KEY(organization_uuid) 
    REFERENCES sr.organization(organization_uuid);

ALTER TABLE sr."user_role_member" ADD CONSTRAINT fk_user_role_id
    FOREIGN KEY(user_role_id) 
    REFERENCES sr.user_role(user_role_id);

INSERT INTO sr."user_role_member" (
    user_role_member_uuid,
    user_uuid,
    organization_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."user_role_member" OWNER TO sradmin;
GRANT ALL ON TABLE sr."user_role_member" TO sradmin;

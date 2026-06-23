-- Database:    sr
-- Table:       team_member_role_member
-- Description: Team member-to-role(s) relationships

ALTER TABLE IF EXISTS sr."team_member_role_member" DROP CONSTRAINT IF EXISTS fk_team_member_uuid;
ALTER TABLE IF EXISTS sr."team_member_role_member" DROP CONSTRAINT IF EXISTS fk_team_member_role_id;
DROP TABLE IF EXISTS sr."team_member_role_member";

CREATE TABLE IF NOT EXISTS sr."team_member_role_member" (
    team_member_role_member_uuid UUID NOT NULL,
    team_member_uuid UUID NOT NULL,
    team_member_role_id INT NOT NULL DEFAULT(1),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_member_role_member_uuid)
);

ALTER TABLE sr."team_member_role_member" ADD CONSTRAINT fk_team_member_uuid
    FOREIGN KEY(team_member_uuid) 
    REFERENCES sr.team_member(team_member_uuid);

ALTER TABLE sr."team_member_role_member" ADD CONSTRAINT fk_team_member_role_id
    FOREIGN KEY(team_member_role_id) 
    REFERENCES sr.team_member_role(team_member_role_id);

INSERT INTO sr."team_member_role_member" (
    team_member_role_member_uuid,
    team_member_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."team_member_role_member" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team_member_role_member" TO sradmin;

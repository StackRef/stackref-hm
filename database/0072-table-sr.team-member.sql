-- Database:    sr
-- Table:       team_member
-- Description: Participant team and role attachment

ALTER TABLE IF EXISTS sr."team_member" DROP CONSTRAINT IF EXISTS fk_team;
ALTER TABLE IF EXISTS sr."team_member" DROP CONSTRAINT IF EXISTS fk_participant;
DROP TABLE IF EXISTS sr."team_member";

CREATE TABLE IF NOT EXISTS sr."team_member" (
    team_member_uuid UUID NOT NULL,
    team_uuid UUID NOT NULL,
    participant_uuid UUID NOT NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_member_uuid)
);

ALTER TABLE sr."team_member" ADD CONSTRAINT fk_team
    FOREIGN KEY(team_uuid) 
    REFERENCES sr.team(team_uuid);

ALTER TABLE sr."team_member" ADD CONSTRAINT fk_participant
    FOREIGN KEY(participant_uuid) 
    REFERENCES sr.participant(participant_uuid);

INSERT INTO sr."team_member" (
    team_member_uuid,
    team_uuid,
    participant_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."team_member" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team_member" TO sradmin;

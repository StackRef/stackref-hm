-- Database:    sr
-- Table:       participant_role_member
-- Description: Participant-to-role(s) relationships

ALTER TABLE IF EXISTS sr."participant_role_member" DROP CONSTRAINT IF EXISTS fk_participant_uuid;
ALTER TABLE IF EXISTS sr."participant_role_member" DROP CONSTRAINT IF EXISTS fk_participant_role_id;
DROP TABLE IF EXISTS sr."participant_role_member";

CREATE TABLE IF NOT EXISTS sr."participant_role_member" (
    participant_role_member_uuid UUID NOT NULL,
    participant_uuid UUID NOT NULL,
    participant_role_id INT NOT NULL DEFAULT(1),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (participant_role_member_uuid)
);

ALTER TABLE sr."participant_role_member" ADD CONSTRAINT fk_participant_uuid
    FOREIGN KEY(participant_uuid) 
    REFERENCES sr.participant(participant_uuid);

ALTER TABLE sr."participant_role_member" ADD CONSTRAINT fk_participant_role_id
    FOREIGN KEY(participant_role_id) 
    REFERENCES sr.participant_role(participant_role_id);

INSERT INTO sr."participant_role_member" (
    participant_role_member_uuid,
    participant_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."participant_role_member" OWNER TO sradmin;
GRANT ALL ON TABLE sr."participant_role_member" TO sradmin;

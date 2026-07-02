-- Database:    sr
-- Table:       team_event_feedback
-- Description: Form-inputed feedback about a Team or Event

ALTER TABLE IF EXISTS sr."team_event_feedback" DROP CONSTRAINT IF EXISTS fk_participant_uuid;
ALTER TABLE IF EXISTS sr."team_event_feedback" DROP CONSTRAINT IF EXISTS fk_event_uuid;
ALTER TABLE IF EXISTS sr."team_event_feedback" DROP CONSTRAINT IF EXISTS fk_team_uuid;
DROP TABLE IF EXISTS sr."team_event_feedback";

CREATE TABLE IF NOT EXISTS sr."team_event_feedback" (
    team_event_feedback_uuid UUID NOT NULL,
    participant_uuid UUID NOT NULL,
    event_uuid UUID NOT NULL DEFAULT UUID('00000000-00000000-00000000-00000000'),
    team_uuid UUID NOT NULL DEFAULT UUID('00000000-00000000-00000000-00000000'),
    feedback_text VARCHAR(2500) NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_event_feedback_uuid),   
    CONSTRAINT unique_feedback UNIQUE (participant_uuid, event_uuid, team_uuid)
);

ALTER TABLE sr."team_event_feedback" ADD CONSTRAINT fk_participant
    FOREIGN KEY(participant_uuid)
    REFERENCES sr.participant(participant_uuid);

ALTER TABLE sr."team_event_feedback" ADD CONSTRAINT fk_event
    FOREIGN KEY(event_uuid)
    REFERENCES sr.event(event_uuid);

ALTER TABLE sr."team_event_feedback" ADD CONSTRAINT fk_team
    FOREIGN KEY(team_uuid)
    REFERENCES sr.team(team_uuid);

ALTER TABLE sr."team_event_feedback" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team_event_feedback" TO sradmin;

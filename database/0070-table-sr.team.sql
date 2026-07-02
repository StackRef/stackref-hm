-- Database:    sr
-- Table:       team
-- Description: Event team details

ALTER TABLE IF EXISTS sr."team" DROP CONSTRAINT IF EXISTS fk_event;
ALTER TABLE IF EXISTS sr."team" DROP CONSTRAINT IF EXISTS fk_team_status;
DROP TABLE IF EXISTS sr."team";

CREATE TABLE IF NOT EXISTS sr."team" (
    team_uuid UUID NOT NULL,
    event_uuid UUID,
    team_status_id INT NOT NULL DEFAULT(1),
    team_details JSONB NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_uuid)
);

ALTER TABLE sr."team" ADD CONSTRAINT fk_team_status
    FOREIGN KEY(team_status_id) 
    REFERENCES sr.team_status(team_status_id);

ALTER TABLE sr."team" ADD CONSTRAINT fk_event
    FOREIGN KEY(event_uuid) 
    REFERENCES sr.event(event_uuid);

INSERT INTO sr."team" (
    team_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."team" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team" TO sradmin;

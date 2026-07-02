-- Database:    sr
-- Table:       participant
-- Description: Event participant mapped to user

ALTER TABLE IF EXISTS sr."participant" DROP CONSTRAINT IF EXISTS fk_event;
ALTER TABLE IF EXISTS sr."participant" DROP CONSTRAINT IF EXISTS fk_user;
DROP TABLE IF EXISTS sr."participant";

CREATE TABLE IF NOT EXISTS sr."participant" (
    participant_uuid UUID NOT NULL,
    user_uuid UUID NOT NULL,
    event_uuid UUID NOT NULL,
    is_active BOOLEAN DEFAULT(false),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (participant_uuid)
);

ALTER TABLE sr."participant" ADD CONSTRAINT fk_event
    FOREIGN KEY(event_uuid) 
    REFERENCES sr.event(event_uuid);

ALTER TABLE sr."participant" ADD CONSTRAINT fk_user
    FOREIGN KEY(user_uuid) 
    REFERENCES sr.user(user_uuid);

INSERT INTO sr."participant" (
    participant_uuid,
    user_uuid,
    event_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."participant" OWNER TO sradmin;
GRANT ALL ON TABLE sr."participant" TO sradmin;

-- Database:    sr
-- Table:       event
-- Description: Event details mapped to organization

ALTER TABLE IF EXISTS sr."event" DROP CONSTRAINT IF EXISTS fk_event_status;
ALTER TABLE IF EXISTS sr."event" DROP CONSTRAINT IF EXISTS fk_organization;
DROP TABLE IF EXISTS sr."event";

CREATE TABLE IF NOT EXISTS sr."event" (
    event_uuid UUID NOT NULL,
    organization_uuid UUID NOT NULL,
    event_status_id INT NOT NULL DEFAULT(1),
    cloud_accounts_enabled BOOLEAN DEFAULT(false),
    event_judging_minutes INT NOT NULL DEFAULT(60),
    ts_event_start TIMESTAMP WITHOUT TIME ZONE,
    ts_event_end TIMESTAMP WITHOUT TIME ZONE,
    event_details JSONB NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (event_uuid)
);

ALTER TABLE sr."event" ADD CONSTRAINT fk_event_status
    FOREIGN KEY(event_status_id) 
    REFERENCES sr.event_status(event_status_id);

ALTER TABLE sr."event" ADD CONSTRAINT fk_organization
    FOREIGN KEY(organization_uuid) 
    REFERENCES sr.organization(organization_uuid);

INSERT INTO sr."event" (
    event_uuid,
    organization_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."event" OWNER TO sradmin;
GRANT ALL ON TABLE sr."event" TO sradmin;

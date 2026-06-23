DROP TABLE IF EXISTS coach."playbooks";

CREATE TABLE IF NOT EXISTS coach."playbooks" (
    playbook_uuid UUID NOT NULL,
    playbook_plays JSONB NULL,
    playbook_status INT4 DEFAULT 100,
    organization_uuid UUID NULL,
    event_uuid UUID,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (playbook_uuid)
);

-- Permissions

ALTER TABLE coach."playbooks" OWNER TO sradmin;
GRANT ALL ON TABLE coach."playbooks" TO sradmin;

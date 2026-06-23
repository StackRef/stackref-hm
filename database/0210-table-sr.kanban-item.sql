-- Database:    sr
-- Table:       kanban_item
-- Description: Team kanban board items

DROP TABLE IF EXISTS sr."kanban_item";

CREATE TABLE IF NOT EXISTS sr."kanban_item" (
    kanban_item_uuid UUID NOT NULL,
    team_uuid UUID NOT NULL,
    kanban_item_status_id INT NOT NULL DEFAULT(1),
    kanban_item_priority INT NOT NULL DEFAULT(1),
    kanban_item_issuer_uuid UUID,
    kanban_item_owner_uuid UUID,
    kanban_item_details JSONB NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (kanban_item_uuid)
);

ALTER TABLE sr."kanban_item" ADD CONSTRAINT fk_kanban_item_status
    FOREIGN KEY(kanban_item_status_id) 
    REFERENCES sr.kanban_item_status(kanban_item_status_id);

ALTER TABLE sr."kanban_item" ADD CONSTRAINT fk_team_member_issuer
    FOREIGN KEY(kanban_item_issuer_uuid) 
    REFERENCES sr.team_member(team_member_uuid);

ALTER TABLE sr."kanban_item" ADD CONSTRAINT fk_team_member_owner
    FOREIGN KEY(kanban_item_owner_uuid) 
    REFERENCES sr.team_member(team_member_uuid);

ALTER TABLE sr."kanban_item" OWNER TO sradmin;
GRANT ALL ON TABLE sr."kanban_item" TO sradmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sr."kanban_item" TO role_api;

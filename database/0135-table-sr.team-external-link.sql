-- Database:    sr
-- Table:       team_external_link
-- Description: Links to external resources for a Team, typically for judging

ALTER TABLE IF EXISTS sr."team_external_link" DROP CONSTRAINT IF EXISTS fk_team;
ALTER TABLE IF EXISTS sr."team_external_link" DROP CONSTRAINT IF EXISTS fk_external_link_type;
DROP TABLE IF EXISTS sr."team_external_link";

CREATE TABLE IF NOT EXISTS sr."team_external_link" (
    team_external_link_uuid UUID NOT NULL,
    team_uuid UUID NOT NULL,
    external_link_type_id INT NOT NULL DEFAULT(1),
    team_external_link_name VARCHAR(50) NULL,
    team_external_link_url VARCHAR(1000) NULL,
    team_private BOOLEAN DEFAULT(true),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_external_link_uuid)
);

ALTER TABLE sr."team_external_link" ADD CONSTRAINT fk_team
    FOREIGN KEY(team_uuid)
    REFERENCES sr.team(team_uuid);

ALTER TABLE sr."team_external_link" ADD CONSTRAINT fk_external_link_type
    FOREIGN KEY(external_link_type_id)
    REFERENCES sr.external_link_type(external_link_type_id);

ALTER TABLE sr."team_external_link" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team_external_link" TO sradmin;

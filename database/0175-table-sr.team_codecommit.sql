-- Database:    sr
-- Table:       team_codecommit
-- Description: Event Team CodeCommit details and credentials

ALTER TABLE IF EXISTS sr."team_codecommit" DROP CONSTRAINT IF EXISTS fk_team;
DROP TABLE IF EXISTS sr."team_codecommit";

CREATE TABLE IF NOT EXISTS sr."team_codecommit" (
    team_uuid UUID NOT NULL,
    team_codecommit_repo_url VARCHAR(255),
    team_codecommit_user VARCHAR(100),
    team_codecommit_password VARCHAR(100),
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_uuid)
);

ALTER TABLE sr."team_codecommit" ADD CONSTRAINT fk_team
    FOREIGN KEY(team_uuid) 
    REFERENCES sr.team(team_uuid);

ALTER TABLE sr."team_codecommit" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team_codecommit" TO sradmin;

-- Database:    sr
-- Table:       team_analysis_result
-- Description: Results from code scanning operations

ALTER TABLE IF EXISTS sr."team_analysis_result" DROP CONSTRAINT IF EXISTS fk_team;
DROP TABLE IF EXISTS sr."team_analysis_result";

CREATE TABLE IF NOT EXISTS sr."team_analysis_result" (
    team_analysis_result_uuid UUID NOT NULL,
    team_uuid UUID NOT NULL DEFAULT UUID('00000000-00000000-00000000-00000000'),
    team_analysis_result_source VARCHAR(50),
    team_analysis_result_json JSONB,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_analysis_result_uuid)
);

ALTER TABLE sr."team_analysis_result" ADD CONSTRAINT fk_team
    FOREIGN KEY(team_uuid)
    REFERENCES sr.team(team_uuid);

ALTER TABLE sr."team_score_item" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team_score_item" TO sradmin;

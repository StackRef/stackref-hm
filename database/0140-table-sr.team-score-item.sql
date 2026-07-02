-- Database:    sr
-- Table:       team_score_item
-- Description: Log of event scoring items for a team

ALTER TABLE IF EXISTS sr."team_score_item" DROP CONSTRAINT IF EXISTS fk_team;
ALTER TABLE IF EXISTS sr."team_score_item" DROP CONSTRAINT IF EXISTS fk_participant;
ALTER TABLE IF EXISTS sr."team_score_item" DROP CONSTRAINT IF EXISTS fk_judging_criterion;
DROP TABLE IF EXISTS sr."team_score_item";

CREATE TABLE IF NOT EXISTS sr."team_score_item" (
    team_score_item_uuid UUID NOT NULL,
    team_uuid UUID NOT NULL DEFAULT UUID('00000000-00000000-00000000-00000000'),
    judge_uuid UUID NOT NULL,
    judging_criterion_uuid UUID NOT NULL DEFAULT UUID('00000000-00000000-00000000-00000000'),
    team_score_item_value NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    team_score_item_details JSONB,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (team_score_item_uuid),
    CONSTRAINT unique_score UNIQUE (team_uuid, judge_uuid, judging_criterion_uuid)
);

ALTER TABLE sr."team_score_item" ADD CONSTRAINT fk_judging_criterion
    FOREIGN KEY(judging_criterion_uuid)
    REFERENCES sr.judging_criterion(judging_criterion_uuid);

ALTER TABLE sr."team_score_item" ADD CONSTRAINT fk_team
    FOREIGN KEY(team_uuid)
    REFERENCES sr.team(team_uuid);

ALTER TABLE sr."team_score_item" ADD CONSTRAINT fk_participant
    FOREIGN KEY(judge_uuid)
    REFERENCES sr.participant(participant_uuid);

ALTER TABLE sr."team_score_item" OWNER TO sradmin;
GRANT ALL ON TABLE sr."team_score_item" TO sradmin;

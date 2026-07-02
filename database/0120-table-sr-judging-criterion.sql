-- Database:    sr
-- Table:       judging_criterion
-- Description: Criterion items (making up criterion) for Event judging/pointing

ALTER TABLE IF EXISTS sr."judging_criterion" DROP CONSTRAINT IF EXISTS fk_organization;
ALTER TABLE IF EXISTS sr."judging_criterion" DROP CONSTRAINT IF EXISTS fk_event;
ALTER TABLE IF EXISTS sr."judging_criterion" DROP CONSTRAINT IF EXISTS fk_judging_criterion_status;
ALTER TABLE IF EXISTS sr."judging_criterion" DROP CONSTRAINT IF EXISTS fk_judging_criterion_category;
DROP TABLE IF EXISTS sr."judging_criterion";

CREATE TABLE IF NOT EXISTS sr."judging_criterion" (
    judging_criterion_uuid UUID NOT NULL,
    organization_uuid UUID NOT NULL,
    event_uuid UUID NOT NULL,
    judging_criterion_status_id INT NOT NULL DEFAULT(1),
    judging_criterion_category_id INT NOT NULL DEFAULT(1),
    criterion_value INTEGER DEFAULT 0,
    criterion_details JSONB NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (judging_criterion_uuid)
);

ALTER TABLE sr."judging_criterion" ADD CONSTRAINT fk_organization
    FOREIGN KEY(organization_uuid) 
    REFERENCES sr.organization(organization_uuid);

ALTER TABLE sr."judging_criterion" ADD CONSTRAINT fk_event
    FOREIGN KEY(event_uuid) 
    REFERENCES sr.event(event_uuid);

ALTER TABLE sr."judging_criterion" ADD CONSTRAINT fk_judging_criterion_status
    FOREIGN KEY(judging_criterion_status_id) 
    REFERENCES sr.judging_criterion_status(judging_criterion_status_id);

ALTER TABLE sr."judging_criterion" ADD CONSTRAINT fk_judging_criterion_category
    FOREIGN KEY(judging_criterion_category_id) 
    REFERENCES sr.judging_criterion_category(judging_criterion_category_id);

INSERT INTO sr."judging_criterion" (
    judging_criterion_uuid,
    organization_uuid,
    event_uuid
)
VALUES (
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000'),
    UUID('00000000-00000000-00000000-00000000')
);

ALTER TABLE sr."judging_criterion" OWNER TO sradmin;
GRANT ALL ON TABLE sr."judging_criterion" TO sradmin;

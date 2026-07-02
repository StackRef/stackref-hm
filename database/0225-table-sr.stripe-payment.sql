-- Database:    sr
-- Table:       stripe_payment
-- Description: Details of a Stripe payment intention and response

DROP TABLE IF EXISTS sr."stripe_payment";

CREATE TABLE IF NOT EXISTS sr."stripe_payment" (
    payment_intent_id VARCHAR(250) NOT NULL,
    payment_intent_status VARCHAR(100) NOT NULL,
    payment_intent_amount NUMERIC(7,2) NOT NULL,
    payment_intent_currency VARCHAR(10),
    organization_uuid UUID,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (payment_intent_id)
);

ALTER TABLE sr."stripe_payment" ADD CONSTRAINT fk_organization
    FOREIGN KEY(organization_uuid) 
    REFERENCES sr.organization(organization_uuid);

ALTER TABLE sr."stripe_payment" OWNER TO sradmin;
GRANT ALL ON TABLE sr."stripe_payment" TO sradmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sr."stripe_payment" TO role_api;

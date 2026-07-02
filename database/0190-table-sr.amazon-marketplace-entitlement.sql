-- Database:    sr
-- Table:       amazon_marketplace_entitlement
-- Description: Details of an Amazon Marketplace entitlement details

DROP TABLE IF EXISTS sr."amazon_marketplace_entitlement";

CREATE TABLE IF NOT EXISTS sr."amazon_marketplace_entitlement" (
    entitlement_uuid UUID NOT NULL,
    organization_uuid UUID,
    entitlement_customer_id VARCHAR(100) NULL,
    entitlement_customer_aws_account_id VARCHAR(100) NULL,
    entitlement_product_code VARCHAR(250) NULL,
    entitlement_dimension VARCHAR(250) NULL,
    entitlement_value INT NOT NULL DEFAULT(0),
    entitlement_value_used INT NOT NULL DEFAULT(0),
    entitlement_expiration_date TIMESTAMP WITHOUT TIME ZONE,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (entitlement_uuid)
);

ALTER TABLE sr."amazon_marketplace_entitlement" ADD CONSTRAINT fk_organization
    FOREIGN KEY(organization_uuid) 
    REFERENCES sr.organization(organization_uuid);

ALTER TABLE sr."amazon_marketplace_entitlement" OWNER TO sradmin;
GRANT ALL ON TABLE sr."amazon_marketplace_entitlement" TO sradmin;

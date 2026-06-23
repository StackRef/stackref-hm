-- Database:    sr
-- Table:       amazon_marketplace_metering
-- Description: Details of Amazon Marketplace entitlement overage metering

DROP TABLE IF EXISTS sr."amazon_marketplace_metering";

CREATE TABLE IF NOT EXISTS sr."amazon_marketplace_metering" (
    marketplace_metering_uuid UUID NOT NULL,
    entitlement_uuid UUID NOT NULL,
    dimension VARCHAR(250) NOT NULL,
    quantity INT NOT NULL DEFAULT(0),
    processed BOOLEAN DEFAULT(false),
    amazon_metering_record_id UUID NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (marketplace_metering_uuid)
);

ALTER TABLE sr."amazon_marketplace_metering" ADD CONSTRAINT fk_amazon_marketplace_entitlement
    FOREIGN KEY(entitlement_uuid) 
    REFERENCES sr.amazon_marketplace_entitlement(entitlement_uuid);

ALTER TABLE sr."amazon_marketplace_metering" OWNER TO sradmin;
GRANT ALL ON TABLE sr."amazon_marketplace_metering" TO sradmin;

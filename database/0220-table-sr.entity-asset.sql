-- Database:    sr
-- Table:       entity_asset
-- Description: Uploaded assets for entities (Organization, Event, Team, etc.) and their CDN location

DROP TABLE IF EXISTS sr."entity_asset";

CREATE TABLE IF NOT EXISTS sr."entity_asset" (
    entity_asset_uuid UUID NOT NULL,
    entity_uuid UUID NOT NULL DEFAULT UUID('00000000-00000000-00000000-00000000'),
    entity_asset_type_id INT NOT NULL DEFAULT(1),
    entity_asset_mime_type VARCHAR(512) NULL,
    entity_asset_filename VARCHAR(512) NULL,
    entity_asset_details JSONB NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (entity_asset_uuid)
);

ALTER TABLE sr."entity_asset" ADD CONSTRAINT fk_entity_asset_type_id
    FOREIGN KEY(entity_asset_type_id) 
    REFERENCES sr.entity_asset_type(entity_asset_type_id);

ALTER TABLE sr."entity_asset" OWNER TO sradmin;
GRANT ALL ON TABLE sr."entity_asset" TO sradmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sr."entity_asset" TO role_api;

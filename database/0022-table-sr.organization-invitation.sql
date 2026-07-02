-- Database:    sr
-- Table:       organization_invitation
-- Description: Invite codes for joining an Organization

DROP TABLE IF EXISTS sr."organization_invitation";

CREATE TABLE IF NOT EXISTS sr."organization_invitation" (
    organization_invitation_uuid UUID NOT NULL,
    organization_uuid UUID NOT NULL,
    invitation_email VARCHAR(100) NULL,
    invitation_code VARCHAR(25) NULL,
    creator_user_uuid UUID NULL,
    claiming_user_uuid UUID NULL,
    organization_invitation_status_id INT NOT NULL DEFAULT(1),
    send_count INT NOT NULL DEFAULT(0),
    ts_claimed TIMESTAMP WITHOUT TIME ZONE NULL, 
    ts_expires TIMESTAMP WITHOUT TIME ZONE NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (organization_invitation_uuid)
);

ALTER TABLE sr."organization_invitation" ADD CONSTRAINT fk_organization_invitation_status
    FOREIGN KEY(organization_invitation_status_id) 
    REFERENCES sr.organization_invitation_status(organization_invitation_status_id);

ALTER TABLE sr."organization_invitation" OWNER TO sradmin;
GRANT ALL ON TABLE sr."organization_invitation" TO sradmin;

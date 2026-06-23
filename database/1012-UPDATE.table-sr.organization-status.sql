-- Database:    sr
-- Table:       organization-status
-- Description: Add new statuses: Archived, Unlimited. Rename Active to Standard.

INSERT INTO sr."organization_status" ( 
    organization_status_name, organization_status_description
) VALUES
    ('Unlimited','Organization has paid Unlimited tier')
;

INSERT INTO sr."organization_status" ( 
    organization_status_id, organization_status_name, organization_status_description
) VALUES
    (999, 'Archived','Organization is archived')
;

UPDATE sr."organization_status"
SET
    organization_status_name = 'Standard',
    organization_status_description = 'Organization has paid Standard tier',
    ts_modified = NOW()
WHERE
    organization_status_name = 'Active'
;

-- Database:    sr
-- Table:       user_role
-- Description: Update and addition of grants

UPDATE
    sr."user_role"
SET
        user_role_grants =
        '{
            "ui": "true",
            "zoom": "true",
            "resources_read": "true",
            "resources_write": "true",
            "organization_read": "true",
            "organization_write": "false",
            "event_read": "true",
            "event_write": "false",
            "team_read": "true",
            "team_write": "true",
            "invitation_read": "false",
            "invitation_write": "false",
            "user_read": "false",
            "user_write": "false",
            "bank_read": "false",
            "bank_write": "false"
        }'
WHERE
        user_role_name = 'Standard';

UPDATE
    sr."user_role"
SET
        user_role_grants =
        '{
            "ui": "true",
            "zoom": "true",
            "resources_read": "true",
            "resources_write": "true",
            "organization_read": "true",
            "organization_write": "false",
            "event_read": "true",
            "event_write": "true",
            "team_read": "true",
            "team_write": "true",
            "invitation_read": "true",
            "invitation_write": "false",
            "user_read": "false",
            "user_write": "false",
            "bank_read": "true",
            "bank_write": "true"
        }'
WHERE
        user_role_name = 'Admin';

UPDATE
    sr."user_role"
SET
        user_role_grants =
        '{
            "ui": "true",
            "zoom": "true",
            "resources_read": "true",
            "resources_write": "true",
            "organization_read": "true",
            "organization_write": "true",
            "event_read": "true",
            "event_write": "true",
            "team_read": "true",
            "team_write": "true",
            "invitation_read": "true",
            "invitation_write": "true",
            "user_read": "false",
            "user_write": "false",
            "bank_read": "true",
            "bank_write": "true"
        }'
WHERE
        user_role_name = 'Owner';

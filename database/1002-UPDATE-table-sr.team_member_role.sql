-- Database:    sr
-- Table:       team_member_role
-- Description: Update and addition of grants

-- Delete old columns
ALTER TABLE sr."team_member_role"
DROP COLUMN grant_team_play,
DROP COLUMN grant_team_management;

-- Create new column
ALTER TABLE sr."team_member_role"
ADD COLUMN team_member_role_grants JSONB NULL;

-- Initialize the new column
UPDATE
    sr."team_member_role"
SET
        team_member_role_grants =
        '{
            "team_play": "true",
            "team_manage": "true"
        }',
        ts_modified = NOW()
WHERE
        team_member_role_name = 'Leader';

UPDATE
    sr."team_member_role"
SET
        team_member_role_grants =
        '{
            "team_play": "true",
            "team_manage": "false"
        }',
        ts_modified = NOW()
WHERE
        team_member_role_name = 'Player';

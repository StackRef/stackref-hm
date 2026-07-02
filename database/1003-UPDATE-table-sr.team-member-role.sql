-- Database:    sr
-- Table:       team_member_role
-- Description: Update grant names

UPDATE
    sr."team_member_role"
SET
    team_member_role_grants =
    '{
        "play": "true",
        "manage": "true"
    }',
    ts_modified = NOW()
WHERE
    team_member_role_name = 'Leader';

UPDATE
    sr."team_member_role"
SET
    team_member_role_grants =
    '{
        "play": "true",
        "manage": "false"
    }',
    ts_modified = NOW()
WHERE
    team_member_role_name = 'Player';

-- Database:    sr
-- Table:       team_member_role
-- Description: Update Leader to Captain (SR-101)

UPDATE
    sr."team_member_role"
SET
    team_member_role_name = 'Captain',
    ts_modified = NOW()
WHERE
    team_member_role_name = 'Leader';

-- Database:    sr
-- Table:       user
-- Description: (SR-122) Adding tags column

ALTER TABLE sr."user"
ADD COLUMN tags JSONB NULL;

-- Database:    sr
-- Table:       participant
-- Description: (SR-122) Adding tags column

ALTER TABLE sr."participant"
ADD COLUMN tags JSONB NULL;

-- Database:    sr
-- Table:       team_member
-- Description: (SR-122) Adding tags column

ALTER TABLE sr."team_member"
ADD COLUMN tags JSONB NULL;

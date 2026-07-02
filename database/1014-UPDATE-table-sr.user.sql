-- Database:    sr
-- Table:       user
-- Description: Add ts_last_login column

ALTER TABLE sr."user"
ADD COLUMN IF NOT EXISTS ts_last_login TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT (NOW() AT TIME ZONE 'utc');

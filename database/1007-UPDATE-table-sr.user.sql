-- Database:    sr
-- Table:       user
-- Description: Add job_title column

-- Create new column
ALTER TABLE sr."user"
ADD COLUMN IF NOT EXISTS job_title VARCHAR(50) NULL;

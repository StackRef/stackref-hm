-- Database:    sr
-- Table:       participant
-- Description: Add is_active column to designate which Event a Participant has active in the UI

ALTER TABLE sr."participant"
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT(false);

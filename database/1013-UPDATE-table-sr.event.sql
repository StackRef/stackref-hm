-- Database:    sr
-- Table:       event
-- Description: Add event_judging_minutes column

ALTER TABLE sr."event"
ADD COLUMN IF NOT EXISTS event_judging_minutes INT NOT NULL DEFAULT(60);

-- Database:    sr
-- Table:       event
-- Description: Add event_type and event_team_form_mode columns

ALTER TABLE IF EXISTS sr."event" DROP CONSTRAINT IF EXISTS fk_event_type;
ALTER TABLE IF EXISTS sr."event" DROP CONSTRAINT IF EXISTS fk_event_team_form_mode;

ALTER TABLE sr."event"
ADD COLUMN IF NOT EXISTS event_type_id INT NOT NULL DEFAULT(1);

ALTER TABLE sr."event"
ADD COLUMN IF NOT EXISTS event_team_form_mode_id INT NOT NULL DEFAULT(1);

ALTER TABLE sr."event" ADD CONSTRAINT fk_event_type
    FOREIGN KEY(event_type_id) 
    REFERENCES sr.event_type(event_type_id);

ALTER TABLE sr."event" ADD CONSTRAINT fk_event_team_form_mode
    FOREIGN KEY(event_team_form_mode_id) 
    REFERENCES sr.event_team_form_mode(event_team_form_mode_id);

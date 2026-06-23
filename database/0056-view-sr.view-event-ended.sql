-- Database:    sr
-- Tables:      event, event_status
-- View:        view_event_ended
-- Description: View for Event ended status

DROP VIEW IF EXISTS sr.view_event_ended;

CREATE VIEW sr.view_event_ended AS
SELECT
    e.event_uuid,
    e.ts_event_start,
    e.ts_event_end,
    e.event_time_elapsed,
    es.event_status_name
FROM
    (
        SELECT
            event_uuid,
            event_status_id,
            ts_event_start,
            ts_event_end,
            ts_event_end + INTERVAL '1 minute' * event_judging_minutes < NOW() AND ts_event_end < NOW() AS is_judging,
            NOW() > ts_event_end AS event_time_elapsed
        FROM
            sr.event
    ) AS e
LEFT JOIN LATERAL (
    SELECT
        es.event_status_name
    FROM
        sr.event_status AS es
    WHERE
        es.event_status_id = e.event_status_id
) AS es ON
TRUE;

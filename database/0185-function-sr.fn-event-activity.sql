-- Database:    sr
-- Tables:      coin_ledger, team_codescan_result, team_score_item, team_event_feedback, team_external_link
-- Function:    fn_event_activity
-- Arguments    p_event_uuid(UUID), p_offset(INTEGER), p_limit(INTEGER)
-- Returns:     Table(event_activity JSON)
-- Description: Returns timeline of various activities related to Event.
--              Allows for offset to support paging.

DROP FUNCTION IF EXISTS sr.fn_event_activity(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION sr.fn_event_activity(
    p_event_uuid UUID,
    p_offset INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 25
) RETURNS TABLE (
    event_activity JSON
)
LANGUAGE plpgsql AS
$BODY$
DECLARE
    total_count INTEGER;
BEGIN
    -- Total count of all items in the database
    SELECT
        COUNT(all_activities)
    INTO
        total_count
    FROM (
        -- event activity
        SELECT
            e.ts_modified AS timestamp
        FROM
            sr.event AS e
        WHERE
            e.event_uuid = UUID(p_event_uuid)
        UNION ALL
        -- coin_ledger activity
        SELECT
            cl.ts_modified AS timestamp
        FROM
            sr.coin_ledger AS cl
        WHERE
            cl.sending_entity_uuid = UUID(p_event_uuid) OR
            cl.receiving_entity_uuid = UUID(p_event_uuid)
        UNION ALL
        -- team_score_item activity
        SELECT
            tsi.ts_modified AS timestamp
        FROM
            sr.team_score_item AS tsi
        LEFT JOIN sr.team AS t ON
            t.team_uuid = tsi.team_uuid
        WHERE
            t.event_uuid = UUID(p_event_uuid)
        UNION ALL
        -- team_external_link activity
        SELECT
            tel.ts_modified AS timestamp
        FROM
            sr.team_external_link AS tel
        LEFT JOIN sr.team AS t ON
            t.team_uuid = tel.team_uuid
        WHERE
            t.event_uuid = UUID(p_event_uuid)
        UNION ALL
        -- team_analysis_result activity
        SELECT
            tar.ts_modified AS timestamp
        FROM
            sr.team_analysis_result AS tar
        LEFT JOIN sr.team AS t ON
            t.team_uuid = tar.team_uuid
        WHERE
            t.event_uuid = UUID(p_event_uuid)
        UNION ALL
        -- team_event_feedback activity
        SELECT
            tef.ts_modified AS timestamp
        FROM
            sr.team_event_feedback AS tef
        LEFT JOIN sr.team AS t ON
            t.team_uuid = tef.team_uuid
        WHERE
            t.event_uuid = UUID(p_event_uuid)
    ) AS all_activities;

    RETURN QUERY(
        SELECT
            json_build_object(
                'event_activity', json_agg(row_to_json(ea)),
                'event_activity_total_count', total_count
            )
        FROM
            (
                -- event activity
                SELECT
                    e.event_uuid AS activity_uuid,
                    e.ts_modified AS timestamp,
                    'event' AS activity_type,
                    json_build_object(
                        'event_status_name', es.event_status_name 
                    )::JSONB AS activity_details
                FROM
                    sr.event e
                LEFT JOIN sr.event_status AS es ON
                    es.event_status_id = e.event_status_id
                WHERE
                    e.event_uuid = UUID(p_event_uuid)
                UNION ALL
                -- coin_ledger activity
                SELECT
                    cl.transaction_uuid AS activity_uuid,
                    cl.ts_modified AS timestamp,
                    'coin_ledger' AS activity_type,
                    json_build_object(
                        'sending_entity_uuid', cl.sending_entity_uuid,
                        'receiving_entity_uuid', cl.receiving_entity_uuid
                    )::JSONB AS activity_details
                FROM
                    sr.coin_ledger AS cl
                WHERE
                    cl.sending_entity_uuid = UUID(p_event_uuid) OR
                    cl.receiving_entity_uuid = UUID(p_event_uuid)
                UNION ALL
                -- team_score_item activity
                SELECT
                    tsi.team_score_item_uuid AS activity_uuid,
                    tsi.ts_modified AS timestamp,
                    'team_score_item' AS activity_type,
                    json_build_object(
                        'team_uuid', tsi.team_uuid,
                        'team_name', t.team_details->'team_name',
                        'judging_criterion_name', jc.criterion_details->'criterion_name',
                        'team_score_item_value', tsi.team_score_item_value
                    )::JSONB AS activity_details
                FROM
                    sr.team_score_item AS tsi
                LEFT JOIN sr.team AS t ON
                    t.team_uuid = tsi.team_uuid
                LEFT JOIN sr.judging_criterion AS jc ON
                    jc.judging_criterion_uuid = tsi.judging_criterion_uuid
                WHERE
                    t.event_uuid = UUID(p_event_uuid)
                UNION ALL
                -- team_external_link activity
                SELECT
                    tel.team_external_link_uuid AS activity_uuid,
                    tel.ts_modified AS timestamp,
                    'team_external_link' AS activity_type,
                    json_build_object(
                        'team_uuid', tel.team_uuid,
                        'team_name', t.team_details->'team_name'
                    )::JSONB AS activity_details
                FROM
                    sr.team_external_link AS tel
                LEFT JOIN sr.team AS t ON
                    t.team_uuid = tel.team_uuid
                WHERE
                    t.event_uuid = UUID(p_event_uuid)
                UNION ALL
                -- team_analysis_result activity
                SELECT
                    tar.team_analysis_result_uuid AS activity_uuid,
                    tar.ts_modified AS timestamp,
                    'team_analysis_result' AS activity_type,
                    json_build_object(
                        'team_uuid', tar.team_uuid,
                        'team_name', t.team_details->'team_name',
                        'team_analysis_result_source', tar.team_analysis_result_source
                    )::JSONB AS activity_details
                FROM
                    sr.team_analysis_result AS tar
                LEFT JOIN sr.team AS t ON
                    t.team_uuid = tar.team_uuid
                WHERE
                    t.event_uuid = UUID(p_event_uuid)
                UNION ALL
                -- team_event_feedback activity
                SELECT
                    tef.team_event_feedback_uuid AS activity_uuid,
                    tef.ts_modified AS timestamp,
                    'team_event_feedback' AS activity_type,
                    json_build_object(
                        'participant_uuid', tef.participant_uuid,
                        'team_uuid', tef.team_uuid,
                        'team_name', t.team_details->'team_name'
                    )::JSONB AS activity_details
                FROM
                    sr.team_event_feedback AS tef
                LEFT JOIN sr.team AS t ON
                    t.team_uuid = tef.team_uuid
                WHERE
                    t.event_uuid = UUID(p_event_uuid)
                ORDER BY
                    timestamp DESC
                OFFSET
                    p_offset
                LIMIT
                    p_limit
            ) AS ea
    );
END;
$BODY$;

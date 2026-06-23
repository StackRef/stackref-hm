-- Database:    sr
-- Tables:      organization, event, team, participant, user
-- Function:    fn_entity_type
-- Arguments:   entity_uuid(UUID)
-- Returns:     Table(entity_type TEXT)
-- Description: Returns table name the bank-based UUID belongs to

DROP FUNCTION IF EXISTS sr.fn_entity_type(UUID);

CREATE OR REPLACE FUNCTION sr.fn_entity_type(
    entity_uuid UUID
) RETURNS TABLE (
    entity_type TEXT
)
LANGUAGE plpgsql AS
$BODY$
    BEGIN

    RETURN QUERY
    SELECT 'organization'
    FROM   sr.organization AS o
    WHERE  o.organization_uuid = UUID(entity_uuid);

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'event'
        FROM   sr.event AS e
        WHERE  e.event_uuid = UUID(entity_uuid);
    END IF;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'team'
        FROM   sr.team AS t
        WHERE  t.team_uuid = UUID(entity_uuid);
    END IF;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'participant'
        FROM   sr.participant AS p
        WHERE  p.participant_uuid = UUID(entity_uuid);
    END IF;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'user'
        FROM   sr.user AS u
        WHERE  u.user_uuid = UUID(entity_uuid);
    END IF;

    END;
$BODY$;

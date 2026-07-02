-- Database:    sr
-- Tables:      organization, event, participant, team, team_member, team_member_role_member, etc.
-- Function:    fn_eject_organization
-- Arguments    organization_uuid(UUID)
-- Returns:     organization_uuid(UUID)
-- Description: Removes an organization and all associated resources, users, etc.

DROP FUNCTION IF EXISTS sr.fn_eject_organization(UUID);

CREATE OR REPLACE FUNCTION sr.fn_eject_organization(
    ou UUID
)
RETURNS UUID AS
$BODY$
    DECLARE
        user_uuids UUID[];
        event_uuids UUID[];
        participant_uuids UUID[];
        team_uuids UUID[];
        team_member_uuids UUID[];
        cloud_account_user_uuids UUID[];
    BEGIN

    IF EXISTS(
        SELECT
            organization_uuid
        FROM
            sr.organization
        WHERE
            organization_uuid = ou
    ) THEN
        -- Get all user_uuid members of organiation_uuid
        SELECT
            array_agg(user_uuid)
        INTO
            user_uuids
        FROM
            sr.user
        WHERE
            organization_uuid = ou;
        
        -- Get all event_uuid entries for organization_uuid
        SELECT
            array_agg(event_uuid)
        INTO
            event_uuids
        FROM
            sr.event
        WHERE
            organization_uuid = ou;
        
        -- Get all participant_uuid entries for event_uuids
        SELECT
            array_agg(participant_uuid)
        INTO
            participant_uuids
        FROM
            sr.participant
        WHERE
            user_uuid = ANY(user_uuids);
        
        -- Get all team_uuid entries for all event_uuids
        SELECT
            array_agg(team_uuid)
        INTO
            team_uuids
        FROM
            sr.team
        WHERE
            event_uuid = ANY(event_uuids);
        
        -- Get all cloud_account_user entries for all user_uuids
        SELECT
            array_agg(cloud_account_user_uuid)
        INTO
            cloud_account_user_uuids
        FROM
            sr.cloud_account_user
        WHERE
            user_uuid = ANY(user_uuids);

        -- Get all team_member_uuid entries for team_uuids
        SELECT
            array_agg(team_member_uuid)
        INTO
            team_member_uuids
        FROM
            sr.team_member
        WHERE
            team_uuid = ANY(team_uuids);
        
        -- Delete all team_member_role_member entries
        DELETE
        FROM
            sr.team_member_role_member
        WHERE
            team_member_uuid = ANY(team_member_uuids);
        
        -- Delete all team_member entries
        DELETE
        FROM
            sr.team_member
        WHERE
            team_member_uuid = ANY(team_member_uuids);
        
        -- Delete all teams_score_item entries for team_uuids
        DELETE
        FROM
            sr.team_score_item
        WHERE
            team_uuid = ANY(team_uuids);
        
        -- Delete all team_event_feedback entries
        DELETE
        FROM
            sr.team_event_feedback
        WHERE
            team_uuid = ANY(team_uuids)
            OR event_uuid = ANY(event_uuids);

        -- Delete all team_external_link entries
        DELETE
        FROM
            sr.team_external_link
        WHERE
            team_uuid = ANY(team_uuids);
        
        -- Delete all coin_ledger entries for team_uuids
        DELETE
        FROM
            sr.coin_ledger
        WHERE
            sending_entity_uuid = ANY(team_uuids)
            OR receiving_entity_uuid = ANY(team_uuids);

        -- Delete all coin_ledger entries for event_uuids
        DELETE
        FROM
            sr.coin_ledger
        WHERE
            sending_entity_uuid = ANY(event_uuids)
            OR receiving_entity_uuid = ANY(event_uuids);

        -- Delete all coin_ledger entries for organization_uuid
        DELETE
        FROM
            sr.coin_ledger
        WHERE
            sending_entity_uuid = ou
            OR receiving_entity_uuid = ou;
        
        -- Delete all team entries for event_uuids
        DELETE
        FROM
            sr.team
        WHERE
            team_uuid = ANY(team_uuids);
        
        -- Delete all participant_role_member entries
        DELETE
        FROM
            sr.participant_role_member
        WHERE
            participant_uuid = ANY(participant_uuids);
        
        -- Delete all participant entries
        DELETE
        FROM
            sr.participant
        WHERE
            participant_uuid = ANY(participant_uuids);
        
        -- Delete all event judging_criterion for organization_uuid
        DELETE
        FROM
            sr.judging_criterion
        WHERE
            organization_uuid = ou;
        
        -- Delete all event entries for organization_uuid
        DELETE
        FROM
            sr.event
        WHERE
            organization_uuid = ou;
        
        -- Delete all cloud_resource entries for team_uuids
        DELETE
        FROM
            sr.cloud_resource
        WHERE
            cloud_account_owner_uuid = ANY(team_uuids);
        
        -- Delete all cloud_account_group_member entries
        DELETE
        FROM 
            sr.cloud_account_group_member
        WHERE
            cloud_account_user_uuid = ANY(cloud_account_user_uuids);

        -- Delete all cloud_account_users
        DELETE
        FROM
            sr.cloud_account_user
        WHERE
            user_uuid = ANY(user_uuids);
        
        -- Delete all user_role_member entries of user_uuids
        DELETE
        FROM
            sr.user_role_member
        WHERE
            user_uuid = ANY(user_uuids);

        -- Delete all user_uuids of organization_uuid
        DELETE
        FROM
            sr.user
        WHERE
            organization_uuid = ou;
        
        -- Delete all organization_invitation entries for organization_uuid
        DELETE
        FROM
            sr.organization_invitation
        WHERE
            organization_uuid = ou;
        
        -- FINALLY: Delete the organization
        DELETE
        FROM
            sr.organization
        WHERE
            organization_uuid = ou;
    
        RETURN ou;
            
        ELSE RAISE EXCEPTION '>> Organization not found';
            
    END IF;
END
$BODY$
LANGUAGE plpgsql;

-- Example:
-- SELECT * FROM sr.fn_eject_organization('54618849-9a1f-4092-9155-d15054c6e0c5');

-- Database:    sr
-- Table:       participant_role
-- Description: Add Free Agent role (SR-127)

INSERT INTO sr."participant_role" ( 
    participant_role_name,
    participant_role_description,
    participant_role_grants
) VALUES
    ('Free Agent','Free agent, up for team recruitment',
        '{
            "manage": false,
            "spectate": true,
            "play": false,
            "judge": false
        }'
    );


-- Add initial role and user for the API components to use

CREATE ROLE role_api;
GRANT USAGE ON SCHEMA sr TO role_api;

CREATE USER sr_api;
GRANT role_api TO sr_api;

GRANT USAGE ON SCHEMA sr TO sr_api;
GRANT USAGE ON SCHEMA sr TO role_api;

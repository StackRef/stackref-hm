-- Grant the sr_api role access to all tables that we did not already grant access to before

GRANT USAGE ON SCHEMA sr TO role_api;

DO $do$ DECLARE 
   _tbl text; 
BEGIN 
   FOR _tbl IN 
      (
         SELECT
            quote_ident(table_schema) || '.' || quote_ident(table_name) 
         FROM
            information_schema.tables 
         WHERE
            table_schema = 'sr'
      )
   LOOP 
      EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ' || _tbl || ' TO role_api'; 
   END LOOP; 
END $do$

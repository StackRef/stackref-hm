-- Database:    sr
-- Table:       coin_balance
-- Description: StackRefCoin balances for entities

ALTER TABLE IF EXISTS sr."coin_balance" DROP CONSTRAINT IF EXISTS fk_coin_ledger;
DROP TABLE IF EXISTS sr."coin_balance";
DROP TYPE IF EXISTS sr.entity_type;

CREATE TYPE entity_type AS ENUM (
    'organization',
    'event',
    'participant',
    'team',
    'team_member',
    'user'
);

CREATE TABLE IF NOT EXISTS sr."coin_balance" (
    entity_uuid UUID NOT NULL,
    entity_type entity_type,
    balance_value NUMERIC(7,2) NOT NULL,
    last_transaction_uuid UUID NOT NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (entity_uuid)
);

ALTER TABLE sr."coin_balance" ADD CONSTRAINT fk_coin_ledger
    FOREIGN KEY(last_transaction_uuid) 
    REFERENCES sr.coin_ledger(transaction_uuid);

ALTER TABLE sr."coin_balance" OWNER TO sradmin;
GRANT ALL ON TABLE sr."coin_balance" TO sradmin;

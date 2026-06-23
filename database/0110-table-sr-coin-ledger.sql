-- Database:    sr
-- Table:       coin_ledger
-- Description: StackRefCoin transaction ledger

ALTER TABLE IF EXISTS sr."coin_ledger" DROP CONSTRAINT IF EXISTS fk_transaction_status;
DROP TABLE IF EXISTS sr."coin_ledger";

CREATE TABLE IF NOT EXISTS sr."coin_ledger" (
    transaction_uuid UUID NOT NULL,
    sending_entity_uuid UUID,
    receiving_entity_uuid UUID,
    transaction_value NUMERIC(7,2) NOT NULL,
    transaction_status_id INT NOT NULL DEFAULT(1),
    transaction_details jsonb NULL,
    ts_created TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    ts_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
    PRIMARY KEY (transaction_uuid)
);

ALTER TABLE sr."coin_ledger" ADD CONSTRAINT fk_transaction_status
    FOREIGN KEY(transaction_status_id) 
    REFERENCES sr.coin_transaction_status(transaction_status_id);

ALTER TABLE sr."coin_ledger" OWNER TO sradmin;
GRANT ALL ON TABLE sr."coin_ledger" TO sradmin;

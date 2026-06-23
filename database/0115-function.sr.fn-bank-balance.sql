-- Database:    sr
-- Tables:      coin_ledger
-- Function:    fn_bank_balance
-- Arguments    entity_uuid(UUID)
-- Returns:     Table(balance_value DOUBLE PRECISION)
-- Description: Returns bank balance of entity_uuid

DROP FUNCTION IF EXISTS sr.fn_bank_balance(UUID);

CREATE OR REPLACE FUNCTION sr.fn_bank_balance(
    entity_uuid UUID
) RETURNS TABLE (
    balance_value DOUBLE PRECISION
)
LANGUAGE plpgsql AS
$BODY$
    BEGIN

    RETURN QUERY(
        SELECT
            (CASE
                WHEN received_transactions.sum - sent_transactions.sum > 0
                THEN (received_transactions.sum - sent_transactions.sum)::DOUBLE PRECISION
                ELSE 0
            END) AS coin_balance
        FROM
            (
                SELECT
                    COALESCE(SUM(transaction_value), 0) AS sum
                FROM
                    sr.coin_ledger
                WHERE 
                    receiving_entity_uuid = UUID(entity_uuid)
                    AND transaction_status_id = 2
            ) AS received_transactions,
            (
                SELECT
                    COALESCE(SUM(transaction_value), 0) AS sum
                FROM
                    sr.coin_ledger
                WHERE 
                    sending_entity_uuid = UUID(entity_uuid)
                    AND transaction_status_id = 2
            ) AS sent_transactions
    );

    END;
$BODY$;

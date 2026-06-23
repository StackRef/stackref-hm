-- Database:    sr
-- Tables:      coin_ledger
-- Function:    fn_bank_transactions
-- Arguments:   entity_uuid(UUID), num_transactions(BIGINT)
-- Returns:     Table(bank_transactions JSON)
-- Description: Returns bank transactions, balance, received/spent cash of entity_uuid

DROP FUNCTION IF EXISTS sr.fn_bank_transactions(UUID, BIGINT);

CREATE OR REPLACE FUNCTION sr.fn_bank_transactions(
    entity_uuid UUID,
    num_transactions BIGINT DEFAULT 1000
) RETURNS TABLE (
    bank_transactions JSON
)
LANGUAGE plpgsql AS
$BODY$
    BEGIN

    RETURN QUERY(
        SELECT
            row_to_json(account)
        FROM
            (
                SELECT
                    transactions,
                    x.bank_balance::DOUBLE PRECISION AS bank_balance,
                    COALESCE(received_cash.sum, 0) AS received_cash,
                    COALESCE(spent_cash.sum, 0) AS spent_cash
                FROM
                    (
                        SELECT
                            json_agg(row_to_json(x)) AS transactions
                        FROM
                            (
                                SELECT
                                    transaction_uuid,
                                    sending_entity_uuid,
                                    receiving_entity_uuid,
                                    transaction_value::DOUBLE PRECISION,
                                    transaction_details,
                                    to_char(ts_modified, 'YYYY-MM-DD HH24:MI:SS') AS ts_modified
                                FROM
                                    sr.coin_ledger
                                WHERE
                                    (
                                        sending_entity_uuid = UUID(entity_uuid) OR
                                        receiving_entity_uuid = UUID(entity_uuid)
                                    )
                                    AND transaction_status_id = 2
                                ORDER BY
                                    ts_modified
                                DESC
                                LIMIT num_transactions
                            ) AS x
                    ) AS transactions,
                    (
                        SELECT
                            balance_value AS bank_balance
                        FROM 
                            sr.fn_bank_balance(entity_uuid)
                    ) AS x,
                    (
                        SELECT
                            COALESCE(SUM(transaction_value), 0) AS sum
                        FROM
                            sr.coin_ledger
                        WHERE 
                            sending_entity_uuid = UUID(entity_uuid)
                            AND receiving_entity_uuid = UUID('00000000-0000-0000-0000-000000000000')
                            AND transaction_status_id = 2
                    ) AS spent_cash,
                    (
                        SELECT
                            COALESCE(SUM(transaction_value), 0) AS sum
                        FROM
                            sr.coin_ledger
                        WHERE 
                            receiving_entity_uuid = UUID(entity_uuid)
                            AND transaction_status_id = 2
                    ) AS received_cash
            ) AS account
    );

    END;
$BODY$;

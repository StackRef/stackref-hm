-- Database:    sr
-- Tables:      coin_ledger
-- Function:    fn_bank_transaction
-- Description: Executes bank transaction and returns sender and receiver balances

DROP FUNCTION IF EXISTS sr.fn_bank_transaction(UUID,UUID,UUID,DOUBLE PRECISION,BIGINT,JSONB);

CREATE OR REPLACE FUNCTION sr.fn_bank_transaction(
    new_transaction_uuid UUID,
    new_sending_entity_uuid UUID,
    new_receiving_entity_uuid UUID,
    new_transaction_value DOUBLE PRECISION,
    new_transaction_status_id BIGINT,
    new_transaction_details JSONB
) RETURNS TABLE (
    bank_balances JSON
)
LANGUAGE plpgsql VOLATILE AS
$BODY$
    BEGIN

    -- Perform the transaction
    INSERT
        INTO
        sr.coin_ledger (
            transaction_uuid,
            sending_entity_uuid,
            receiving_entity_uuid,
            transaction_value,
            transaction_status_id,
            transaction_details
        )
    VALUES (
        UUID(new_transaction_uuid),
        UUID(new_sending_entity_uuid),
        UUID(new_receiving_entity_uuid),
        new_transaction_value,
        new_transaction_status_id,
        JSONB(new_transaction_details)
    );

    -- Return resulting balances
    RETURN QUERY(
        SELECT
            row_to_json(balances) AS bank_balances
        FROM (
            SELECT
                scb.balance_value AS sender_coin_balance,
                rcb.balance_value AS receiver_coin_balance
            FROM
                (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(new_sending_entity_uuid) AS sender_coin_balance
                ) AS scb,
                (
                    SELECT
                        balance_value
                    FROM
                        sr.fn_bank_balance(new_receiving_entity_uuid) AS receiver_coin_balance
                ) AS rcb
        ) AS balances
    );

    END
$BODY$;

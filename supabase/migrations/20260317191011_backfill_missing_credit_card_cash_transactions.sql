/*
  # Backfill missing cash_transactions for received credit card installments

  ## Summary
  Previously, the cash_transactions.category check constraint did not include
  'recebimento_cartao', which caused credit card installment receipts to fail
  silently without creating cash_transaction records.

  This migration backfills the missing cash_transactions for installments that
  were already marked as 'received' but have no corresponding cash_transaction.

  ## Changes
  - INSERT cash_transactions for received credit_card_sale_installments that
    have no matching cash_transaction (idempotent)
  - Only affects records where the related cash_transaction is missing
*/

INSERT INTO cash_transactions (date, type, amount, description, category, related_id, payment_method)
SELECT
  ccsi.received_date AS date,
  'entrada' AS type,
  ccsi.amount AS amount,
  'Recebimento parcela ' || ccsi.installment_number || ' - ' || ccs.client_name || ' (Cartão de Crédito)' AS description,
  'recebimento_cartao' AS category,
  ccs.id AS related_id,
  'cartao_credito' AS payment_method
FROM credit_card_sale_installments ccsi
JOIN credit_card_sales ccs ON ccs.id = ccsi.credit_card_sale_id
WHERE ccsi.status = 'received'
  AND ccsi.received_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM cash_transactions ct
    WHERE ct.related_id = ccs.id
      AND ct.category = 'recebimento_cartao'
      AND ct.description LIKE '%parcela ' || ccsi.installment_number || '%'
  );

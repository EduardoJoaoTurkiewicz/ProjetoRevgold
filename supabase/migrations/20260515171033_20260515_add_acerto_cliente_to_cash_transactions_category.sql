/*
  # Add acerto_cliente category to cash_transactions

  ## Summary
  The AcertoPaymentService inserts cash_transactions with category 'acerto_cliente'
  when processing acerto payments (Dinheiro, PIX, Cartão de Débito, Transferência).
  The existing CHECK constraint did not include this value, causing all such inserts
  to fail silently, meaning no cash entry was ever recorded for acerto payments.

  ## Changes
  1. Drop existing cash_transactions_category_check constraint
  2. Recreate it including 'acerto_cliente' in the allowed values

  ## Notes
  - Non-destructive: no existing data is modified
  - Existing rows with currently-valid categories remain unaffected
*/

ALTER TABLE cash_transactions
  DROP CONSTRAINT IF EXISTS cash_transactions_category_check;

ALTER TABLE cash_transactions
  ADD CONSTRAINT cash_transactions_category_check
    CHECK (category = ANY (ARRAY[
      'venda'::text,
      'divida'::text,
      'adiantamento'::text,
      'salario'::text,
      'comissao'::text,
      'cheque'::text,
      'boleto'::text,
      'recebimento_cartao'::text,
      'acerto_cliente'::text,
      'outro'::text
    ]));

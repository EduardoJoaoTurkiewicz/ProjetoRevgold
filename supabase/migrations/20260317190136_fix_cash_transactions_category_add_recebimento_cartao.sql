/*
  # Fix cash_transactions category constraint

  ## Summary
  The cash_transactions table had a CHECK constraint that only allowed:
  venda, divida, adiantamento, salario, comissao, cheque, boleto, outro

  The credit card service was trying to insert with category 'recebimento_cartao'
  which violated this constraint, silently preventing credit card receipts from
  appearing in the Caixa and Dashboard.

  ## Changes
  1. Drop the existing category check constraint
  2. Recreate it including 'recebimento_cartao' in the allowed values

  ## Notes
  - This is a non-destructive change (no data is lost)
  - Existing rows are unaffected
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
      'outro'::text
    ]));

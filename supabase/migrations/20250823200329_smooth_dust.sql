/*
  # Adicionar campos para gestão de boletos vencidos

  1. Novos Campos
    - `overdue_action` (text) - Ação tomada com o boleto vencido
    - `interest_amount` (numeric) - Valor de juros aplicados
    - `penalty_amount` (numeric) - Valor de multa aplicada
    - `notary_costs` (numeric) - Custos de cartório
    - `final_amount` (numeric) - Valor final pago (calculado)
    - `overdue_notes` (text) - Observações sobre o vencimento

  2. Constraints
    - Verificar valores de ação válidos
    - Garantir que valores sejam não negativos

  3. Security
    - Manter RLS existente
*/

-- Adicionar novos campos para gestão de boletos vencidos
DO $$
BEGIN
  -- Campo para ação tomada com boleto vencido
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'overdue_action'
  ) THEN
    ALTER TABLE boletos ADD COLUMN overdue_action text;
  END IF;

  -- Campo para valor de juros
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'interest_amount'
  ) THEN
    ALTER TABLE boletos ADD COLUMN interest_amount numeric(10,2) DEFAULT 0;
  END IF;

  -- Campo para valor de multa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'penalty_amount'
  ) THEN
    ALTER TABLE boletos ADD COLUMN penalty_amount numeric(10,2) DEFAULT 0;
  END IF;

  -- Campo para custos de cartório
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'notary_costs'
  ) THEN
    ALTER TABLE boletos ADD COLUMN notary_costs numeric(10,2) DEFAULT 0;
  END IF;

  -- Campo para valor final pago
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'final_amount'
  ) THEN
    ALTER TABLE boletos ADD COLUMN final_amount numeric(10,2) DEFAULT 0;
  END IF;

  -- Campo para observações sobre vencimento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'overdue_notes'
  ) THEN
    ALTER TABLE boletos ADD COLUMN overdue_notes text;
  END IF;
END $$;

-- Adicionar constraint para ações válidas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'boletos_overdue_action_check'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT boletos_overdue_action_check 
    CHECK (overdue_action IS NULL OR overdue_action = ANY (ARRAY[
      'pago_com_juros'::text, 
      'pago_com_multa'::text, 
      'pago_integral'::text,
      'protestado'::text,
      'negativado'::text,
      'acordo_realizado'::text,
      'cancelado'::text,
      'perda_total'::text
    ]));
  END IF;
END $$;

-- Adicionar constraints para valores não negativos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'boletos_interest_amount_check'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT boletos_interest_amount_check 
    CHECK (interest_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'boletos_penalty_amount_check'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT boletos_penalty_amount_check 
    CHECK (penalty_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'boletos_notary_costs_check'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT boletos_notary_costs_check 
    CHECK (notary_costs >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'boletos_final_amount_check'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT boletos_final_amount_check 
    CHECK (final_amount >= 0);
  END IF;
END $$;
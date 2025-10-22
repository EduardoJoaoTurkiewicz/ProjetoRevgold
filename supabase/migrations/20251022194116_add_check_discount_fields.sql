/*
  # Adicionar campos para antecipação de cheques

  1. Alterações na tabela `checks`
    - Adicionar campo `discounted_amount` (numeric) - valor real recebido na antecipação
    - Adicionar campo `discount_fee` (numeric) - taxa cobrada pelo banco na antecipação
    - Adicionar campo `is_discounted` (boolean) - indica se o cheque foi antecipado
    
  2. Notas
    - Esses campos permitem rastrear cheques antecipados
    - O campo `discount_date` já existe na tabela
*/

-- Adicionar campo para valor recebido na antecipação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'discounted_amount'
  ) THEN
    ALTER TABLE checks ADD COLUMN discounted_amount numeric DEFAULT NULL;
  END IF;
END $$;

-- Adicionar campo para taxa de antecipação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'discount_fee'
  ) THEN
    ALTER TABLE checks ADD COLUMN discount_fee numeric DEFAULT NULL;
  END IF;
END $$;

-- Adicionar campo booleano para indicar se foi antecipado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'is_discounted'
  ) THEN
    ALTER TABLE checks ADD COLUMN is_discounted boolean DEFAULT false;
  END IF;
END $$;
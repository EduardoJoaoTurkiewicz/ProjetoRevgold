/*
  # Corrigir coluna products na tabela sales

  1. Alterações
    - Alterar coluna `products` de jsonb para text
    - Permitir valores NULL para tornar o campo opcional
    - Definir valor padrão como string vazia

  2. Motivo
    - O campo produtos foi simplificado para aceitar apenas texto
    - Tornar o campo opcional conforme solicitado pelo usuário
*/

-- Alterar a coluna products para text e torná-la opcional
DO $$
BEGIN
  -- Verificar se a coluna existe e tem o tipo correto
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'products' AND data_type = 'jsonb'
  ) THEN
    -- Converter dados existentes de jsonb para text
    UPDATE sales 
    SET products = CASE 
      WHEN products IS NULL THEN ''
      WHEN jsonb_typeof(products) = 'string' THEN products #>> '{}'
      WHEN jsonb_typeof(products) = 'array' THEN products #>> '{}'
      ELSE products::text
    END;
    
    -- Alterar o tipo da coluna
    ALTER TABLE sales ALTER COLUMN products TYPE text USING products::text;
    ALTER TABLE sales ALTER COLUMN products SET DEFAULT '';
    ALTER TABLE sales ALTER COLUMN products DROP NOT NULL;
  END IF;
END $$;

-- Garantir que a coluna aceita valores vazios
UPDATE sales SET products = '' WHERE products IS NULL OR products = 'null';
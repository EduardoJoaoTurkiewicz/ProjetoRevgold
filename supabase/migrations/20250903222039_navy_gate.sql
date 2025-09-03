/*
  # Corrigir problemas na criação de vendas

  1. Verificações e Correções
    - Verificar constraints da tabela sales
    - Corrigir problemas de validação
    - Garantir que campos JSONB aceitem estruturas corretas
    - Corrigir triggers que podem estar causando problemas

  2. Melhorias
    - Relaxar algumas constraints muito restritivas
    - Melhorar tratamento de dados nulos
    - Corrigir função de criação de comissões
*/

-- Primeiro, vamos verificar e corrigir a tabela sales
DO $$
BEGIN
  -- Remover constraint única muito restritiva se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'sales' AND constraint_name = 'unique_sale_constraint'
  ) THEN
    ALTER TABLE sales DROP CONSTRAINT unique_sale_constraint;
  END IF;
  
  -- Remover constraint única duplicada se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'sales' AND constraint_name = 'sales_unique_constraint'
  ) THEN
    ALTER TABLE sales DROP CONSTRAINT sales_unique_constraint;
  END IF;
END $$;

-- Criar uma constraint única mais flexível que permite vendas similares em datas diferentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'sales' AND constraint_name = 'sales_flexible_unique'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_flexible_unique 
    UNIQUE (client, date, total_value, created_at);
  END IF;
END $$;

-- Garantir que a coluna custom_commission_rate tenha um valor padrão
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'custom_commission_rate'
  ) THEN
    ALTER TABLE sales ADD COLUMN custom_commission_rate numeric(5,2) DEFAULT 5.00 NOT NULL;
  ELSE
    -- Atualizar o padrão se a coluna já existir
    ALTER TABLE sales ALTER COLUMN custom_commission_rate SET DEFAULT 5.00;
    ALTER TABLE sales ALTER COLUMN custom_commission_rate SET NOT NULL;
  END IF;
END $$;

-- Corrigir a função de criação de comissões para ser mais robusta
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Só criar comissão se há vendedor e valor > 0
  IF NEW.seller_id IS NOT NULL AND NEW.total_value > 0 THEN
    INSERT INTO employee_commissions (
      employee_id,
      sale_id,
      sale_value,
      commission_rate,
      commission_amount,
      date,
      status
    ) VALUES (
      NEW.seller_id,
      NEW.id,
      NEW.total_value,
      COALESCE(NEW.custom_commission_rate, 5.00),
      (NEW.total_value * COALESCE(NEW.custom_commission_rate, 5.00)) / 100,
      NEW.date,
      'pendente'
    )
    ON CONFLICT (employee_id, sale_id) DO UPDATE SET
      sale_value = EXCLUDED.sale_value,
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount,
      date = EXCLUDED.date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Corrigir a função de transação de caixa para vendas
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Processar métodos de pagamento instantâneo
  IF NEW.payment_methods IS NOT NULL THEN
    DECLARE
      method JSONB;
      method_type TEXT;
      method_amount NUMERIC;
    BEGIN
      FOR method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
      LOOP
        method_type := method->>'type';
        method_amount := (method->>'amount')::NUMERIC;
        
        -- Só criar transação para pagamentos instantâneos
        IF method_type IN ('dinheiro', 'pix', 'cartao_debito') OR 
           (method_type = 'cartao_credito' AND 
            (method->>'installments' IS NULL OR (method->>'installments')::INTEGER <= 1)) THEN
          
          -- Verificar se já existe transação para evitar duplicatas
          IF NOT EXISTS (
            SELECT 1 FROM cash_transactions 
            WHERE related_id = NEW.id 
            AND description LIKE 'Venda%' || NEW.client || '%'
            AND amount = method_amount
            AND type = 'entrada'
          ) THEN
            INSERT INTO cash_transactions (
              date,
              type,
              amount,
              description,
              category,
              related_id,
              payment_method
            ) VALUES (
              NEW.date,
              'entrada',
              method_amount,
              'Venda - ' || NEW.client || ' (' || UPPER(REPLACE(method_type, '_', ' ')) || ')',
              'venda',
              NEW.id,
              method_type
            );
          END IF;
        END IF;
      END LOOP;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o trigger existe e está ativo
DROP TRIGGER IF EXISTS auto_create_commission ON sales;
CREATE TRIGGER auto_create_commission
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION create_commission_for_sale();

DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION handle_sale_cash_transaction();

-- Corrigir possíveis problemas com a tabela employee_commissions
DO $$
BEGIN
  -- Garantir que a constraint única existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'employee_commissions' AND constraint_name = 'employee_commissions_unique_constraint'
  ) THEN
    ALTER TABLE employee_commissions ADD CONSTRAINT employee_commissions_unique_constraint 
    UNIQUE (employee_id, sale_id);
  END IF;
END $$;

-- Verificar e corrigir índices importantes
DO $$
BEGIN
  -- Índice para vendas por cliente e data
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'sales' AND indexname = 'idx_sales_client_date'
  ) THEN
    CREATE INDEX idx_sales_client_date ON sales (client, date);
  END IF;
  
  -- Índice para vendas por vendedor
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'sales' AND indexname = 'idx_sales_seller_date'
  ) THEN
    CREATE INDEX idx_sales_seller_date ON sales (seller_id, date) WHERE seller_id IS NOT NULL;
  END IF;
END $$;

-- Função para limpar dados de vendas problemáticos (se necessário)
CREATE OR REPLACE FUNCTION clean_sales_data()
RETURNS void AS $$
BEGIN
  -- Atualizar vendas sem custom_commission_rate
  UPDATE sales 
  SET custom_commission_rate = 5.00 
  WHERE custom_commission_rate IS NULL;
  
  -- Garantir que payment_methods seja um array válido
  UPDATE sales 
  SET payment_methods = '[]'::jsonb 
  WHERE payment_methods IS NULL OR payment_methods = 'null'::jsonb;
  
  -- Recalcular valores para vendas inconsistentes
  UPDATE sales 
  SET 
    received_amount = COALESCE(
      (SELECT SUM((method->>'amount')::NUMERIC) 
       FROM jsonb_array_elements(payment_methods) AS method
       WHERE method->>'type' IN ('dinheiro', 'pix', 'cartao_debito') OR 
             (method->>'type' = 'cartao_credito' AND 
              (method->>'installments' IS NULL OR (method->>'installments')::INTEGER <= 1))
      ), 0
    ),
    pending_amount = GREATEST(0, total_value - COALESCE(
      (SELECT SUM((method->>'amount')::NUMERIC) 
       FROM jsonb_array_elements(payment_methods) AS method
       WHERE method->>'type' IN ('dinheiro', 'pix', 'cartao_debito') OR 
             (method->>'type' = 'cartao_credito' AND 
              (method->>'installments' IS NULL OR (method->>'installments')::INTEGER <= 1))
      ), 0
    ))
  WHERE payment_methods IS NOT NULL AND payment_methods != '[]'::jsonb;
  
  -- Atualizar status baseado nos valores
  UPDATE sales 
  SET status = CASE 
    WHEN received_amount >= total_value THEN 'pago'
    WHEN received_amount > 0 THEN 'parcial'
    ELSE 'pendente'
  END;
  
  RAISE NOTICE 'Dados de vendas limpos e recalculados com sucesso';
END;
$$ LANGUAGE plpgsql;

-- Executar limpeza dos dados
SELECT clean_sales_data();

-- Função para validar dados de venda antes da inserção
CREATE OR REPLACE FUNCTION validate_sale_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar cliente
  IF NEW.client IS NULL OR TRIM(NEW.client) = '' THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  -- Validar valor total
  IF NEW.total_value IS NULL OR NEW.total_value <= 0 THEN
    RAISE EXCEPTION 'Valor total deve ser maior que zero';
  END IF;
  
  -- Validar payment_methods
  IF NEW.payment_methods IS NULL THEN
    NEW.payment_methods = '[]'::jsonb;
  END IF;
  
  -- Garantir custom_commission_rate
  IF NEW.custom_commission_rate IS NULL THEN
    NEW.custom_commission_rate = 5.00;
  END IF;
  
  -- Limpar campos de texto
  NEW.client = TRIM(NEW.client);
  
  IF NEW.products IS NOT NULL AND TRIM(NEW.products) = '' THEN
    NEW.products = NULL;
  END IF;
  
  IF NEW.observations IS NOT NULL AND TRIM(NEW.observations) = '' THEN
    NEW.observations = NULL;
  END IF;
  
  IF NEW.payment_description IS NOT NULL AND TRIM(NEW.payment_description) = '' THEN
    NEW.payment_description = NULL;
  END IF;
  
  IF NEW.payment_observations IS NOT NULL AND TRIM(NEW.payment_observations) = '' THEN
    NEW.payment_observations = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger de validação
DROP TRIGGER IF EXISTS validate_sale_data_trigger ON sales;
CREATE TRIGGER validate_sale_data_trigger
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION validate_sale_data();

-- Verificar se a função de prevenção de duplicatas existe e está funcionando
CREATE OR REPLACE FUNCTION prevent_duplicate_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar duplicatas baseado em cliente, data, valor e timestamp (mais flexível)
  IF EXISTS (
    SELECT 1 FROM sales 
    WHERE client = NEW.client 
    AND date = NEW.date 
    AND total_value = NEW.total_value
    AND ABS(EXTRACT(EPOCH FROM (created_at - NEW.created_at))) < 5 -- 5 segundos de diferença
    AND id != COALESCE(NEW.id, '')
  ) THEN
    RAISE EXCEPTION 'Venda duplicada detectada. Uma venda similar já foi registrada recentemente.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de prevenção de duplicatas
DROP TRIGGER IF EXISTS prevent_duplicate_sales_trigger ON sales;
CREATE TRIGGER prevent_duplicate_sales_trigger
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_sales();
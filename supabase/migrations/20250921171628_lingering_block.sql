/*
  # RPC para Criação de Vendas com Validação Robusta

  1. Funções Auxiliares
    - `safe_uuid(text)` - Converte texto para UUID ou NULL
    - `safe_numeric(text, numeric)` - Converte texto para numérico com fallback

  2. Função Principal
    - `create_sale(payload jsonb)` - Cria venda com validação completa
    - Validação de UUIDs vazios
    - Conversão automática de strings vazias para NULL
    - Criação automática de cheques e boletos para parcelas

  3. Sistema de Debug
    - Tabela `create_sale_errors` para logs de erro
    - Funções para visualizar e limpar logs
*/

-- ========================================
-- TABELA DE LOGS DE ERRO
-- ========================================
CREATE TABLE IF NOT EXISTS create_sale_errors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payload jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE create_sale_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON create_sale_errors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ========================================
-- FUNÇÃO PARA VALIDAR UUID SEGURAMENTE
-- ========================================
CREATE OR REPLACE FUNCTION safe_uuid(input_text text)
RETURNS uuid AS $$
BEGIN
  -- Retornar NULL para valores vazios ou inválidos
  IF input_text IS NULL OR 
     TRIM(input_text) = '' OR 
     LOWER(TRIM(input_text)) = 'null' OR
     LOWER(TRIM(input_text)) = 'undefined' THEN
    RETURN NULL;
  END IF;
  
  -- Tentar converter para UUID
  BEGIN
    RETURN input_text::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA VALIDAR NUMÉRICO SEGURAMENTE
-- ========================================
CREATE OR REPLACE FUNCTION safe_numeric(input_text text, default_value NUMERIC DEFAULT 0)
RETURNS NUMERIC AS $$
BEGIN
  IF input_text IS NULL OR TRIM(input_text) = '' THEN
    RETURN default_value;
  END IF;
  
  BEGIN
    RETURN input_text::NUMERIC;
  EXCEPTION WHEN OTHERS THEN
    RETURN default_value;
  END;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PRINCIPAL PARA CRIAR VENDAS
-- ========================================
CREATE OR REPLACE FUNCTION create_sale(payload jsonb)
RETURNS uuid AS $$
DECLARE
  sale_id uuid;
  clean_seller_id uuid;
  clean_delivery_date date;
  payment_method jsonb;
  method_type text;
  method_amount numeric;
  method_installments integer;
  method_installment_value numeric;
  method_installment_interval integer;
  installment_date date;
  i integer;
BEGIN
  -- Validar campos obrigatórios
  IF payload->>'client' IS NULL OR TRIM(payload->>'client') = '' THEN
    INSERT INTO create_sale_errors (payload, error_message)
    VALUES (payload, 'Cliente é obrigatório');
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF safe_numeric(payload->>'total_value', 0) <= 0 THEN
    INSERT INTO create_sale_errors (payload, error_message)
    VALUES (payload, 'Valor total deve ser maior que zero');
    RAISE EXCEPTION 'Valor total deve ser maior que zero';
  END IF;
  
  IF payload->'payment_methods' IS NULL OR jsonb_array_length(payload->'payment_methods') = 0 THEN
    INSERT INTO create_sale_errors (payload, error_message)
    VALUES (payload, 'Pelo menos um método de pagamento é obrigatório');
    RAISE EXCEPTION 'Pelo menos um método de pagamento é obrigatório';
  END IF;
  
  -- Limpar e validar UUIDs
  clean_seller_id := safe_uuid(payload->>'seller_id');
  
  -- Validar se vendedor existe
  IF clean_seller_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = clean_seller_id AND is_active = true) THEN
      clean_seller_id := NULL; -- Converter para NULL se vendedor não existe
    END IF;
  END IF;
  
  -- Limpar data de entrega
  BEGIN
    IF payload->>'delivery_date' IS NOT NULL AND TRIM(payload->>'delivery_date') != '' THEN
      clean_delivery_date := (payload->>'delivery_date')::date;
    ELSE
      clean_delivery_date := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    clean_delivery_date := NULL;
  END;
  
  -- Gerar ID da venda
  sale_id := uuid_generate_v4();
  
  -- Inserir a venda
  INSERT INTO sales (
    id,
    date,
    delivery_date,
    client,
    seller_id,
    products,
    observations,
    total_value,
    payment_methods,
    received_amount,
    pending_amount,
    status,
    payment_description,
    payment_observations,
    custom_commission_rate
  ) VALUES (
    sale_id,
    COALESCE((payload->>'date')::date, CURRENT_DATE),
    clean_delivery_date,
    TRIM(payload->>'client'),
    clean_seller_id,
    COALESCE(payload->'products', '[]'::jsonb),
    NULLIF(TRIM(COALESCE(payload->>'observations', '')), ''),
    safe_numeric(payload->>'total_value', 0),
    payload->'payment_methods',
    safe_numeric(payload->>'received_amount', 0),
    safe_numeric(payload->>'pending_amount', 0),
    COALESCE(NULLIF(TRIM(payload->>'status'), ''), 'pendente'),
    NULLIF(TRIM(COALESCE(payload->>'payment_description', '')), ''),
    NULLIF(TRIM(COALESCE(payload->>'payment_observations', '')), ''),
    safe_numeric(payload->>'custom_commission_rate', 5.00)
  );
  
  -- Processar métodos de pagamento para criar cheques e boletos
  FOR payment_method IN SELECT * FROM jsonb_array_elements(payload->'payment_methods')
  LOOP
    method_type := payment_method->>'type';
    method_amount := safe_numeric(payment_method->>'amount', 0);
    method_installments := COALESCE((payment_method->>'installments')::integer, 1);
    method_installment_value := safe_numeric(payment_method->>'installment_value', method_amount / method_installments);
    method_installment_interval := COALESCE((payment_method->>'installment_interval')::integer, 30);
    
    -- Criar cheques para pagamentos parcelados em cheque
    IF method_type = 'cheque' AND method_installments > 1 THEN
      FOR i IN 1..method_installments LOOP
        installment_date := COALESCE((payload->>'date')::date, CURRENT_DATE) + ((i - 1) * method_installment_interval);
        
        INSERT INTO checks (
          sale_id,
          client,
          value,
          due_date,
          status,
          is_own_check,
          installment_number,
          total_installments,
          observations
        ) VALUES (
          sale_id,
          TRIM(payload->>'client'),
          method_installment_value,
          installment_date,
          'pendente',
          false,
          i,
          method_installments,
          NULLIF(TRIM(COALESCE(payment_method->>'observations', '')), '')
        );
      END LOOP;
    END IF;
    
    -- Criar boletos para pagamentos parcelados em boleto
    IF method_type = 'boleto' AND method_installments > 1 THEN
      FOR i IN 1..method_installments LOOP
        installment_date := COALESCE((payload->>'date')::date, CURRENT_DATE) + ((i - 1) * method_installment_interval);
        
        INSERT INTO boletos (
          sale_id,
          client,
          value,
          due_date,
          status,
          installment_number,
          total_installments,
          observations
        ) VALUES (
          sale_id,
          TRIM(payload->>'client'),
          method_installment_value,
          installment_date,
          'pendente',
          i,
          method_installments,
          NULLIF(TRIM(COALESCE(payment_method->>'observations', '')), '')
        );
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN sale_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log do erro para debug
  INSERT INTO create_sale_errors (payload, error_message)
  VALUES (payload, SQLERRM);
  
  -- Re-lançar o erro
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÕES DE DEBUG
-- ========================================
CREATE OR REPLACE FUNCTION get_recent_sale_errors(limit_count integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  payload jsonb,
  error_message text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.payload,
    e.error_message,
    e.created_at
  FROM create_sale_errors e
  ORDER BY e.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_sale_errors(days_old integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM create_sale_errors 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERMISSÕES PARA FUNÇÕES RPC
-- ========================================
GRANT EXECUTE ON FUNCTION safe_uuid(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION safe_numeric(text, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_sale(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recent_sale_errors(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_sale_errors(integer) TO anon, authenticated;
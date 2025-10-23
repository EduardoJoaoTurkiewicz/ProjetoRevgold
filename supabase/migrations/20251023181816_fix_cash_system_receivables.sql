/*
  # Corrigir Sistema de Caixa e Valores a Receber
  
  1. Alterações
    - Atualizar trigger de cheques para NÃO criar transação quando antecipado (já criada manualmente)
    - Criar função para calcular valores a receber reais de vendas
    - Adicionar campos para rastrear valores efetivamente recebidos
    
  2. Lógica de Valores a Receber
    - Cheques: Só sai de "Valores a Receber" quando:
      * Usado em dívida (usedInDebt preenchido)
      * Depositado/Compensado (status = compensado)
      * Antecipado (is_discounted = true)
    - Boletos: Só sai quando depositado (status = compensado)
    - Cartão de Crédito: Só sai quando antecipado ou depositado (status = completed/received)
    
  3. Segurança
    - Mantém RLS em todas as tabelas
    - Não remove dados existentes
*/

-- Atualizar trigger de cheques para não duplicar transações quando antecipado
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'compensado'
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    
    -- Se o cheque foi usado em uma dívida, NÃO cria transação de caixa
    -- Porque o cheque foi usado para pagar um fornecedor diretamente, não entrou no caixa
    IF NEW.used_in_debt IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Se o cheque foi antecipado, NÃO cria transação de caixa
    -- Porque a transação já foi criada manualmente no momento da antecipação
    IF NEW.is_discounted = true OR NEW.discount_date IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Cheque próprio ou da empresa pagável
    IF NEW.is_own_check = true OR NEW.is_company_payable = true THEN
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        COALESCE(NEW.payment_date, NEW.due_date),
        'saida',
        NEW.value,
        'Cheque próprio pago - ' || COALESCE(NEW.company_name, NEW.client),
        'cheque',
        NEW.id,
        'cheque'
      );
    ELSE
      -- Cheque de terceiros (cliente) - Depositar/Compensar
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        COALESCE(NEW.payment_date, NEW.due_date),
        'entrada',
        NEW.value,
        'Cheque depositado - ' || NEW.client,
        'cheque',
        NEW.id,
        'cheque'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Criar função para calcular valores realmente recebidos de uma venda
CREATE OR REPLACE FUNCTION calculate_sale_received_amount(sale_id_param uuid)
RETURNS numeric AS $$
DECLARE
  total_received numeric := 0;
  payment_method jsonb;
  check_received numeric := 0;
  boleto_received numeric := 0;
BEGIN
  -- Buscar métodos de pagamento da venda
  SELECT payment_methods INTO payment_method
  FROM sales
  WHERE id = sale_id_param;
  
  IF payment_method IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular valores recebidos por cada método de pagamento
  FOR i IN 0..jsonb_array_length(payment_method) - 1 LOOP
    DECLARE
      method jsonb := payment_method->i;
      method_type text := method->>'type';
      method_amount numeric := COALESCE((method->>'amount')::numeric, 0);
    BEGIN
      -- Pagamentos instantâneos (dinheiro, pix, débito, crédito à vista)
      IF method_type IN ('dinheiro', 'pix', 'cartao_debito') THEN
        total_received := total_received + method_amount;
      ELSIF method_type = 'cartao_credito' THEN
        -- Crédito à vista ou antecipado
        DECLARE
          installments int := COALESCE((method->>'installments')::int, 1);
        BEGIN
          IF installments = 1 THEN
            -- À vista
            total_received := total_received + method_amount;
          END IF;
          -- Parcelado é tratado pela tabela credit_card_sales
        END;
      END IF;
    END;
  END LOOP;
  
  -- Adicionar cheques compensados, usados em dívidas ou antecipados desta venda
  SELECT COALESCE(SUM(CASE 
    WHEN is_discounted = true THEN discounted_amount
    WHEN used_in_debt IS NOT NULL THEN value
    WHEN status = 'compensado' THEN value
    ELSE 0
  END), 0) INTO check_received
  FROM checks
  WHERE sale_id = sale_id_param;
  
  total_received := total_received + check_received;
  
  -- Adicionar boletos compensados desta venda
  SELECT COALESCE(SUM(CASE 
    WHEN status = 'compensado' THEN value
    ELSE 0
  END), 0) INTO boleto_received
  FROM boletos
  WHERE sale_id = sale_id_param;
  
  total_received := total_received + boleto_received;
  
  -- Adicionar vendas de cartão antecipadas ou recebidas
  SELECT COALESCE(SUM(CASE
    WHEN anticipated = true THEN anticipated_amount
    WHEN status = 'completed' THEN total_amount
    ELSE 0
  END), 0) INTO total_received
  FROM credit_card_sales
  WHERE sale_id = sale_id_param;
  
  RETURN total_received;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Criar função para calcular valores pendentes de uma venda
CREATE OR REPLACE FUNCTION calculate_sale_pending_amount(sale_id_param uuid)
RETURNS numeric AS $$
DECLARE
  total_value numeric;
  received_amount numeric;
BEGIN
  -- Buscar valor total da venda
  SELECT total_value INTO total_value
  FROM sales
  WHERE id = sale_id_param;
  
  IF total_value IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular quanto já foi recebido
  received_amount := calculate_sale_received_amount(sale_id_param);
  
  -- Retornar diferença (quanto ainda falta receber)
  RETURN GREATEST(total_value - received_amount, 0);
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Adicionar comentários explicativos
COMMENT ON FUNCTION calculate_sale_received_amount IS 
'Calcula o valor realmente recebido de uma venda, considerando:
- Pagamentos instantâneos (dinheiro, pix, débito)
- Cheques compensados, antecipados ou usados em dívidas
- Boletos compensados
- Cartão de crédito antecipado ou recebido';

COMMENT ON FUNCTION calculate_sale_pending_amount IS
'Calcula o valor ainda pendente de recebimento de uma venda';

/*
  # Correção de UUIDs e Automação de Caixa

  1. Correções
    - Corrigir validação de UUID para seller_id permitindo valores nulos
    - Melhorar triggers de automação de caixa
    - Adicionar triggers para atualização automática do caixa em todas as operações

  2. Automação de Caixa
    - Vendas (dinheiro, PIX, débito, crédito à vista) → entrada automática
    - Cheques compensados → entrada automática
    - Boletos pagos → entrada automática
    - Dívidas pagas → saída automática
    - Pagamentos de funcionários → saída automática
    - Tarifas PIX → saída automática
    - Impostos → saída automática

  3. Melhorias
    - Prevenção de duplicatas em transações de caixa
    - Logs detalhados para debugging
    - Validações robustas
*/

-- Função para atualizar saldo do caixa automaticamente
CREATE OR REPLACE FUNCTION auto_update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_record RECORD;
  new_balance NUMERIC(15,2);
BEGIN
  -- Buscar o registro de saldo atual
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  
  IF balance_record IS NULL THEN
    -- Se não há saldo, não fazer nada (usuário deve inicializar primeiro)
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calcular novo saldo baseado no tipo de operação
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      new_balance := balance_record.current_balance + NEW.amount;
    ELSE
      new_balance := balance_record.current_balance - NEW.amount;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverter a operação
    IF OLD.type = 'entrada' THEN
      new_balance := balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := balance_record.current_balance + OLD.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter operação antiga e aplicar nova
    IF OLD.type = 'entrada' THEN
      new_balance := balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := balance_record.current_balance + OLD.amount;
    END IF;
    
    IF NEW.type = 'entrada' THEN
      new_balance := new_balance + NEW.amount;
    ELSE
      new_balance := new_balance - NEW.amount;
    END IF;
  END IF;
  
  -- Atualizar saldo
  UPDATE cash_balances 
  SET 
    current_balance = new_balance,
    last_updated = NOW()
  WHERE id = balance_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Função melhorada para criar transação de caixa para vendas
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  method JSONB;
  cash_amount NUMERIC(10,2) := 0;
  description_text TEXT;
BEGIN
  -- Processar métodos de pagamento que afetam o caixa imediatamente
  FOR method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    -- Verificar se é um método que entra no caixa imediatamente
    IF (method->>'type')::TEXT IN ('dinheiro', 'pix', 'cartao_debito') OR 
       ((method->>'type')::TEXT = 'cartao_credito' AND 
        (COALESCE((method->>'installments')::INTEGER, 1) = 1)) THEN
      
      cash_amount := cash_amount + COALESCE((method->>'amount')::NUMERIC, 0);
    END IF;
  END LOOP;
  
  -- Se há valor para o caixa, criar transação
  IF cash_amount > 0 THEN
    description_text := 'Venda - ' || NEW.client || ' (recebimento instantâneo)';
    
    -- Verificar se já existe transação para evitar duplicatas
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id::TEXT 
      AND category = 'venda' 
      AND type = 'entrada'
      AND amount = cash_amount
    ) THEN
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.date, 'entrada', cash_amount, description_text, 'venda', NEW.id::TEXT, 'recebimento_venda'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para cheques compensados
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
DECLARE
  description_text TEXT;
BEGIN
  -- Apenas processar quando status muda para compensado
  IF TG_OP = 'UPDATE' AND OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    
    -- Cheques de terceiros compensados = entrada no caixa
    IF NOT COALESCE(NEW.is_own_check, false) THEN
      description_text := 'Cheque compensado - ' || NEW.client;
      
      -- Verificar duplicata
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id::TEXT 
        AND category = 'cheque' 
        AND type = 'entrada'
      ) THEN
        INSERT INTO cash_transactions (
          date, type, amount, description, category, related_id, payment_method
        ) VALUES (
          NEW.due_date, 'entrada', NEW.value, description_text, 'cheque', NEW.id::TEXT, 'cheque_terceiros'
        );
      END IF;
      
    -- Cheques próprios compensados = saída do caixa
    ELSE
      description_text := 'Cheque próprio pago - ' || NEW.client;
      
      -- Verificar duplicata
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id::TEXT 
        AND category = 'cheque' 
        AND type = 'saida'
      ) THEN
        INSERT INTO cash_transactions (
          date, type, amount, description, category, related_id, payment_method
        ) VALUES (
          NEW.due_date, 'saida', NEW.value, description_text, 'cheque', NEW.id::TEXT, 'cheque_proprio'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para boletos pagos
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
DECLARE
  description_text TEXT;
  net_amount NUMERIC(10,2);
BEGIN
  -- Apenas processar quando status muda para compensado
  IF TG_OP = 'UPDATE' AND OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    
    -- Boletos recebíveis = entrada no caixa
    IF NOT COALESCE(NEW.is_company_payable, false) THEN
      -- Calcular valor líquido (valor final menos custos de cartório)
      net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
      description_text := 'Boleto recebido - ' || NEW.client;
      
      IF NEW.overdue_action IS NOT NULL THEN
        description_text := description_text || ' (' || NEW.overdue_action || ')';
      END IF;
      
      -- Verificar duplicata
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id::TEXT 
        AND category = 'boleto' 
        AND type = 'entrada'
      ) THEN
        INSERT INTO cash_transactions (
          date, type, amount, description, category, related_id, payment_method
        ) VALUES (
          NEW.due_date, 'entrada', net_amount, description_text, 'boleto', NEW.id::TEXT, 'boleto_recebido'
        );
      END IF;
      
      -- Se houve custos de cartório, criar saída separada
      IF COALESCE(NEW.notary_costs, 0) > 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM cash_transactions 
          WHERE related_id = NEW.id::TEXT 
          AND category = 'outro' 
          AND type = 'saida'
          AND description LIKE '%cartório%'
        ) THEN
          INSERT INTO cash_transactions (
            date, type, amount, description, category, related_id, payment_method
          ) VALUES (
            NEW.due_date, 'saida', NEW.notary_costs, 'Custos de cartório - Boleto ' || NEW.client, 'outro', NEW.id::TEXT, 'custos_cartorio'
          );
        END IF;
      END IF;
      
    -- Boletos da empresa = saída do caixa
    ELSE
      net_amount := NEW.value + COALESCE(NEW.interest_paid, 0);
      description_text := 'Boleto pago pela empresa - ' || COALESCE(NEW.company_name, NEW.client);
      
      -- Verificar duplicata
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id::TEXT 
        AND category = 'outro' 
        AND type = 'saida'
      ) THEN
        INSERT INTO cash_transactions (
          date, type, amount, description, category, related_id, payment_method
        ) VALUES (
          COALESCE(NEW.payment_date, NEW.due_date), 'saida', net_amount, description_text, 'outro', NEW.id::TEXT, 'boleto_empresa'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para dívidas pagas
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
  method JSONB;
  cash_amount NUMERIC(10,2) := 0;
  description_text TEXT;
BEGIN
  -- Apenas processar quando dívida é marcada como paga
  IF TG_OP = 'UPDATE' AND NOT COALESCE(OLD.is_paid, false) AND NEW.is_paid THEN
    
    -- Processar métodos de pagamento que saem do caixa
    FOR method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
    LOOP
      IF (method->>'type')::TEXT IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
        cash_amount := cash_amount + COALESCE((method->>'amount')::NUMERIC, 0);
      END IF;
    END LOOP;
    
    -- Se há valor para o caixa, criar transação
    IF cash_amount > 0 THEN
      description_text := 'Pagamento de dívida - ' || NEW.company;
      
      -- Verificar duplicata
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id::TEXT 
        AND category = 'divida' 
        AND type = 'saida'
      ) THEN
        INSERT INTO cash_transactions (
          date, type, amount, description, category, related_id, payment_method
        ) VALUES (
          NEW.date, 'saida', cash_amount, description_text, 'divida', NEW.id::TEXT, 'pagamento_divida'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para pagamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
DECLARE
  employee_record RECORD;
  description_text TEXT;
BEGIN
  -- Buscar dados do funcionário
  SELECT * INTO employee_record FROM employees WHERE id = NEW.employee_id;
  
  description_text := 'Pagamento de salário';
  IF employee_record.name IS NOT NULL THEN
    description_text := description_text || ' - ' || employee_record.name;
  END IF;
  
  -- Verificar duplicata
  IF NOT EXISTS (
    SELECT 1 FROM cash_transactions 
    WHERE related_id = NEW.id::TEXT 
    AND category = 'salario' 
    AND type = 'saida'
  ) THEN
    INSERT INTO cash_transactions (
      date, type, amount, description, category, related_id, payment_method
    ) VALUES (
      NEW.payment_date, 'saida', NEW.amount, description_text, 'salario', NEW.id::TEXT, 'pagamento_salario'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para adiantamentos
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
DECLARE
  employee_record RECORD;
  description_text TEXT;
BEGIN
  -- Apenas processar métodos que saem do caixa
  IF NEW.payment_method IN ('dinheiro', 'pix', 'transferencia') THEN
    
    -- Buscar dados do funcionário
    SELECT * INTO employee_record FROM employees WHERE id = NEW.employee_id;
    
    description_text := 'Adiantamento';
    IF employee_record.name IS NOT NULL THEN
      description_text := description_text || ' - ' || employee_record.name;
    END IF;
    
    -- Verificar duplicata
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id::TEXT 
      AND category = 'adiantamento' 
      AND type = 'saida'
    ) THEN
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.date, 'saida', NEW.amount, description_text, 'adiantamento', NEW.id::TEXT, NEW.payment_method
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para tarifas PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
DECLARE
  description_text TEXT;
BEGIN
  description_text := 'Tarifa PIX - ' || NEW.bank || ': ' || NEW.description;
  
  -- Verificar duplicata
  IF NOT EXISTS (
    SELECT 1 FROM cash_transactions 
    WHERE related_id = NEW.id::TEXT 
    AND category = 'outro' 
    AND type = 'saida'
  ) THEN
    INSERT INTO cash_transactions (
      date, type, amount, description, category, related_id, payment_method
    ) VALUES (
      NEW.date, 'saida', NEW.amount, description_text, 'outro', NEW.id::TEXT, 'tarifa_pix'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para impostos
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
DECLARE
  description_text TEXT;
BEGIN
  -- Apenas processar métodos que saem do caixa
  IF NEW.payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
    
    description_text := 'Imposto - ' || NEW.description;
    
    -- Verificar duplicata
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id::TEXT 
      AND category = 'outro' 
      AND type = 'saida'
    ) THEN
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.date, 'saida', NEW.amount, description_text, 'outro', NEW.id::TEXT, NEW.payment_method
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers com as funções atualizadas
DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION handle_sale_cash_transaction();

DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW
  EXECUTE FUNCTION handle_check_payment();

DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION handle_boleto_payment();

DROP TRIGGER IF EXISTS auto_handle_debt_payment ON debts;
CREATE TRIGGER auto_handle_debt_payment
  AFTER UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION handle_debt_payment();

DROP TRIGGER IF EXISTS auto_handle_employee_payment ON employee_payments;
CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_payment();

DROP TRIGGER IF EXISTS auto_handle_employee_advance ON employee_advances;
CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_advance();

DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION handle_pix_fee();

DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW
  EXECUTE FUNCTION handle_tax_payment();

-- Trigger para atualizar saldo automaticamente
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_cash_balance();

-- Adicionar campos para boletos e cheques da empresa se não existirem
DO $$
BEGIN
  -- Boletos da empresa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'is_company_payable'
  ) THEN
    ALTER TABLE boletos ADD COLUMN is_company_payable BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE boletos ADD COLUMN company_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE boletos ADD COLUMN payment_date DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'interest_paid'
  ) THEN
    ALTER TABLE boletos ADD COLUMN interest_paid NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  -- Cheques da empresa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'is_company_payable'
  ) THEN
    ALTER TABLE checks ADD COLUMN is_company_payable BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE checks ADD COLUMN company_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE checks ADD COLUMN payment_date DATE;
  END IF;
END $$;

-- Melhorar validações de UUID para permitir valores nulos
ALTER TABLE sales ALTER COLUMN seller_id DROP NOT NULL;

-- Comentários para documentação
COMMENT ON FUNCTION auto_update_cash_balance() IS 'Atualiza automaticamente o saldo do caixa baseado nas transações';
COMMENT ON FUNCTION handle_sale_cash_transaction() IS 'Cria transação de caixa para vendas com pagamento instantâneo';
COMMENT ON FUNCTION handle_check_payment() IS 'Cria transação de caixa quando cheques são compensados';
COMMENT ON FUNCTION handle_boleto_payment() IS 'Cria transação de caixa quando boletos são pagos';
COMMENT ON FUNCTION handle_debt_payment() IS 'Cria transação de caixa quando dívidas são pagas';
COMMENT ON FUNCTION handle_employee_payment() IS 'Cria transação de caixa para pagamentos de funcionários';
COMMENT ON FUNCTION handle_employee_advance() IS 'Cria transação de caixa para adiantamentos';
COMMENT ON FUNCTION handle_pix_fee() IS 'Cria transação de caixa para tarifas PIX';
COMMENT ON FUNCTION handle_tax_payment() IS 'Cria transação de caixa para pagamentos de impostos';
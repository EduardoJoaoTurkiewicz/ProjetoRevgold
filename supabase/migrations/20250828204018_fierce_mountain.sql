/*
  # Correção de Problemas Críticos do Sistema

  1. Correções de Triggers e Funções
    - Corrigir função de atualização de saldo do caixa
    - Corrigir triggers para evitar duplicações
    - Implementar sistema automático de caixa

  2. Melhorias de Performance
    - Otimizar índices
    - Corrigir constraints

  3. Sistema de Caixa Automático
    - Atualização automática do saldo
    - Transações automáticas para todas as operações
*/

-- Primeiro, vamos corrigir a função de atualização do saldo do caixa
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance_record RECORD;
  new_balance NUMERIC(15,2);
BEGIN
  -- Buscar o saldo atual
  SELECT * INTO current_balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  
  -- Se não existe saldo inicial, criar um com valor 0
  IF current_balance_record IS NULL THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, NOW());
    
    SELECT * INTO current_balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  END IF;
  
  -- Calcular novo saldo baseado no tipo de operação
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      new_balance := current_balance_record.current_balance + NEW.amount;
    ELSE
      new_balance := current_balance_record.current_balance - NEW.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter a operação antiga
    IF OLD.type = 'entrada' THEN
      new_balance := current_balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := current_balance_record.current_balance + OLD.amount;
    END IF;
    
    -- Aplicar a nova operação
    IF NEW.type = 'entrada' THEN
      new_balance := new_balance + NEW.amount;
    ELSE
      new_balance := new_balance - NEW.amount;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverter a operação deletada
    IF OLD.type = 'entrada' THEN
      new_balance := current_balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := current_balance_record.current_balance + OLD.amount;
    END IF;
  END IF;
  
  -- Atualizar o saldo
  UPDATE cash_balances 
  SET current_balance = new_balance, 
      last_updated = NOW(),
      updated_at = NOW()
  WHERE id = current_balance_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa automaticamente para vendas
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  transaction_amount NUMERIC(10,2);
BEGIN
  -- Processar cada método de pagamento da venda
  FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    -- Verificar se é um método que afeta o caixa imediatamente
    IF (payment_method->>'type')::text IN ('dinheiro', 'pix', 'cartao_debito') OR 
       ((payment_method->>'type')::text = 'cartao_credito' AND 
        (COALESCE((payment_method->>'installments')::integer, 1) = 1)) THEN
      
      transaction_amount := (payment_method->>'amount')::numeric;
      
      -- Criar transação de entrada no caixa
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
        transaction_amount,
        'Venda - ' || NEW.client || ' (' || (payment_method->>'type')::text || ')',
        'venda',
        NEW.id,
        (payment_method->>'type')::text
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para boletos pagos
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
DECLARE
  net_amount NUMERIC(10,2);
BEGIN
  -- Só processar se o status mudou para compensado
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    -- Calcular valor líquido (valor final menos custos de cartório)
    net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
    
    -- Criar transação de entrada no caixa
    INSERT INTO cash_transactions (
      date,
      type,
      amount,
      description,
      category,
      related_id,
      payment_method
    ) VALUES (
      NEW.due_date,
      'entrada',
      net_amount,
      'Boleto pago - ' || NEW.client || 
      CASE WHEN NEW.overdue_action IS NOT NULL THEN ' (' || NEW.overdue_action || ')' ELSE '' END,
      'boleto',
      NEW.id,
      'boleto'
    );
    
    -- Se houve custos de cartório, criar transação de saída separada
    IF COALESCE(NEW.notary_costs, 0) > 0 THEN
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        NEW.due_date,
        'saida',
        NEW.notary_costs,
        'Custos de cartório - Boleto ' || NEW.client,
        'outro',
        NEW.id,
        'outros'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para cheques compensados
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processar se o status mudou para compensado
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    IF NEW.is_own_check = true OR NEW.is_company_payable = true THEN
      -- Cheque próprio ou da empresa = saída de caixa
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        NEW.due_date,
        'saida',
        NEW.value,
        'Cheque próprio pago - ' || NEW.client,
        'cheque',
        NEW.id,
        'cheque'
      );
    ELSE
      -- Cheque de terceiros = entrada de caixa
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        NEW.due_date,
        'entrada',
        NEW.value,
        'Cheque compensado - ' || NEW.client,
        'cheque',
        NEW.id,
        'cheque'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para pagamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa
  INSERT INTO cash_transactions (
    date,
    type,
    amount,
    description,
    category,
    related_id,
    payment_method
  ) VALUES (
    NEW.payment_date,
    'saida',
    NEW.amount,
    'Pagamento de salário - ' || (SELECT name FROM employees WHERE id = NEW.employee_id),
    'salario',
    NEW.id,
    'dinheiro'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para adiantamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa
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
    'saida',
    NEW.amount,
    'Adiantamento - ' || (SELECT name FROM employees WHERE id = NEW.employee_id),
    'adiantamento',
    NEW.id,
    NEW.payment_method
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para impostos
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa
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
    'saida',
    NEW.amount,
    'Imposto - ' || NEW.description,
    'outro',
    NEW.id,
    NEW.payment_method
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para tarifas PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa
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
    'saida',
    NEW.amount,
    'Tarifa PIX - ' || NEW.bank || ': ' || NEW.description,
    'outro',
    NEW.id,
    'pix'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar comissão automaticamente
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
DECLARE
  seller_record RECORD;
  commission_rate NUMERIC(5,2);
  commission_amount NUMERIC(10,2);
BEGIN
  -- Verificar se há vendedor e se é vendedor ativo
  IF NEW.seller_id IS NOT NULL THEN
    SELECT * INTO seller_record FROM employees WHERE id = NEW.seller_id AND is_seller = true AND is_active = true;
    
    IF seller_record IS NOT NULL THEN
      -- Usar taxa personalizada ou padrão de 5%
      commission_rate := COALESCE(NEW.custom_commission_rate, 5.00);
      commission_amount := (NEW.total_value * commission_rate) / 100;
      
      -- Verificar se já existe comissão para esta venda
      IF NOT EXISTS (SELECT 1 FROM employee_commissions WHERE sale_id = NEW.id) THEN
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
          commission_rate,
          commission_amount,
          NEW.date,
          'pendente'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar todos os triggers com as funções corrigidas
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION update_cash_balance();

DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION handle_sale_cash_transaction();

DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW EXECUTE FUNCTION handle_boleto_payment();

DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION handle_check_payment();

DROP TRIGGER IF EXISTS auto_handle_employee_payment ON employee_payments;
CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW EXECUTE FUNCTION handle_employee_payment();

DROP TRIGGER IF EXISTS auto_handle_employee_advance ON employee_advances;
CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW EXECUTE FUNCTION handle_employee_advance();

DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW EXECUTE FUNCTION handle_tax_payment();

DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW EXECUTE FUNCTION handle_pix_fee();

DROP TRIGGER IF EXISTS auto_create_commission ON sales;
CREATE TRIGGER auto_create_commission
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION create_commission_for_sale();

-- Adicionar constraints únicas para evitar duplicações
ALTER TABLE sales DROP CONSTRAINT IF EXISTS unique_sale_constraint;
ALTER TABLE sales ADD CONSTRAINT unique_sale_constraint 
  UNIQUE (client, date, total_value, created_at);

ALTER TABLE debts DROP CONSTRAINT IF EXISTS unique_debt_constraint;
ALTER TABLE debts ADD CONSTRAINT unique_debt_constraint 
  UNIQUE (company, date, total_value, description, created_at);

ALTER TABLE employees DROP CONSTRAINT IF EXISTS unique_employee_constraint;
ALTER TABLE employees ADD CONSTRAINT unique_employee_constraint 
  UNIQUE (name, position, salary, hire_date);

ALTER TABLE boletos DROP CONSTRAINT IF EXISTS unique_boleto_constraint;
ALTER TABLE boletos ADD CONSTRAINT unique_boleto_constraint 
  UNIQUE (client, value, due_date, installment_number, total_installments);

ALTER TABLE checks DROP CONSTRAINT IF EXISTS unique_check_constraint;
ALTER TABLE checks ADD CONSTRAINT unique_check_constraint 
  UNIQUE (client, value, due_date, installment_number, total_installments);

ALTER TABLE employee_commissions DROP CONSTRAINT IF EXISTS unique_commission_constraint;
ALTER TABLE employee_commissions ADD CONSTRAINT unique_commission_constraint 
  UNIQUE (employee_id, sale_id);

-- Corrigir função de processamento de dívidas pagas
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  transaction_amount NUMERIC(10,2);
BEGIN
  -- Só processar se a dívida foi marcada como paga
  IF OLD.is_paid = false AND NEW.is_paid = true THEN
    -- Processar cada método de pagamento da dívida
    FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
    LOOP
      -- Verificar se é um método que afeta o caixa imediatamente
      IF (payment_method->>'type')::text IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
        transaction_amount := (payment_method->>'amount')::numeric;
        
        -- Criar transação de saída no caixa
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
          'saida',
          transaction_amount,
          'Pagamento - ' || NEW.company || ' (' || (payment_method->>'type')::text || ')',
          'divida',
          NEW.id,
          (payment_method->>'type')::text
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para dívidas pagas
DROP TRIGGER IF EXISTS auto_handle_debt_payment ON debts;
CREATE TRIGGER auto_handle_debt_payment
  AFTER UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION handle_debt_payment();

-- Otimizar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date_type ON cash_transactions(date, type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_category ON cash_transactions(category);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_related_id ON cash_transactions(related_id);

-- Garantir que existe pelo menos um registro de saldo de caixa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cash_balances) THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, NOW());
  END IF;
END $$;
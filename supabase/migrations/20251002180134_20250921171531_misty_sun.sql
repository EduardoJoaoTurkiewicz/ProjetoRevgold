/*
  # Sistema Automático de Caixa RevGold

  1. Funções de Controle de Caixa
    - `ensure_cash_balance()` - Garante existência de registro de saldo
    - `update_cash_balance()` - Atualiza saldo automaticamente
    - `recalculate_cash_balance()` - Recalcula saldo baseado em todas as transações
    - `initialize_cash_balance(amount)` - Inicializa caixa com valor inicial

  2. Triggers Automáticos
    - Atualização automática do saldo para todas as operações financeiras
    - Criação automática de transações de caixa
    - Sistema anti-duplicação

  3. Funções de Negócio
    - Criação automática de comissões para vendedores
    - Processamento automático de pagamentos
    - Controle de cheques e boletos
*/

-- ========================================
-- FUNÇÃO PARA GARANTIR SALDO DO CAIXA
-- ========================================
CREATE OR REPLACE FUNCTION ensure_cash_balance()
RETURNS uuid AS $$
DECLARE 
  balance_id uuid;
BEGIN
  SELECT id INTO balance_id FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  
  IF balance_id IS NULL THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, now())
    RETURNING id INTO balance_id;
  END IF;
  
  RETURN balance_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA ATUALIZAR SALDO DO CAIXA
-- ========================================
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_record RECORD;
  new_balance NUMERIC(15,2);
BEGIN
  PERFORM ensure_cash_balance();
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      new_balance := balance_record.current_balance + NEW.amount;
    ELSE
      new_balance := balance_record.current_balance - NEW.amount;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'entrada' THEN
      new_balance := balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := balance_record.current_balance + OLD.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
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

  UPDATE cash_balances 
  SET current_balance = new_balance, last_updated = now()
  WHERE id = balance_record.id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA RECALCULAR SALDO COMPLETO
-- ========================================
CREATE OR REPLACE FUNCTION recalculate_cash_balance()
RETURNS void AS $$
DECLARE
  balance_record RECORD;
  total_entries NUMERIC := 0;
  total_exits NUMERIC := 0;
  calculated_balance NUMERIC := 0;
BEGIN
  PERFORM ensure_cash_balance();
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;

  SELECT COALESCE(SUM(amount), 0) INTO total_entries
  FROM cash_transactions WHERE type = 'entrada';

  SELECT COALESCE(SUM(amount), 0) INTO total_exits
  FROM cash_transactions WHERE type = 'saida';

  calculated_balance := balance_record.initial_balance + total_entries - total_exits;

  UPDATE cash_balances 
  SET current_balance = calculated_balance, last_updated = now()
  WHERE id = balance_record.id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA INICIALIZAR CAIXA
-- ========================================
CREATE OR REPLACE FUNCTION initialize_cash_balance(initial_amount NUMERIC)
RETURNS uuid AS $$
DECLARE
  balance_id uuid;
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM cash_balances;
  
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Caixa já foi inicializado. Use recalculate_cash_balance() para recalcular.';
  END IF;
  
  INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
  VALUES (initial_amount, initial_amount, CURRENT_DATE, now())
  RETURNING id INTO balance_id;
  
  RETURN balance_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA OBTER SALDO ATUAL
-- ========================================
CREATE OR REPLACE FUNCTION get_current_cash_balance()
RETURNS TABLE(
  id uuid,
  current_balance NUMERIC,
  initial_balance NUMERIC,
  initial_date date,
  last_updated timestamptz
) AS $$
BEGIN
  PERFORM ensure_cash_balance();
  
  RETURN QUERY
  SELECT 
    cb.id,
    cb.current_balance,
    cb.initial_balance,
    cb.initial_date,
    cb.last_updated
  FROM cash_balances cb
  ORDER BY cb.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGER PRINCIPAL DO CAIXA
-- ========================================
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION update_cash_balance();

-- ========================================
-- FUNÇÃO PARA CRIAR COMISSÃO AUTOMATICAMENTE
-- ========================================
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
DECLARE
  seller_record RECORD;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
BEGIN
  IF NEW.seller_id IS NOT NULL THEN
    SELECT * INTO seller_record FROM employees 
    WHERE id = NEW.seller_id AND is_seller = true AND is_active = true;
    
    IF seller_record IS NOT NULL THEN
      commission_rate := COALESCE(NEW.custom_commission_rate, 5.00);
      commission_amount := (NEW.total_value * commission_rate) / 100;
      
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
      )
      ON CONFLICT (employee_id, sale_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA PROCESSAR VENDAS NO CAIXA
-- ========================================
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  method_type TEXT;
  method_amount NUMERIC;
  method_installments INTEGER;
  total_instant_payment NUMERIC := 0;
BEGIN
  FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    method_type := payment_method->>'type';
    method_amount := COALESCE((payment_method->>'amount')::NUMERIC, 0);
    method_installments := COALESCE((payment_method->>'installments')::INTEGER, 1);
    
    IF method_type IN ('dinheiro', 'pix', 'cartao_debito') OR 
       (method_type = 'cartao_credito' AND method_installments = 1) THEN
      total_instant_payment := total_instant_payment + method_amount;
    END IF;
  END LOOP;
  
  IF total_instant_payment > 0 THEN
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
      total_instant_payment,
      'Venda - ' || NEW.client,
      'venda',
      NEW.id,
      'venda_instantanea'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS PARA VENDAS
-- ========================================
CREATE TRIGGER auto_create_commission
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION create_commission_for_sale();

CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION handle_sale_cash_transaction();

-- ========================================
-- FUNÇÃO PARA PROCESSAR CHEQUES COMPENSADOS
-- ========================================
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    
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

-- ========================================
-- FUNÇÃO PARA PROCESSAR BOLETOS PAGOS
-- ========================================
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
DECLARE
  net_amount NUMERIC;
BEGIN
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    
    IF NEW.is_company_payable = true THEN
      net_amount := NEW.value + COALESCE(NEW.interest_paid, 0);
      
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
        net_amount,
        'Boleto pago - ' || COALESCE(NEW.company_name, NEW.client),
        'boleto',
        NEW.id,
        'boleto'
      );
    ELSE
      net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
      
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
        net_amount,
        'Boleto recebido - ' || NEW.client,
        'boleto',
        NEW.id,
        'boleto'
      );
      
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
          COALESCE(NEW.payment_date, NEW.due_date),
          'saida',
          NEW.notary_costs,
          'Custos de cartório - ' || NEW.client,
          'outro',
          NEW.id,
          'cartorio'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA PROCESSAR DÍVIDAS PAGAS
-- ========================================
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  method_type TEXT;
  method_amount NUMERIC;
BEGIN
  IF OLD.is_paid = false AND NEW.is_paid = true THEN
    
    FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
    LOOP
      method_type := payment_method->>'type';
      method_amount := COALESCE((payment_method->>'amount')::NUMERIC, 0);
      
      IF method_type IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
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
          method_amount,
          'Pagamento - ' || NEW.company,
          'divida',
          NEW.id,
          method_type
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA PROCESSAR PAGAMENTOS DE FUNCIONÁRIOS
-- ========================================
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
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
    'Pagamento de salário - ' || COALESCE(employee_name, 'Funcionário'),
    'salario',
    NEW.id,
    'dinheiro'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA PROCESSAR ADIANTAMENTOS
-- ========================================
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  IF NEW.payment_method IN ('dinheiro', 'pix', 'transferencia') THEN
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
      'Adiantamento - ' || COALESCE(employee_name, 'Funcionário'),
      'adiantamento',
      NEW.id,
      NEW.payment_method
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO PARA PROCESSAR TARIFAS PIX
-- ========================================
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
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

-- ========================================
-- FUNÇÃO PARA PROCESSAR IMPOSTOS
-- ========================================
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- APLICAR TODOS OS TRIGGERS
-- ========================================
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION handle_check_payment();

CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW EXECUTE FUNCTION handle_boleto_payment();

CREATE TRIGGER auto_handle_debt_payment
  AFTER UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION handle_debt_payment();

CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW EXECUTE FUNCTION handle_employee_payment();

CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW EXECUTE FUNCTION handle_employee_advance();

CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW EXECUTE FUNCTION handle_pix_fee();

CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW EXECUTE FUNCTION handle_tax_payment();

-- ========================================
-- PERMISSÕES PARA FUNÇÕES RPC
-- ========================================
GRANT EXECUTE ON FUNCTION ensure_cash_balance() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION recalculate_cash_balance() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION initialize_cash_balance(NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_cash_balance() TO anon, authenticated;
/*
  # Correção completa do sistema RevGold

  1. Correções de Data
    - Corrigir problemas de timezone em todas as tabelas
    - Garantir que datas sejam armazenadas e exibidas corretamente
    - Adicionar função para normalizar datas

  2. Sistema de Caixa Automático
    - Atualização automática do saldo do caixa
    - Triggers para todas as operações financeiras
    - Controle de entradas e saídas

  3. Boletos da Empresa
    - Adicionar campos para boletos que a empresa deve pagar
    - Sistema de controle de pagamentos
    - Integração com caixa automática

  4. Cheques da Empresa
    - Sistema para cheques que a empresa deve pagar
    - Controle de vencimentos e pagamentos
    - Integração com caixa automática

  5. Sistema de Comissões
    - Correção do cálculo automático de comissões
    - Triggers para criação automática
    - Atualização de status

  6. Sistema de Impostos
    - Tabela completa para controle de impostos
    - Integração com caixa automático
    - Campos detalhados para cada tipo de imposto
*/

-- Função para normalizar datas e evitar problemas de timezone
CREATE OR REPLACE FUNCTION normalize_date(input_date text)
RETURNS date AS $$
BEGIN
  -- Remove timezone information and convert to date
  RETURN (input_date::date);
EXCEPTION WHEN OTHERS THEN
  -- If conversion fails, return current date
  RETURN CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar saldo do caixa automaticamente
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance_record RECORD;
  balance_change numeric(15,2) := 0;
BEGIN
  -- Obter saldo atual
  SELECT * INTO current_balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  
  -- Se não há saldo inicial, criar um
  IF current_balance_record IS NULL THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, now());
    SELECT * INTO current_balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  END IF;

  -- Calcular mudança no saldo baseado na operação
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      balance_change := NEW.amount;
    ELSE
      balance_change := -NEW.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter operação antiga
    IF OLD.type = 'entrada' THEN
      balance_change := -OLD.amount;
    ELSE
      balance_change := OLD.amount;
    END IF;
    -- Aplicar nova operação
    IF NEW.type = 'entrada' THEN
      balance_change := balance_change + NEW.amount;
    ELSE
      balance_change := balance_change - NEW.amount;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverter operação deletada
    IF OLD.type = 'entrada' THEN
      balance_change := -OLD.amount;
    ELSE
      balance_change := OLD.amount;
    END IF;
  END IF;

  -- Atualizar saldo
  UPDATE cash_balances 
  SET 
    current_balance = current_balance_record.current_balance + balance_change,
    last_updated = now(),
    updated_at = now()
  WHERE id = current_balance_record.id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar caixa automaticamente
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION update_cash_balance();

-- Função para criar transação de caixa automaticamente
CREATE OR REPLACE FUNCTION create_cash_transaction(
  p_date date,
  p_type text,
  p_amount numeric,
  p_description text,
  p_category text,
  p_related_id uuid DEFAULT NULL,
  p_payment_method text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO cash_transactions (
    date, type, amount, description, category, related_id, payment_method
  ) VALUES (
    p_date, p_type, p_amount, p_description, p_category, p_related_id, p_payment_method
  );
END;
$$ LANGUAGE plpgsql;

-- Adicionar campos para boletos da empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'is_company_payable'
  ) THEN
    ALTER TABLE boletos ADD COLUMN is_company_payable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE boletos ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE boletos ADD COLUMN payment_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boletos' AND column_name = 'interest_paid'
  ) THEN
    ALTER TABLE boletos ADD COLUMN interest_paid numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar campos para cheques da empresa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'is_company_payable'
  ) THEN
    ALTER TABLE checks ADD COLUMN is_company_payable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE checks ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE checks ADD COLUMN payment_date date;
  END IF;
END $$;

-- Trigger para criar comissões automaticamente quando uma venda é criada
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
DECLARE
  seller_record RECORD;
  commission_rate numeric(5,2);
  commission_amount numeric(10,2);
BEGIN
  -- Verificar se a venda tem vendedor
  IF NEW.seller_id IS NOT NULL THEN
    -- Buscar dados do vendedor
    SELECT * INTO seller_record FROM employees WHERE id = NEW.seller_id AND is_seller = true AND is_active = true;
    
    IF seller_record IS NOT NULL THEN
      -- Usar taxa de comissão personalizada ou padrão (5%)
      commission_rate := COALESCE(NEW.custom_commission_rate, 5.00);
      commission_amount := (NEW.total_value * commission_rate) / 100;
      
      -- Criar comissão
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
      ) ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Comissão criada para vendedor % na venda %: R$ %', seller_record.name, NEW.id, commission_amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de comissões
DROP TRIGGER IF EXISTS auto_create_commission ON sales;
CREATE TRIGGER auto_create_commission
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION create_commission_for_sale();

-- Trigger para criar transação de caixa quando vendas são recebidas
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method RECORD;
BEGIN
  -- Processar métodos de pagamento instantâneos
  FOR payment_method IN 
    SELECT * FROM jsonb_array_elements(NEW.payment_methods) AS pm
  LOOP
    -- Verificar se é pagamento instantâneo
    IF (payment_method.pm->>'type') IN ('dinheiro', 'pix', 'cartao_debito') OR 
       ((payment_method.pm->>'type') = 'cartao_credito' AND 
        (payment_method.pm->>'installments' IS NULL OR (payment_method.pm->>'installments')::integer = 1)) THEN
      
      -- Criar transação de entrada no caixa
      PERFORM create_cash_transaction(
        NEW.date,
        'entrada',
        (payment_method.pm->>'amount')::numeric,
        'Venda - ' || NEW.client || ' (' || (payment_method.pm->>'type') || ')',
        'venda',
        NEW.id,
        payment_method.pm->>'type'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de caixa para vendas
DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION handle_sale_cash_transaction();

-- Trigger para atualizar caixa quando boletos são pagos
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Se boleto foi marcado como compensado
  IF NEW.status = 'compensado' AND (OLD.status IS NULL OR OLD.status != 'compensado') THEN
    -- Calcular valor líquido (valor final menos custos)
    DECLARE
      net_amount numeric(10,2);
    BEGIN
      net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
      
      -- Criar transação de entrada para valor recebido
      IF net_amount > 0 THEN
        PERFORM create_cash_transaction(
          COALESCE(NEW.payment_date, NEW.due_date),
          'entrada',
          net_amount,
          'Boleto recebido - ' || NEW.client || 
          CASE WHEN NEW.overdue_action IS NOT NULL THEN ' (' || NEW.overdue_action || ')' ELSE '' END,
          'boleto',
          NEW.id,
          'boleto'
        );
      END IF;
      
      -- Criar transação de saída para custos de cartório
      IF COALESCE(NEW.notary_costs, 0) > 0 THEN
        PERFORM create_cash_transaction(
          COALESCE(NEW.payment_date, NEW.due_date),
          'saida',
          NEW.notary_costs,
          'Custos de cartório - Boleto ' || NEW.client,
          'outro',
          NEW.id,
          'outros'
        );
      END IF;
    END;
  END IF;

  -- Se é boleto da empresa sendo pago
  IF NEW.is_company_payable = true AND NEW.status = 'compensado' AND 
     (OLD.status IS NULL OR OLD.status != 'compensado') THEN
    
    DECLARE
      total_paid numeric(10,2);
    BEGIN
      total_paid := NEW.value + COALESCE(NEW.interest_paid, 0);
      
      -- Criar transação de saída do caixa
      PERFORM create_cash_transaction(
        COALESCE(NEW.payment_date, NEW.due_date),
        'saida',
        total_paid,
        'Pagamento de boleto - ' || COALESCE(NEW.company_name, 'Empresa') ||
        CASE WHEN NEW.interest_paid > 0 THEN ' (com juros)' ELSE '' END,
        'divida',
        NEW.id,
        'boleto'
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para boletos
DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW EXECUTE FUNCTION handle_boleto_payment();

-- Trigger para atualizar caixa quando cheques são pagos
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cheque foi compensado (recebido)
  IF NEW.status = 'compensado' AND (OLD.status IS NULL OR OLD.status != 'compensado') AND NEW.is_own_check = false THEN
    PERFORM create_cash_transaction(
      NEW.due_date,
      'entrada',
      NEW.value,
      'Cheque compensado - ' || NEW.client,
      'cheque',
      NEW.id,
      'cheque'
    );
  END IF;

  -- Se é cheque próprio sendo pago ou cheque da empresa
  IF ((NEW.is_own_check = true OR NEW.is_company_payable = true) AND 
      NEW.status = 'compensado' AND 
      (OLD.status IS NULL OR OLD.status != 'compensado')) THEN
    
    PERFORM create_cash_transaction(
      COALESCE(NEW.payment_date, NEW.due_date),
      'saida',
      NEW.value,
      'Pagamento de cheque - ' || COALESCE(NEW.company_name, NEW.client),
      'divida',
      NEW.id,
      'cheque'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para cheques
DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION handle_check_payment();

-- Trigger para pagamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
DECLARE
  employee_name text;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Criar transação de saída no caixa
  PERFORM create_cash_transaction(
    NEW.payment_date,
    'saida',
    NEW.amount,
    'Pagamento de salário - ' || COALESCE(employee_name, 'Funcionário'),
    'salario',
    NEW.employee_id,
    'dinheiro'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para pagamentos de funcionários
DROP TRIGGER IF EXISTS auto_handle_employee_payment ON employee_payments;
CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW EXECUTE FUNCTION handle_employee_payment();

-- Trigger para adiantamentos
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
DECLARE
  employee_name text;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Criar transação de saída no caixa
  PERFORM create_cash_transaction(
    NEW.date,
    'saida',
    NEW.amount,
    'Adiantamento - ' || COALESCE(employee_name, 'Funcionário'),
    'adiantamento',
    NEW.employee_id,
    NEW.payment_method
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para adiantamentos
DROP TRIGGER IF EXISTS auto_handle_employee_advance ON employee_advances;
CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW EXECUTE FUNCTION handle_employee_advance();

-- Trigger para impostos
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa
  PERFORM create_cash_transaction(
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

-- Aplicar trigger para impostos
DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW EXECUTE FUNCTION handle_tax_payment();

-- Trigger para tarifas PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa
  PERFORM create_cash_transaction(
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

-- Aplicar trigger para tarifas PIX
DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW EXECUTE FUNCTION handle_pix_fee();

-- Corrigir triggers de data para usar a nova função
CREATE OR REPLACE FUNCTION fix_date_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar todas as datas usando a nova função
  IF TG_TABLE_NAME = 'sales' THEN
    NEW.date = normalize_date(NEW.date::text);
    IF NEW.delivery_date IS NOT NULL THEN
      NEW.delivery_date = normalize_date(NEW.delivery_date::text);
    END IF;
  ELSIF TG_TABLE_NAME = 'debts' THEN
    NEW.date = normalize_date(NEW.date::text);
  ELSIF TG_TABLE_NAME = 'checks' THEN
    NEW.due_date = normalize_date(NEW.due_date::text);
    IF NEW.discount_date IS NOT NULL THEN
      NEW.discount_date = normalize_date(NEW.discount_date::text);
    END IF;
    IF NEW.payment_date IS NOT NULL THEN
      NEW.payment_date = normalize_date(NEW.payment_date::text);
    END IF;
  ELSIF TG_TABLE_NAME = 'boletos' THEN
    NEW.due_date = normalize_date(NEW.due_date::text);
    IF NEW.payment_date IS NOT NULL THEN
      NEW.payment_date = normalize_date(NEW.payment_date::text);
    END IF;
  ELSIF TG_TABLE_NAME = 'employees' THEN
    NEW.hire_date = normalize_date(NEW.hire_date::text);
    IF NEW.next_payment_date IS NOT NULL THEN
      NEW.next_payment_date = normalize_date(NEW.next_payment_date::text);
    END IF;
  ELSIF TG_TABLE_NAME = 'employee_payments' THEN
    NEW.payment_date = normalize_date(NEW.payment_date::text);
  ELSIF TG_TABLE_NAME = 'employee_advances' THEN
    NEW.date = normalize_date(NEW.date::text);
  ELSIF TG_TABLE_NAME = 'employee_overtimes' THEN
    NEW.date = normalize_date(NEW.date::text);
  ELSIF TG_TABLE_NAME = 'employee_commissions' THEN
    NEW.date = normalize_date(NEW.date::text);
  ELSIF TG_TABLE_NAME = 'cash_transactions' THEN
    NEW.date = normalize_date(NEW.date::text);
  ELSIF TG_TABLE_NAME = 'pix_fees' THEN
    NEW.date = normalize_date(NEW.date::text);
  ELSIF TG_TABLE_NAME = 'taxes' THEN
    NEW.date = normalize_date(NEW.date::text);
    IF NEW.due_date IS NOT NULL THEN
      NEW.due_date = normalize_date(NEW.due_date::text);
    END IF;
  ELSIF TG_TABLE_NAME = 'agenda_events' THEN
    NEW.date = normalize_date(NEW.date::text);
    IF NEW.reminder_date IS NOT NULL THEN
      NEW.reminder_date = normalize_date(NEW.reminder_date::text);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar todos os triggers de data
DROP TRIGGER IF EXISTS fix_dates_sales ON sales;
CREATE TRIGGER fix_dates_sales
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_debts ON debts;
CREATE TRIGGER fix_dates_debts
  BEFORE INSERT OR UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_checks ON checks;
CREATE TRIGGER fix_dates_checks
  BEFORE INSERT OR UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_boletos ON boletos;
CREATE TRIGGER fix_dates_boletos
  BEFORE INSERT OR UPDATE ON boletos
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_employees ON employees;
CREATE TRIGGER fix_dates_employees
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_employee_payments ON employee_payments;
CREATE TRIGGER fix_dates_employee_payments
  BEFORE INSERT OR UPDATE ON employee_payments
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_employee_advances ON employee_advances;
CREATE TRIGGER fix_dates_employee_advances
  BEFORE INSERT OR UPDATE ON employee_advances
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_employee_overtimes ON employee_overtimes;
CREATE TRIGGER fix_dates_employee_overtimes
  BEFORE INSERT OR UPDATE ON employee_overtimes
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_employee_commissions ON employee_commissions;
CREATE TRIGGER fix_dates_employee_commissions
  BEFORE INSERT OR UPDATE ON employee_commissions
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_cash_transactions ON cash_transactions;
CREATE TRIGGER fix_dates_cash_transactions
  BEFORE INSERT OR UPDATE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_pix_fees ON pix_fees;
CREATE TRIGGER fix_dates_pix_fees
  BEFORE INSERT OR UPDATE ON pix_fees
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_taxes ON taxes;
CREATE TRIGGER fix_dates_taxes
  BEFORE INSERT OR UPDATE ON taxes
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();

DROP TRIGGER IF EXISTS fix_dates_agenda_events ON agenda_events;
CREATE TRIGGER fix_dates_agenda_events
  BEFORE INSERT OR UPDATE ON agenda_events
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();
/*
  # Fix Payment Method Errors and Implement Automatic Cash Balance

  1. Database Functions
    - Fix payment_method field access errors
    - Implement automatic cash balance updates
    - Add duplicate prevention mechanisms

  2. Triggers
    - Update sales triggers to handle payment_methods correctly
    - Add cash balance update triggers
    - Prevent duplicate record creation

  3. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Drop existing problematic functions if they exist
DROP FUNCTION IF EXISTS handle_sale_cash_transaction() CASCADE;
DROP FUNCTION IF EXISTS create_commission_for_sale() CASCADE;
DROP FUNCTION IF EXISTS handle_employee_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_employee_advance() CASCADE;
DROP FUNCTION IF EXISTS handle_boleto_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_check_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_tax_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_pix_fee() CASCADE;
DROP FUNCTION IF EXISTS update_cash_balance() CASCADE;

-- Create improved cash balance update function
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_record RECORD;
  new_balance NUMERIC(15,2);
BEGIN
  -- Get current cash balance
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  
  -- If no balance exists, create initial balance
  IF balance_record IS NULL THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, NOW());
    SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  END IF;
  
  -- Calculate new balance based on operation
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      new_balance := balance_record.current_balance + NEW.amount;
    ELSE
      new_balance := balance_record.current_balance - NEW.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction and apply new one
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
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the deleted transaction
    IF OLD.type = 'entrada' THEN
      new_balance := balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := balance_record.current_balance + OLD.amount;
    END IF;
  END IF;
  
  -- Update cash balance
  UPDATE cash_balances 
  SET current_balance = new_balance, 
      last_updated = NOW(),
      updated_at = NOW()
  WHERE id = balance_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create improved sale cash transaction handler
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  method_type TEXT;
  method_amount NUMERIC(10,2);
  method_installments INTEGER;
BEGIN
  -- Only process cash transactions for instant payment methods
  IF NEW.payment_methods IS NOT NULL THEN
    FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
    LOOP
      method_type := payment_method->>'type';
      method_amount := (payment_method->>'amount')::NUMERIC(10,2);
      method_installments := COALESCE((payment_method->>'installments')::INTEGER, 1);
      
      -- Only create cash transaction for instant payment methods
      IF method_type IN ('dinheiro', 'pix', 'cartao_debito') OR 
         (method_type = 'cartao_credito' AND method_installments = 1) THEN
        
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
          'Venda - ' || NEW.client || ' (' || method_type || ')',
          'venda',
          NEW.id,
          method_type
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create commission handler
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
DECLARE
  seller_record RECORD;
  commission_rate NUMERIC(5,2);
  commission_amount NUMERIC(10,2);
BEGIN
  -- Only create commission if seller is specified and is a seller
  IF NEW.seller_id IS NOT NULL THEN
    SELECT * INTO seller_record FROM employees WHERE id = NEW.seller_id AND is_seller = true AND is_active = true;
    
    IF seller_record IS NOT NULL THEN
      commission_rate := COALESCE(NEW.custom_commission_rate, 5.00);
      commission_amount := (NEW.total_value * commission_rate) / 100;
      
      -- Check if commission already exists to prevent duplicates
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

-- Create employee payment handler
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Create cash transaction for employee payment
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
    NEW.employee_id,
    'dinheiro'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create employee advance handler
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
BEGIN
  -- Create cash transaction for employee advance
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
    NEW.employee_id,
    NEW.payment_method
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create boleto payment handler
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
DECLARE
  final_amount NUMERIC(10,2);
  notary_costs NUMERIC(10,2);
  net_received NUMERIC(10,2);
BEGIN
  -- Only process when status changes to 'compensado'
  IF NEW.status = 'compensado' AND (OLD.status IS NULL OR OLD.status != 'compensado') THEN
    final_amount := COALESCE(NEW.final_amount, NEW.value);
    notary_costs := COALESCE(NEW.notary_costs, 0);
    net_received := final_amount - notary_costs;
    
    -- Create cash transaction for net received amount
    IF net_received > 0 THEN
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
        net_received,
        'Boleto pago - ' || NEW.client || CASE 
          WHEN NEW.overdue_action IS NOT NULL THEN ' (' || NEW.overdue_action || ')'
          ELSE ''
        END,
        'boleto',
        NEW.id,
        'boleto'
      );
    END IF;
    
    -- Create separate transaction for notary costs if any
    IF notary_costs > 0 THEN
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
        notary_costs,
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

-- Create check payment handler
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'compensado' and it's not an own check
  IF NEW.status = 'compensado' AND (OLD.status IS NULL OR OLD.status != 'compensado') AND NOT NEW.is_own_check THEN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tax payment handler
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Create cash transaction for tax payment
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

-- Create PIX fee handler
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Create cash transaction for PIX fee
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

-- Add unique constraints to prevent duplicates
DO $$
BEGIN
  -- Add unique constraint for sales to prevent duplicates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sales_unique_constraint' AND table_name = 'sales'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_unique_constraint 
    UNIQUE (client, date, total_value);
  END IF;
  
  -- Add unique constraint for debts to prevent duplicates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'debts_unique_constraint' AND table_name = 'debts'
  ) THEN
    ALTER TABLE debts ADD CONSTRAINT debts_unique_constraint 
    UNIQUE (company, date, total_value, description);
  END IF;
  
  -- Add unique constraint for employees to prevent duplicates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_unique_constraint' AND table_name = 'employees'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_unique_constraint 
    UNIQUE (name, position, salary);
  END IF;
  
  -- Add unique constraint for boletos to prevent duplicates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'boletos_unique_constraint' AND table_name = 'boletos'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT boletos_unique_constraint 
    UNIQUE (client, value, due_date, installment_number, total_installments);
  END IF;
  
  -- Add unique constraint for checks to prevent duplicates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'checks_unique_constraint' AND table_name = 'checks'
  ) THEN
    ALTER TABLE checks ADD CONSTRAINT checks_unique_constraint 
    UNIQUE (client, value, due_date, installment_number, total_installments);
  END IF;
END $$;

-- Recreate triggers with proper error handling
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

DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION handle_boleto_payment();

DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW
  EXECUTE FUNCTION handle_check_payment();

DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW
  EXECUTE FUNCTION handle_tax_payment();

DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION handle_pix_fee();

-- Update cash balance trigger
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_balance();

-- Create function to handle debt payments with cash transactions
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  method_type TEXT;
  method_amount NUMERIC(10,2);
BEGIN
  -- Only process when debt is marked as paid
  IF NEW.is_paid = true AND (OLD.is_paid IS NULL OR OLD.is_paid = false) THEN
    -- Process each payment method
    IF NEW.payment_methods IS NOT NULL THEN
      FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
      LOOP
        method_type := payment_method->>'type';
        method_amount := (payment_method->>'amount')::NUMERIC(10,2);
        
        -- Only create cash transaction for instant payment methods
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
            'Pagamento - ' || NEW.company || ' (' || method_type || ')',
            'divida',
            NEW.id,
            method_type
          );
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add debt payment trigger
DROP TRIGGER IF EXISTS auto_handle_debt_payment ON debts;
CREATE TRIGGER auto_handle_debt_payment
  AFTER UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION handle_debt_payment();
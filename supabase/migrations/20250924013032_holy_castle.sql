/*
  # Payment Processing Functions

  This migration creates functions for handling various payment types:
  1. Employee payments and advances
  2. Check and boleto payments
  3. Debt payments
  4. PIX fees and tax payments

  ## Functions Created
  - handle_employee_payment
  - handle_employee_advance
  - handle_check_payment
  - handle_boleto_payment
  - handle_debt_payment
  - handle_pix_fee
  - handle_tax_payment
*/

-- Function to handle employee payments
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
    NEW.id,
    'salario'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee payments
CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW EXECUTE FUNCTION handle_employee_payment();

-- Function to handle employee advances
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
    NEW.id,
    NEW.payment_method
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee advances
CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW EXECUTE FUNCTION handle_employee_advance();

-- Function to handle check payments
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'compensado'
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    -- Create cash transaction for check compensation
    INSERT INTO cash_transactions (
      date,
      type,
      amount,
      description,
      category,
      related_id,
      payment_method
    ) VALUES (
      COALESCE(NEW.payment_date, CURRENT_DATE),
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

-- Create trigger for check payments
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION handle_check_payment();

-- Function to handle boleto payments
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'compensado'
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    -- Create cash transaction for boleto payment
    INSERT INTO cash_transactions (
      date,
      type,
      amount,
      description,
      category,
      related_id,
      payment_method
    ) VALUES (
      COALESCE(NEW.payment_date, CURRENT_DATE),
      'entrada',
      NEW.value + COALESCE(NEW.interest_paid, 0),
      'Boleto recebido - ' || NEW.client,
      'boleto',
      NEW.id,
      'boleto'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for boleto payments
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW EXECUTE FUNCTION handle_boleto_payment();

-- Function to handle debt payments
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_method jsonb;
  cash_amount numeric := 0;
BEGIN
  -- Only process when paid_amount increases
  IF NEW.paid_amount > OLD.paid_amount THEN
    -- Process payment methods to find cash amounts
    FOR payment_method IN SELECT jsonb_array_elements(NEW.payment_methods)
    LOOP
      IF (payment_method->>'method') IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito') THEN
        cash_amount := cash_amount + COALESCE((payment_method->>'amount')::numeric, 0);
      END IF;
    END LOOP;
    
    -- Create cash transaction if there's cash amount
    IF cash_amount > 0 THEN
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
        NEW.paid_amount - OLD.paid_amount,
        'Pagamento de dívida - ' || NEW.company,
        'divida',
        NEW.id,
        'divida'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for debt payments
CREATE TRIGGER auto_handle_debt_payment
  AFTER UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION handle_debt_payment();

-- Function to handle PIX fees
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
    'Taxa PIX - ' || NEW.description,
    'outro',
    NEW.id,
    'pix'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for PIX fees
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW EXECUTE FUNCTION handle_pix_fee();

-- Function to handle tax payments
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

-- Create trigger for tax payments
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW EXECUTE FUNCTION handle_tax_payment();
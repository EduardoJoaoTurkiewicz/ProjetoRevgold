/*
  # Fix UUID = text operator error in database triggers

  1. Problem
    - PostgreSQL triggers are failing with "operator does not exist: uuid = text"
    - This happens when comparing UUID columns with text values without explicit casting
    - Affects sales creation and commission generation

  2. Solution
    - Update trigger functions to use proper type casting
    - Ensure all UUID comparisons use explicit casting (::uuid or ::text)
    - Fix the create_commission_for_sale function and related triggers

  3. Changes
    - Recreate trigger functions with proper type casting
    - Update any functions that compare UUID and text types
    - Ensure data integrity is maintained
*/

-- Drop existing trigger functions that might have type issues
DROP FUNCTION IF EXISTS create_commission_for_sale() CASCADE;
DROP FUNCTION IF EXISTS handle_employee_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_employee_advance() CASCADE;

-- Recreate the commission creation function with proper type casting
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create commission if seller_id is not null and employee exists
  IF NEW.seller_id IS NOT NULL THEN
    -- Check if employee exists and is a seller (with explicit UUID casting)
    IF EXISTS (
      SELECT 1 FROM employees 
      WHERE id = NEW.seller_id::uuid 
      AND is_seller = true 
      AND is_active = true
    ) THEN
      -- Insert commission record
      INSERT INTO employee_commissions (
        employee_id,
        sale_id,
        sale_value,
        commission_rate,
        commission_amount,
        date,
        status
      ) VALUES (
        NEW.seller_id::uuid,
        NEW.id,
        NEW.total_value,
        COALESCE(NEW.custom_commission_rate, 5.00),
        (NEW.total_value * COALESCE(NEW.custom_commission_rate, 5.00)) / 100,
        NEW.date,
        'pendente'
      )
      ON CONFLICT (employee_id, sale_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the employee payment handler with proper type casting
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
    'Pagamento de salário - ' || (
      SELECT name FROM employees WHERE id = NEW.employee_id::uuid
    ),
    'salario',
    NEW.id,
    'pagamento_funcionario'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the employee advance handler with proper type casting
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
    'Adiantamento - ' || (
      SELECT name FROM employees WHERE id = NEW.employee_id::uuid
    ),
    'adiantamento',
    NEW.id,
    NEW.payment_method
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate all triggers
CREATE TRIGGER auto_create_commission
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION create_commission_for_sale();

CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_payment();

CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_advance();
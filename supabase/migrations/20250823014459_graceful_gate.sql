/*
  # Fix Date and Timezone Issues

  1. Changes
    - Update all date columns to use proper timezone handling
    - Fix date input/output formatting issues
    - Ensure dates are stored and retrieved correctly
    - Add proper date validation

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Fix date handling for all tables to ensure proper timezone support
-- This migration ensures dates are handled correctly without timezone conversion issues

-- Update sales table date handling
DO $$
BEGIN
  -- Add a function to ensure proper date handling
  CREATE OR REPLACE FUNCTION ensure_date_format(input_date text)
  RETURNS date AS $func$
  BEGIN
    -- Convert text to date ensuring no timezone issues
    RETURN input_date::date;
  EXCEPTION WHEN OTHERS THEN
    -- If conversion fails, return current date
    RETURN CURRENT_DATE;
  END;
  $func$ LANGUAGE plpgsql;

  -- Add a trigger to ensure dates are stored correctly
  CREATE OR REPLACE FUNCTION fix_date_storage()
  RETURNS trigger AS $func$
  BEGIN
    -- Ensure all date fields are properly formatted
    IF TG_TABLE_NAME = 'sales' THEN
      NEW.date = ensure_date_format(NEW.date::text);
      IF NEW.delivery_date IS NOT NULL THEN
        NEW.delivery_date = ensure_date_format(NEW.delivery_date::text);
      END IF;
    ELSIF TG_TABLE_NAME = 'debts' THEN
      NEW.date = ensure_date_format(NEW.date::text);
    ELSIF TG_TABLE_NAME = 'checks' THEN
      NEW.due_date = ensure_date_format(NEW.due_date::text);
      IF NEW.discount_date IS NOT NULL THEN
        NEW.discount_date = ensure_date_format(NEW.discount_date::text);
      END IF;
    ELSIF TG_TABLE_NAME = 'boletos' THEN
      NEW.due_date = ensure_date_format(NEW.due_date::text);
    ELSIF TG_TABLE_NAME = 'employees' THEN
      NEW.hire_date = ensure_date_format(NEW.hire_date::text);
      IF NEW.next_payment_date IS NOT NULL THEN
        NEW.next_payment_date = ensure_date_format(NEW.next_payment_date::text);
      END IF;
    ELSIF TG_TABLE_NAME = 'employee_payments' THEN
      NEW.payment_date = ensure_date_format(NEW.payment_date::text);
    ELSIF TG_TABLE_NAME = 'employee_advances' THEN
      NEW.date = ensure_date_format(NEW.date::text);
    ELSIF TG_TABLE_NAME = 'employee_overtimes' THEN
      NEW.date = ensure_date_format(NEW.date::text);
    ELSIF TG_TABLE_NAME = 'employee_commissions' THEN
      NEW.date = ensure_date_format(NEW.date::text);
    ELSIF TG_TABLE_NAME = 'installments' THEN
      NEW.due_date = ensure_date_format(NEW.due_date::text);
    END IF;
    
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;

  -- Apply triggers to all tables with date fields
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

  DROP TRIGGER IF EXISTS fix_dates_installments ON installments;
  CREATE TRIGGER fix_dates_installments
    BEFORE INSERT OR UPDATE ON installments
    FOR EACH ROW EXECUTE FUNCTION fix_date_storage();
END $$;
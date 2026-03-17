/*
  # Fix commission trigger to be robust with error handling

  ## Summary
  The create_commission_for_sale trigger function was silently failing
  in some execution contexts (e.g., within the create_sale RPC transaction).
  This caused employee_commissions to remain empty despite sales having sellers.

  ## Changes
  1. Recreate create_commission_for_sale() with:
     - SECURITY DEFINER so it runs with postgres privileges
     - Explicit EXCEPTION block to log errors
     - Uses FOUND check instead of IS NOT NULL check
  2. Add a backfill: create commission records for existing sales that have
     a seller_id but no commission record yet
*/

CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  seller_is_valid BOOLEAN;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
BEGIN
  IF NEW.seller_id IS NOT NULL THEN
    SELECT (is_seller = true AND is_active = true) INTO seller_is_valid
    FROM employees
    WHERE id = NEW.seller_id;

    IF FOUND AND seller_is_valid = true THEN
      commission_rate := COALESCE(NEW.custom_commission_rate, 5.00);
      commission_amount := (NEW.total_value * commission_rate) / 100;

      BEGIN
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
      EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the sale insert
        RAISE WARNING 'Commission insert failed for sale %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate UPDATE trigger to recalculate commissions on sale edit
CREATE OR REPLACE FUNCTION update_commission_for_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  seller_is_valid BOOLEAN;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Only act if seller, value, or commission rate changed
  IF (OLD.seller_id IS DISTINCT FROM NEW.seller_id)
    OR (OLD.total_value IS DISTINCT FROM NEW.total_value)
    OR (OLD.custom_commission_rate IS DISTINCT FROM NEW.custom_commission_rate) THEN

    -- Remove old commission if seller changed or sale deleted
    IF OLD.seller_id IS NOT NULL THEN
      DELETE FROM employee_commissions
      WHERE sale_id = NEW.id AND employee_id = OLD.seller_id;
    END IF;

    -- Create new commission if new seller exists
    IF NEW.seller_id IS NOT NULL THEN
      SELECT (is_seller = true AND is_active = true) INTO seller_is_valid
      FROM employees
      WHERE id = NEW.seller_id;

      IF FOUND AND seller_is_valid = true THEN
        commission_rate := COALESCE(NEW.custom_commission_rate, 5.00);
        commission_amount := (NEW.total_value * commission_rate) / 100;

        BEGIN
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
          ON CONFLICT (employee_id, sale_id) DO UPDATE SET
            sale_value = EXCLUDED.sale_value,
            commission_rate = EXCLUDED.commission_rate,
            commission_amount = EXCLUDED.commission_amount,
            date = EXCLUDED.date,
            updated_at = now();
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Commission update failed for sale %: %', NEW.id, SQLERRM;
        END;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old UPDATE trigger if any, add new one
DROP TRIGGER IF EXISTS auto_update_commission ON sales;

CREATE TRIGGER auto_update_commission
  AFTER UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_for_sale();

-- Backfill: create commission records for existing sales missing them
INSERT INTO employee_commissions (
  employee_id,
  sale_id,
  sale_value,
  commission_rate,
  commission_amount,
  date,
  status
)
SELECT
  s.seller_id,
  s.id,
  s.total_value,
  COALESCE(s.custom_commission_rate, 5.00),
  (s.total_value * COALESCE(s.custom_commission_rate, 5.00)) / 100,
  s.date,
  'pendente'
FROM sales s
JOIN employees e ON e.id = s.seller_id
WHERE s.seller_id IS NOT NULL
  AND e.is_seller = true
  AND e.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM employee_commissions ec
    WHERE ec.sale_id = s.id AND ec.employee_id = s.seller_id
  )
ON CONFLICT (employee_id, sale_id) DO NOTHING;

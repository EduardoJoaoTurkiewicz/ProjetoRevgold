/*
  # Automatic Status Update Triggers for Sales and Debts

  ## Summary
  Creates PostgreSQL trigger functions that automatically recalculate and update
  the status of parent sales and debts whenever a linked check or boleto changes
  payment status.

  ## New Functions
  - `recalculate_sale_status(p_sale_id uuid)` - Recalculates and updates a sale's
    status, received_amount, and pending_amount based on all linked checks and boletos.
    - Counts compensated checks/boletos as paid
    - Derives status: 'pago' (all paid), 'parcial' (some paid), 'pendente' (none paid)

  - `recalculate_debt_status(p_debt_id uuid)` - Same logic for debts, updating
    is_paid, paid_amount, and pending_amount fields.

  - `trigger_update_sale_status_from_check()` - AFTER UPDATE trigger function for
    the checks table; fires when check.status changes and sale_id is set.

  - `trigger_update_sale_status_from_boleto()` - AFTER UPDATE trigger function for
    the boletos table; fires when boleto.status changes and sale_id is set.

  - `trigger_update_debt_status_from_check()` - AFTER UPDATE trigger function for
    the checks table; fires when check.status changes and debt_id is set.

  - `trigger_update_debt_status_from_boleto()` - AFTER UPDATE trigger function for
    the boletos table; fires when boleto.status changes and debt_id is set.

  ## New Triggers
  - `after_check_status_update` on checks table (AFTER UPDATE OF status)
  - `after_boleto_status_update` on boletos table (AFTER UPDATE OF status)

  ## Logic Notes
  - Checks: status 'compensado' counts as paid
  - Boletos: status 'compensado' counts as paid (nao_pago, cancelado, vencido do not)
  - Uses SECURITY DEFINER to bypass RLS during trigger execution
  - Idempotent: safe to run multiple times concurrently
*/

-- ============================================================
-- FUNCTION: recalculate_sale_status
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_sale_status(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_value        numeric;
  v_check_paid         numeric;
  v_boleto_paid        numeric;
  v_total_installment  numeric;
  v_non_installment    numeric;
  v_received           numeric;
  v_pending            numeric;
  v_new_status         text;
BEGIN
  -- Get the sale's total value
  SELECT total_value INTO v_total_value
  FROM sales
  WHERE id = p_sale_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Sum compensated check values linked to this sale
  SELECT COALESCE(SUM(value), 0) INTO v_check_paid
  FROM checks
  WHERE sale_id = p_sale_id
    AND status = 'compensado';

  -- Sum compensated boleto values linked to this sale
  -- Use final_amount when available (covers interest/penalty), else value
  SELECT COALESCE(SUM(COALESCE(NULLIF(final_amount, 0), value)), 0) INTO v_boleto_paid
  FROM boletos
  WHERE sale_id = p_sale_id
    AND status = 'compensado';

  -- Sum non-installment received amount from payment_methods stored on the sale
  -- Non-installment methods (dinheiro, pix, cartao_debito, etc.) are tracked in received_amount
  -- We need to preserve any already-received non-installment amounts.
  -- Strategy: total installment amount for checks = sum of all checks for this sale
  --           total installment amount for boletos = sum of all boletos for this sale
  SELECT COALESCE(SUM(value), 0) INTO v_check_paid FROM checks WHERE sale_id = p_sale_id AND status = 'compensado';
  SELECT COALESCE(SUM(COALESCE(NULLIF(final_amount, 0), value)), 0) INTO v_boleto_paid FROM boletos WHERE sale_id = p_sale_id AND status = 'compensado';

  -- Total installment-based paid amounts
  v_total_installment := v_check_paid + v_boleto_paid;

  -- Non-installment received: original received_amount minus what was installment-paid
  -- To avoid double-counting, compute non-installment paid as:
  -- total_check_value + total_boleto_value (original face value of all installments for this sale)
  DECLARE
    v_total_checks   numeric;
    v_total_boletos  numeric;
  BEGIN
    SELECT COALESCE(SUM(value), 0) INTO v_total_checks FROM checks WHERE sale_id = p_sale_id;
    SELECT COALESCE(SUM(value), 0) INTO v_total_boletos FROM boletos WHERE sale_id = p_sale_id;

    -- The "non-installment" component is the original received_amount minus
    -- whatever was previously attributed to installments at sale creation time.
    -- Simpler: non-installment received = total_value - total_checks - total_boletos
    -- then add back what has been paid via installments.
    v_non_installment := v_total_value - v_total_checks - v_total_boletos;
    -- Clamp to 0 in case of rounding
    v_non_installment := GREATEST(0, v_non_installment);

    v_received := v_non_installment + v_total_installment;
    v_received := LEAST(v_received, v_total_value); -- Cannot exceed total
    v_pending  := GREATEST(0, v_total_value - v_received);

    -- Derive status
    IF v_pending <= 0.01 THEN
      v_new_status := 'pago';
    ELSIF v_total_installment > 0.01 THEN
      v_new_status := 'parcial';
    ELSE
      -- No installment paid yet; preserve existing status if no installments exist
      -- If there are no installments at all for this sale, leave status unchanged
      IF v_total_checks + v_total_boletos = 0 THEN
        RETURN;
      END IF;
      v_new_status := 'pendente';
    END IF;
  END;

  -- Update the sale record
  UPDATE sales
  SET
    received_amount = v_received,
    pending_amount  = v_pending,
    status          = v_new_status,
    updated_at      = now()
  WHERE id = p_sale_id;
END;
$$;

-- ============================================================
-- FUNCTION: recalculate_debt_status
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_debt_status(p_debt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_value       numeric;
  v_check_paid        numeric;
  v_boleto_paid       numeric;
  v_total_checks      numeric;
  v_total_boletos     numeric;
  v_non_installment   numeric;
  v_paid_amount       numeric;
  v_pending_amount    numeric;
  v_is_paid           boolean;
BEGIN
  -- Get the debt's total value
  SELECT total_value INTO v_total_value
  FROM debts
  WHERE id = p_debt_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Sum compensated check values linked to this debt
  SELECT COALESCE(SUM(value), 0) INTO v_check_paid
  FROM checks
  WHERE debt_id = p_debt_id
    AND status = 'compensado';

  -- Sum compensated boleto values linked to this debt
  SELECT COALESCE(SUM(COALESCE(NULLIF(final_amount, 0), value)), 0) INTO v_boleto_paid
  FROM boletos
  WHERE debt_id = p_debt_id
    AND status = 'compensado';

  -- Total face value of all installments for this debt
  SELECT COALESCE(SUM(value), 0) INTO v_total_checks FROM checks WHERE debt_id = p_debt_id;
  SELECT COALESCE(SUM(value), 0) INTO v_total_boletos FROM boletos WHERE debt_id = p_debt_id;

  -- Non-installment portion (upfront payments)
  v_non_installment := GREATEST(0, v_total_value - v_total_checks - v_total_boletos);

  -- Total paid
  v_paid_amount    := LEAST(v_total_value, v_non_installment + v_check_paid + v_boleto_paid);
  v_pending_amount := GREATEST(0, v_total_value - v_paid_amount);
  v_is_paid        := v_pending_amount <= 0.01;

  -- Skip update if there are no installments (avoids overwriting manual updates)
  IF v_total_checks + v_total_boletos = 0 THEN
    RETURN;
  END IF;

  -- Update the debt record
  UPDATE debts
  SET
    paid_amount    = v_paid_amount,
    pending_amount = v_pending_amount,
    is_paid        = v_is_paid,
    updated_at     = now()
  WHERE id = p_debt_id;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: after check status changes
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_update_parent_status_from_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.sale_id IS NOT NULL THEN
      PERFORM recalculate_sale_status(NEW.sale_id);
    END IF;
    IF NEW.debt_id IS NOT NULL THEN
      PERFORM recalculate_debt_status(NEW.debt_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER FUNCTION: after boleto status changes
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_update_parent_status_from_boleto()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.sale_id IS NOT NULL THEN
      PERFORM recalculate_sale_status(NEW.sale_id);
    END IF;
    IF NEW.debt_id IS NOT NULL THEN
      PERFORM recalculate_debt_status(NEW.debt_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS after_check_status_update ON checks;
DROP TRIGGER IF EXISTS after_boleto_status_update ON boletos;

CREATE TRIGGER after_check_status_update
  AFTER UPDATE OF status ON checks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_parent_status_from_check();

CREATE TRIGGER after_boleto_status_update
  AFTER UPDATE OF status ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_parent_status_from_boleto();

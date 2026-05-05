/*
  # Fix recalculate_sale_status function

  Rewrites the function to remove the invalid nested DECLARE block.
  All local variables are declared at the top level.
*/

CREATE OR REPLACE FUNCTION recalculate_sale_status(p_sale_id uuid)
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
  v_received          numeric;
  v_pending           numeric;
  v_new_status        text;
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

  -- Sum compensated boleto values (use final_amount when set, else value)
  SELECT COALESCE(SUM(COALESCE(NULLIF(final_amount, 0), value)), 0) INTO v_boleto_paid
  FROM boletos
  WHERE sale_id = p_sale_id
    AND status = 'compensado';

  -- Total face value of all installments for this sale
  SELECT COALESCE(SUM(value), 0) INTO v_total_checks
  FROM checks
  WHERE sale_id = p_sale_id;

  SELECT COALESCE(SUM(value), 0) INTO v_total_boletos
  FROM boletos
  WHERE sale_id = p_sale_id;

  -- If no installments exist, do nothing (preserve manually set status)
  IF v_total_checks + v_total_boletos = 0 THEN
    RETURN;
  END IF;

  -- Non-installment portion of the sale (upfront cash/pix/etc)
  v_non_installment := GREATEST(0, v_total_value - v_total_checks - v_total_boletos);

  -- Total received = non-installment upfront + installments paid
  v_received := LEAST(v_total_value, v_non_installment + v_check_paid + v_boleto_paid);
  v_pending  := GREATEST(0, v_total_value - v_received);

  -- Derive status
  IF v_pending <= 0.01 THEN
    v_new_status := 'pago';
  ELSIF (v_check_paid + v_boleto_paid) > 0.01 THEN
    v_new_status := 'parcial';
  ELSE
    v_new_status := 'pendente';
  END IF;

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

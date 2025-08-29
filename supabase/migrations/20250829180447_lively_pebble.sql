/*
  # Create recalculate_cash_balance function

  1. New Functions
    - `recalculate_cash_balance()` - Recalculates the current cash balance based on all transactions
      - Takes no parameters
      - Returns void
      - Calculates total entries and exits from cash_transactions
      - Updates the cash_balances table with the new current balance

  2. Functionality
    - Gets initial balance and date from cash_balances table
    - If no initial balance exists, creates one with value 0
    - Sums all 'entrada' transactions since initial date
    - Sums all 'saida' transactions since initial date
    - Calculates new balance: initial + entries - exits
    - Updates current_balance and last_updated in cash_balances table

  3. Usage
    - Called automatically by triggers when transactions are created/updated
    - Can be called manually to recalculate balance
    - Ensures data integrity for cash management system
*/

CREATE OR REPLACE FUNCTION public.recalculate_cash_balance()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    initial_bal numeric;
    initial_dt date;
    total_entradas numeric;
    total_saidas numeric;
    new_balance numeric;
    balance_id uuid;
BEGIN
    -- Get the initial balance and date from cash_balances table
    SELECT id, initial_balance, initial_date 
    INTO balance_id, initial_bal, initial_dt 
    FROM cash_balances 
    ORDER BY created_at ASC 
    LIMIT 1;

    -- If no initial balance is set, initialize it to 0 and create the record
    IF initial_bal IS NULL THEN
        initial_bal := 0;
        initial_dt := CURRENT_DATE;
        
        INSERT INTO cash_balances (initial_balance, current_balance, initial_date, last_updated)
        VALUES (initial_bal, initial_bal, initial_dt, NOW())
        RETURNING id INTO balance_id;
        
        RAISE NOTICE 'Created new cash balance record with ID: %', balance_id;
    END IF;

    -- Calculate total entries since the initial date
    SELECT COALESCE(SUM(amount), 0)
    INTO total_entradas
    FROM cash_transactions
    WHERE type = 'entrada' AND date >= initial_dt;

    -- Calculate total exits since the initial date
    SELECT COALESCE(SUM(amount), 0)
    INTO total_saidas
    FROM cash_transactions
    WHERE type = 'saida' AND date >= initial_dt;

    -- Calculate the new current balance
    new_balance := initial_bal + total_entradas - total_saidas;

    -- Update the cash_balances table
    UPDATE cash_balances
    SET current_balance = new_balance,
        last_updated = NOW()
    WHERE id = balance_id;

    RAISE NOTICE 'Cash balance recalculated: Initial=%, Entries=%, Exits=%, New Balance=%', 
                 initial_bal, total_entradas, total_saidas, new_balance;
END;
$$;
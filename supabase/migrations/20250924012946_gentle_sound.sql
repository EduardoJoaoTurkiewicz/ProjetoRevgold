/*
  # Cash Management Functions

  This migration creates all the functions and triggers needed for automatic cash management.

  ## Functions Created
  1. **update_cash_balance** - Updates cash balance when transactions change
  2. **get_current_cash_balance** - Gets current cash balance
  3. **initialize_cash_balance** - Initializes cash balance
  4. **recalculate_cash_balance** - Recalculates balance from all transactions

  ## Triggers Created
  - Auto update cash balance on transaction changes
  - Auto handle various payment types
*/

-- Function to update cash balance
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure we have a cash balance record
  INSERT INTO cash_balances (id, current_balance, initial_balance, initial_date)
  VALUES ('00000000-0000-0000-0000-000000000001', 0, 0, CURRENT_DATE)
  ON CONFLICT (id) DO NOTHING;

  -- Update the balance based on the transaction
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance + NEW.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    ELSIF NEW.type = 'saida' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance - NEW.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.type = 'entrada' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance - OLD.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    ELSIF OLD.type = 'saida' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance + OLD.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    END IF;
    
    -- Apply new transaction
    IF NEW.type = 'entrada' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance + NEW.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    ELSIF NEW.type = 'saida' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance - NEW.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the deleted transaction
    IF OLD.type = 'entrada' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance - OLD.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    ELSIF OLD.type = 'saida' THEN
      UPDATE cash_balances 
      SET current_balance = current_balance + OLD.amount,
          last_updated = now()
      WHERE id = '00000000-0000-0000-0000-000000000001';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cash balance updates
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION update_cash_balance();

-- Function to get current cash balance
CREATE OR REPLACE FUNCTION get_current_cash_balance()
RETURNS TABLE(
  id uuid,
  current_balance numeric,
  initial_balance numeric,
  initial_date date,
  last_updated timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Ensure we have a cash balance record
  INSERT INTO cash_balances (id, current_balance, initial_balance, initial_date)
  VALUES ('00000000-0000-0000-0000-000000000001', 0, 0, CURRENT_DATE)
  ON CONFLICT (id) DO NOTHING;

  RETURN QUERY
  SELECT cb.id, cb.current_balance, cb.initial_balance, cb.initial_date, 
         cb.last_updated, cb.created_at, cb.updated_at
  FROM cash_balances cb
  WHERE cb.id = '00000000-0000-0000-0000-000000000001';
END;
$$ LANGUAGE plpgsql;

-- Function to initialize cash balance
CREATE OR REPLACE FUNCTION initialize_cash_balance(initial_amount numeric)
RETURNS uuid AS $$
DECLARE
  balance_id uuid;
BEGIN
  -- Insert or update the cash balance
  INSERT INTO cash_balances (id, current_balance, initial_balance, initial_date)
  VALUES ('00000000-0000-0000-0000-000000000001', initial_amount, initial_amount, CURRENT_DATE)
  ON CONFLICT (id) DO UPDATE SET
    current_balance = initial_amount,
    initial_balance = initial_amount,
    initial_date = CURRENT_DATE,
    last_updated = now(),
    updated_at = now();
    
  RETURN '00000000-0000-0000-0000-000000000001';
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate cash balance from all transactions
CREATE OR REPLACE FUNCTION recalculate_cash_balance()
RETURNS void AS $$
DECLARE
  total_entries numeric := 0;
  total_exits numeric := 0;
  new_balance numeric := 0;
  initial_bal numeric := 0;
BEGIN
  -- Get initial balance
  SELECT COALESCE(initial_balance, 0) INTO initial_bal
  FROM cash_balances 
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Calculate total entries
  SELECT COALESCE(SUM(amount), 0) INTO total_entries
  FROM cash_transactions 
  WHERE type = 'entrada';
  
  -- Calculate total exits
  SELECT COALESCE(SUM(amount), 0) INTO total_exits
  FROM cash_transactions 
  WHERE type = 'saida';
  
  -- Calculate new balance
  new_balance := initial_bal + total_entries - total_exits;
  
  -- Update cash balance
  INSERT INTO cash_balances (id, current_balance, initial_balance, initial_date)
  VALUES ('00000000-0000-0000-0000-000000000001', new_balance, initial_bal, CURRENT_DATE)
  ON CONFLICT (id) DO UPDATE SET
    current_balance = new_balance,
    last_updated = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
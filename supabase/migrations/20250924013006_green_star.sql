/*
  # Sales Management Functions

  This migration creates functions for sales management including:
  1. Commission creation for sales
  2. Cash transaction handling for sales
  3. Sale creation with validation

  ## Functions Created
  - create_commission_for_sale
  - handle_sale_cash_transaction
  - create_sale (RPC function)
*/

-- Function to create commission for sale
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create commission if seller exists and is a seller
  IF NEW.seller_id IS NOT NULL THEN
    INSERT INTO employee_commissions (
      employee_id,
      sale_id,
      sale_value,
      commission_rate,
      commission_amount,
      date
    )
    SELECT 
      NEW.seller_id,
      NEW.id,
      NEW.total_value,
      COALESCE(NEW.custom_commission_rate, 5.00),
      (NEW.total_value * COALESCE(NEW.custom_commission_rate, 5.00) / 100),
      NEW.date
    FROM employees 
    WHERE id = NEW.seller_id AND is_seller = true
    ON CONFLICT (employee_id, sale_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission creation
CREATE TRIGGER auto_create_commission
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION create_commission_for_sale();

-- Function to handle cash transactions for sales
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method jsonb;
  cash_amount numeric := 0;
BEGIN
  -- Process payment methods to find cash amounts
  FOR payment_method IN SELECT jsonb_array_elements(NEW.payment_methods)
  LOOP
    IF (payment_method->>'method') IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito_avista') THEN
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
      'entrada',
      cash_amount,
      'Venda - ' || NEW.client,
      'venda',
      NEW.id,
      'venda'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sale cash handling
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION handle_sale_cash_transaction();

-- Create sale errors table for debugging
CREATE TABLE IF NOT EXISTS create_sale_errors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_message text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE create_sale_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON create_sale_errors
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RPC function to create sale with error handling
CREATE OR REPLACE FUNCTION create_sale(payload jsonb)
RETURNS uuid AS $$
DECLARE
  sale_id uuid;
  seller_uuid uuid;
  payment_method jsonb;
  installment_count integer;
  installment_value numeric;
  installment_interval integer;
  current_due_date date;
  i integer;
BEGIN
  -- Generate new UUID for the sale
  sale_id := uuid_generate_v4();
  
  -- Validate and convert seller_id
  IF payload->>'seller_id' IS NOT NULL AND payload->>'seller_id' != '' THEN
    BEGIN
      seller_uuid := (payload->>'seller_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      seller_uuid := NULL;
    END;
  ELSE
    seller_uuid := NULL;
  END IF;
  
  -- Insert the sale
  INSERT INTO sales (
    id,
    date,
    delivery_date,
    client,
    seller_id,
    products,
    observations,
    total_value,
    payment_methods,
    received_amount,
    pending_amount,
    status,
    payment_description,
    payment_observations,
    custom_commission_rate
  ) VALUES (
    sale_id,
    COALESCE((payload->>'date')::date, CURRENT_DATE),
    CASE WHEN payload->>'delivery_date' IS NOT NULL AND payload->>'delivery_date' != '' 
         THEN (payload->>'delivery_date')::date 
         ELSE NULL END,
    payload->>'client',
    seller_uuid,
    COALESCE(payload->'products', '[]'::jsonb),
    payload->>'observations',
    COALESCE((payload->>'total_value')::numeric, 0),
    COALESCE(payload->'payment_methods', '[]'::jsonb),
    COALESCE((payload->>'received_amount')::numeric, 0),
    COALESCE((payload->>'pending_amount')::numeric, 0),
    COALESCE(payload->>'status', 'pendente'),
    payload->>'payment_description',
    payload->>'payment_observations',
    COALESCE((payload->>'custom_commission_rate')::numeric, 5.00)
  );
  
  -- Process payment methods for installments
  FOR payment_method IN SELECT jsonb_array_elements(COALESCE(payload->'payment_methods', '[]'::jsonb))
  LOOP
    installment_count := COALESCE((payment_method->>'installments')::integer, 1);
    installment_value := COALESCE((payment_method->>'installment_value')::numeric, 0);
    installment_interval := COALESCE((payment_method->>'installment_interval')::integer, 30);
    current_due_date := COALESCE((payload->>'date')::date, CURRENT_DATE);
    
    -- Create checks for check payments
    IF (payment_method->>'method') = 'cheque' AND installment_count > 0 AND installment_value > 0 THEN
      FOR i IN 1..installment_count LOOP
        current_due_date := COALESCE((payload->>'date')::date, CURRENT_DATE) + (i * installment_interval);
        
        INSERT INTO checks (
          sale_id,
          client,
          value,
          due_date,
          status,
          installment_number,
          total_installments,
          is_own_check
        ) VALUES (
          sale_id,
          payload->>'client',
          installment_value,
          current_due_date,
          'pendente',
          i,
          installment_count,
          false
        );
      END LOOP;
    END IF;
    
    -- Create boletos for boleto payments
    IF (payment_method->>'method') = 'boleto' AND installment_count > 0 AND installment_value > 0 THEN
      FOR i IN 1..installment_count LOOP
        current_due_date := COALESCE((payload->>'date')::date, CURRENT_DATE) + (i * installment_interval);
        
        INSERT INTO boletos (
          sale_id,
          client,
          value,
          due_date,
          status,
          installment_number,
          total_installments
        ) VALUES (
          sale_id,
          payload->>'client',
          installment_value,
          current_due_date,
          'pendente',
          i,
          installment_count
        );
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN sale_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  INSERT INTO create_sale_errors (error_message, payload)
  VALUES (SQLERRM, payload);
  
  -- Re-raise the error
  RAISE;
END;
$$ LANGUAGE plpgsql;
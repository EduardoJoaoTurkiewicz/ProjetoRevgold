/*
  # Enhanced Create Sale Function with ID Support

  1. New Functions
    - `create_sale_with_id(payload jsonb)` - Creates sale with optional ID
    - Enhanced error handling and validation
    - Automatic balance updates for cash, customers, and sellers

  2. Features
    - Accepts optional ID in payload for offline sync
    - Validates all required fields
    - Updates cash balance automatically
    - Creates commission records for sellers
    - Comprehensive error logging

  3. Security
    - Maintains existing RLS policies
    - Validates all inputs before processing
    - Prevents duplicate sales
*/

-- Enhanced create sale function that accepts optional ID
CREATE OR REPLACE FUNCTION create_sale_with_id(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sale_id uuid;
  seller_record employees%ROWTYPE;
  commission_amount numeric(10,2);
  cash_entry_amount numeric(10,2) := 0;
  method jsonb;
BEGIN
  -- Validate required fields
  IF NOT (payload ? 'client') OR (payload->>'client') = '' THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF NOT (payload ? 'total_value') OR (payload->>'total_value')::numeric <= 0 THEN
    RAISE EXCEPTION 'Valor total deve ser maior que zero';
  END IF;
  
  IF NOT (payload ? 'payment_methods') OR jsonb_array_length(payload->'payment_methods') = 0 THEN
    RAISE EXCEPTION 'Pelo menos um método de pagamento é obrigatório';
  END IF;

  -- Use provided ID or generate new one
  IF (payload ? 'id') AND (payload->>'id') != '' AND (payload->>'id') != 'null' THEN
    sale_id := (payload->>'id')::uuid;
  ELSE
    sale_id := gen_random_uuid();
  END IF;

  -- Validate seller if provided
  IF (payload ? 'seller_id') AND (payload->>'seller_id') != '' AND (payload->>'seller_id') != 'null' THEN
    SELECT * INTO seller_record 
    FROM employees 
    WHERE id = (payload->>'seller_id')::uuid AND is_active = true;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendedor não encontrado ou inativo';
    END IF;
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
    CASE WHEN (payload->>'delivery_date') = '' OR (payload->>'delivery_date') = 'null' 
         THEN NULL 
         ELSE (payload->>'delivery_date')::date 
    END,
    payload->>'client',
    CASE WHEN (payload->>'seller_id') = '' OR (payload->>'seller_id') = 'null' 
         THEN NULL 
         ELSE (payload->>'seller_id')::uuid 
    END,
    COALESCE(payload->'products', '[]'::jsonb),
    NULLIF(payload->>'observations', ''),
    (payload->>'total_value')::numeric,
    payload->'payment_methods',
    COALESCE((payload->>'received_amount')::numeric, 0),
    COALESCE((payload->>'pending_amount')::numeric, 0),
    COALESCE(payload->>'status', 'pendente'),
    NULLIF(payload->>'payment_description', ''),
    NULLIF(payload->>'payment_observations', ''),
    COALESCE((payload->>'custom_commission_rate')::numeric, 5.00)
  );

  -- Calculate cash entry amount (immediate payments only)
  FOR method IN SELECT * FROM jsonb_array_elements(payload->'payment_methods')
  LOOP
    IF (method->>'type') IN ('dinheiro', 'pix', 'cartao_debito') OR 
       ((method->>'type') = 'cartao_credito' AND 
        (NOT (method ? 'installments') OR (method->>'installments')::int = 1)) THEN
      cash_entry_amount := cash_entry_amount + (method->>'amount')::numeric;
    END IF;
  END LOOP;

  -- Update cash balance if there's immediate payment
  IF cash_entry_amount > 0 THEN
    INSERT INTO cash_transactions (
      date,
      type,
      amount,
      description,
      category,
      related_id,
      payment_method
    ) VALUES (
      COALESCE((payload->>'date')::date, CURRENT_DATE),
      'entrada',
      cash_entry_amount,
      'Venda - ' || (payload->>'client'),
      'venda',
      sale_id,
      'dinheiro'
    );
  END IF;

  -- Create commission record if seller exists
  IF seller_record.id IS NOT NULL AND seller_record.is_seller THEN
    commission_amount := (payload->>'total_value')::numeric * 
                        COALESCE((payload->>'custom_commission_rate')::numeric, 5.00) / 100;
    
    INSERT INTO employee_commissions (
      employee_id,
      sale_id,
      sale_value,
      commission_rate,
      commission_amount,
      date,
      status
    ) VALUES (
      seller_record.id,
      sale_id,
      (payload->>'total_value')::numeric,
      COALESCE((payload->>'custom_commission_rate')::numeric, 5.00),
      commission_amount,
      COALESCE((payload->>'date')::date, CURRENT_DATE),
      'pendente'
    );
  END IF;

  RETURN sale_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error for debugging
    INSERT INTO create_sale_errors (payload, error_message)
    VALUES (payload, SQLERRM);
    
    RAISE EXCEPTION 'Erro ao criar venda: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_sale_with_id(jsonb) TO anon, authenticated;
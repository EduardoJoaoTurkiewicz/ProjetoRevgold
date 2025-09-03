/*
  # Fix create_sale RPC function with proper UUID validation

  1. Enhanced Validation
    - Validates that seller_id is either NULL or a valid UUID
    - Validates that client is not empty
    - Provides clear error messages for debugging

  2. Improved Error Handling
    - Clear error messages for invalid UUIDs
    - Proper handling of NULL values
    - Better debugging information
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_sale(jsonb);

-- Create improved create_sale function with proper validation
CREATE OR REPLACE FUNCTION create_sale(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_sale_id uuid;
  _date date;
  _delivery_date date;
  _client text;
  _seller_id uuid;
  _custom_commission_rate numeric;
  _products jsonb;
  _observations text;
  _total_value numeric;
  _payment_methods jsonb;
  _payment_description text;
  _payment_observations text;
  _received_amount numeric;
  _pending_amount numeric;
  _status text;
  _boletos jsonb;
  _cheques jsonb;
BEGIN
  -- Extract and validate parameters from payload
  _date := (payload->>'date')::date;
  _delivery_date := CASE 
    WHEN payload->>'delivery_date' IS NULL OR payload->>'delivery_date' = '' 
    THEN NULL 
    ELSE (payload->>'delivery_date')::date 
  END;
  _client := payload->>'client';
  
  -- Critical: Handle seller_id with proper UUID validation
  IF payload->>'seller_id' IS NULL OR payload->>'seller_id' = '' OR payload->>'seller_id' = 'null' THEN
    _seller_id := NULL;
  ELSE
    BEGIN
      _seller_id := (payload->>'seller_id')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'seller_id inválido: "%" não é um UUID válido. Selecione um vendedor válido ou deixe em branco.', payload->>'seller_id';
    END;
  END IF;
  
  _custom_commission_rate := COALESCE((payload->>'custom_commission_rate')::numeric, 5.00);
  _products := COALESCE(payload->'products', '[]'::jsonb);
  _observations := NULLIF(payload->>'observations', '');
  _total_value := (payload->>'total_value')::numeric;
  _payment_methods := COALESCE(payload->'payment_methods', '[]'::jsonb);
  _payment_description := NULLIF(payload->>'payment_description', '');
  _payment_observations := NULLIF(payload->>'payment_observations', '');
  _received_amount := COALESCE((payload->>'received_amount')::numeric, 0);
  _pending_amount := COALESCE((payload->>'pending_amount')::numeric, 0);
  _status := COALESCE(payload->>'status', 'pendente');
  _boletos := COALESCE(payload->'boletos', '[]'::jsonb);
  _cheques := COALESCE(payload->'cheques', '[]'::jsonb);

  -- Validate required fields
  IF _client IS NULL OR trim(_client) = '' THEN
    RAISE EXCEPTION 'O campo client é obrigatório e não pode estar vazio';
  END IF;

  IF _total_value IS NULL OR _total_value <= 0 THEN
    RAISE EXCEPTION 'O valor total deve ser maior que zero';
  END IF;

  -- Validate seller exists if provided
  IF _seller_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = _seller_id AND is_active = true) THEN
      RAISE EXCEPTION 'Vendedor com ID "%" não existe ou não está ativo', _seller_id;
    END IF;
  END IF;

  -- Insert the sale
  INSERT INTO sales (
    date,
    delivery_date,
    client,
    seller_id,
    custom_commission_rate,
    products,
    observations,
    total_value,
    payment_methods,
    payment_description,
    payment_observations,
    received_amount,
    pending_amount,
    status
  )
  VALUES (
    _date,
    _delivery_date,
    _client,
    _seller_id,
    _custom_commission_rate,
    _products,
    _observations,
    _total_value,
    _payment_methods,
    _payment_description,
    _payment_observations,
    _received_amount,
    _pending_amount,
    _status
  )
  RETURNING id INTO new_sale_id;

  -- Create boletos if provided
  IF jsonb_array_length(_boletos) > 0 THEN
    INSERT INTO sale_boletos (sale_id, number, due_date, value, observations)
    SELECT 
      new_sale_id,
      boleto->>'number',
      (boleto->>'due_date')::date,
      (boleto->>'value')::numeric,
      boleto->>'observations'
    FROM jsonb_array_elements(_boletos) AS boleto;
  END IF;

  -- Create cheques if provided
  IF jsonb_array_length(_cheques) > 0 THEN
    INSERT INTO sale_cheques (sale_id, bank, number, due_date, value, used_for_debt, observations)
    SELECT 
      new_sale_id,
      cheque->>'bank',
      cheque->>'number',
      (cheque->>'due_date')::date,
      (cheque->>'value')::numeric,
      COALESCE((cheque->>'used_for_debt')::boolean, false),
      cheque->>'observations'
    FROM jsonb_array_elements(_cheques) AS cheque;
  END IF;

  RETURN new_sale_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Enhanced error logging
    RAISE EXCEPTION 'Falha ao criar venda: % (Payload: %)', SQLERRM, payload::text;
END;
$$;
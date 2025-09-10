/*
  # Fix UUID validation and enhance create_sale function

  1. Enhanced Functions
    - `safe_uuid()` - Safely converts strings to UUIDs or NULL
    - `create_sale()` - Enhanced with comprehensive UUID validation
    - `create_sale_with_id()` - For offline sync with preserved IDs
  
  2. Security
    - All UUID fields are validated and sanitized
    - Empty strings are automatically converted to NULL
    - Invalid UUIDs are converted to NULL with logging
  
  3. Offline Support
    - Separate function for syncing offline sales with preserved UUIDs
    - Handles duplicate prevention during sync
*/

-- Enhanced UUID validation function
CREATE OR REPLACE FUNCTION safe_uuid(input_text text)
RETURNS uuid AS $$
BEGIN
  -- Handle null, empty string, or 'null' string
  IF input_text IS NULL OR 
     trim(input_text) = '' OR 
     trim(input_text) = 'null' OR 
     trim(input_text) = 'undefined' THEN
    RETURN NULL;
  END IF;
  
  -- Try to cast to UUID
  BEGIN
    RETURN input_text::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Log the invalid UUID attempt
    INSERT INTO create_sale_errors (payload, error_message)
    VALUES (
      jsonb_build_object('invalid_uuid_field', input_text),
      'Invalid UUID format: ' || input_text
    );
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- Enhanced create_sale function with comprehensive UUID validation
CREATE OR REPLACE FUNCTION create_sale(payload jsonb)
RETURNS uuid AS $$
DECLARE
  sale_id uuid;
  clean_seller_id uuid;
  clean_delivery_date date;
  payment_method jsonb;
  installment_count integer;
  installment_value numeric;
  installment_interval integer;
  first_installment_date date;
  current_date date;
  i integer;
BEGIN
  -- Validate required fields first
  IF payload->>'client' IS NULL OR trim(payload->>'client') = '' THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF (payload->>'total_value')::numeric <= 0 THEN
    RAISE EXCEPTION 'Valor total deve ser maior que zero';
  END IF;
  
  IF payload->'payment_methods' IS NULL OR jsonb_array_length(payload->'payment_methods') = 0 THEN
    RAISE EXCEPTION 'Pelo menos um método de pagamento é obrigatório';
  END IF;
  
  -- Clean and validate UUID fields
  clean_seller_id := safe_uuid(payload->>'seller_id');
  
  -- Validate seller exists if provided
  IF clean_seller_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = clean_seller_id AND is_active = true) THEN
      RAISE EXCEPTION 'Vendedor não encontrado ou inativo';
    END IF;
  END IF;
  
  -- Clean delivery date
  BEGIN
    IF payload->>'delivery_date' IS NOT NULL AND trim(payload->>'delivery_date') != '' THEN
      clean_delivery_date := (payload->>'delivery_date')::date;
    ELSE
      clean_delivery_date := NULL;
    END IF;
  EXCEPTION WHEN invalid_date_format THEN
    clean_delivery_date := NULL;
  END;
  
  -- Generate new sale ID
  sale_id := gen_random_uuid();
  
  -- Insert the sale with cleaned data
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
    clean_delivery_date,
    trim(payload->>'client'),
    clean_seller_id,
    COALESCE(payload->'products', '[]'::jsonb),
    NULLIF(trim(payload->>'observations'), ''),
    (payload->>'total_value')::numeric,
    payload->'payment_methods',
    COALESCE((payload->>'received_amount')::numeric, 0),
    COALESCE((payload->>'pending_amount')::numeric, 0),
    COALESCE(payload->>'status', 'pendente'),
    NULLIF(trim(payload->>'payment_description'), ''),
    NULLIF(trim(payload->>'payment_observations'), ''),
    COALESCE((payload->>'custom_commission_rate')::numeric, 5.00)
  );
  
  -- Process payment methods to create cheques and boletos
  FOR payment_method IN SELECT * FROM jsonb_array_elements(payload->'payment_methods')
  LOOP
    -- Create cheques for cheque payments with installments
    IF payment_method->>'type' = 'cheque' AND 
       COALESCE((payment_method->>'installments')::integer, 1) > 1 THEN
      
      installment_count := (payment_method->>'installments')::integer;
      installment_value := (payment_method->>'installment_value')::numeric;
      installment_interval := COALESCE((payment_method->>'installment_interval')::integer, 30);
      
      -- Get first installment date
      BEGIN
        first_installment_date := COALESCE(
          (payment_method->>'first_installment_date')::date,
          (payload->>'date')::date
        );
      EXCEPTION WHEN invalid_date_format THEN
        first_installment_date := (payload->>'date')::date;
      END;
      
      -- Create individual cheques
      FOR i IN 1..installment_count LOOP
        current_date := first_installment_date + ((i - 1) * installment_interval);
        
        INSERT INTO sale_cheques (
          sale_id,
          bank,
          number,
          due_date,
          value,
          used_for_debt,
          status,
          observations
        ) VALUES (
          sale_id,
          NULLIF(trim(payment_method->>'bank'), ''),
          NULLIF(trim(payment_method->>'number'), ''),
          current_date,
          installment_value,
          COALESCE((payment_method->>'used_for_debt')::boolean, false),
          'pendente',
          NULLIF(trim(payment_method->>'observations'), '')
        );
      END LOOP;
    END IF;
    
    -- Create boletos for boleto payments with installments
    IF payment_method->>'type' = 'boleto' AND 
       COALESCE((payment_method->>'installments')::integer, 1) > 1 THEN
      
      installment_count := (payment_method->>'installments')::integer;
      installment_value := (payment_method->>'installment_value')::numeric;
      installment_interval := COALESCE((payment_method->>'installment_interval')::integer, 30);
      
      -- Get first installment date
      BEGIN
        first_installment_date := COALESCE(
          (payment_method->>'first_installment_date')::date,
          (payload->>'date')::date
        );
      EXCEPTION WHEN invalid_date_format THEN
        first_installment_date := (payload->>'date')::date;
      END;
      
      -- Create individual boletos
      FOR i IN 1..installment_count LOOP
        current_date := first_installment_date + ((i - 1) * installment_interval);
        
        INSERT INTO sale_boletos (
          sale_id,
          number,
          due_date,
          value,
          status,
          interest,
          observations
        ) VALUES (
          sale_id,
          COALESCE(payment_method->>'number', 'BOL-' || extract(epoch from now())::text || '-' || i),
          current_date,
          installment_value,
          'pendente',
          COALESCE((payment_method->>'interest')::numeric, 0),
          NULLIF(trim(payment_method->>'observations'), '')
        );
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN sale_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error with the payload for debugging
  INSERT INTO create_sale_errors (payload, error_message)
  VALUES (payload, SQLERRM);
  
  -- Re-raise the exception
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced create_sale_with_id function for offline sync
CREATE OR REPLACE FUNCTION create_sale_with_id(payload jsonb)
RETURNS uuid AS $$
DECLARE
  sale_id uuid;
  clean_seller_id uuid;
  clean_delivery_date date;
  existing_sale_id uuid;
BEGIN
  -- Extract and validate the provided ID
  sale_id := safe_uuid(payload->>'id');
  
  IF sale_id IS NULL THEN
    -- If no valid ID provided, generate one
    sale_id := gen_random_uuid();
  ELSE
    -- Check if sale already exists
    SELECT id INTO existing_sale_id FROM sales WHERE id = sale_id;
    IF existing_sale_id IS NOT NULL THEN
      -- Sale already exists, return existing ID
      RETURN existing_sale_id;
    END IF;
  END IF;
  
  -- Validate required fields
  IF payload->>'client' IS NULL OR trim(payload->>'client') = '' THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF (payload->>'total_value')::numeric <= 0 THEN
    RAISE EXCEPTION 'Valor total deve ser maior que zero';
  END IF;
  
  -- Clean UUID fields
  clean_seller_id := safe_uuid(payload->>'seller_id');
  
  -- Clean delivery date
  BEGIN
    IF payload->>'delivery_date' IS NOT NULL AND trim(payload->>'delivery_date') != '' THEN
      clean_delivery_date := (payload->>'delivery_date')::date;
    ELSE
      clean_delivery_date := NULL;
    END IF;
  EXCEPTION WHEN invalid_date_format THEN
    clean_delivery_date := NULL;
  END;
  
  -- Insert the sale with the provided/generated ID
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
    clean_delivery_date,
    trim(payload->>'client'),
    clean_seller_id,
    COALESCE(payload->'products', '[]'::jsonb),
    NULLIF(trim(payload->>'observations'), ''),
    (payload->>'total_value')::numeric,
    COALESCE(payload->'payment_methods', '[]'::jsonb),
    COALESCE((payload->>'received_amount')::numeric, 0),
    COALESCE((payload->>'pending_amount')::numeric, 0),
    COALESCE(payload->>'status', 'pendente'),
    NULLIF(trim(payload->>'payment_description'), ''),
    NULLIF(trim(payload->>'payment_observations'), ''),
    COALESCE((payload->>'custom_commission_rate')::numeric, 5.00)
  );
  
  RETURN sale_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  INSERT INTO create_sale_errors (payload, error_message)
  VALUES (payload, SQLERRM);
  
  -- Re-raise the exception
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent sale errors for debugging
CREATE OR REPLACE FUNCTION get_recent_sale_errors(limit_count integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  payload jsonb,
  error_message text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.payload,
    e.error_message,
    e.created_at
  FROM create_sale_errors e
  ORDER BY e.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old errors
CREATE OR REPLACE FUNCTION cleanup_old_sale_errors(days_old integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM create_sale_errors 
  WHERE created_at < (now() - (days_old || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
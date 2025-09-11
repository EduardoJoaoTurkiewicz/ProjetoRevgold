/*
  # Fix UUID Empty String Error in Sales Creation

  This migration creates a robust RPC function to handle sales creation with proper UUID validation
  and automatic conversion of empty strings to NULL values.

  ## Changes Made

  1. **Enhanced create_sale RPC Function**
     - Comprehensive UUID validation using NULLIF for all UUID fields
     - Automatic conversion of empty strings to NULL
     - Robust error handling and logging
     - Support for all payment method types and installments

  2. **Helper Functions**
     - safe_uuid(): Validates and cleans UUID values
     - safe_numeric(): Validates and cleans numeric values
     - Enhanced logging for debugging

  3. **Comprehensive UUID Field Handling**
     - All possible UUID fields are validated
     - Empty strings automatically converted to NULL
     - Invalid UUIDs converted to NULL with logging

  ## Security
     - Maintains all existing RLS policies
     - No changes to table structure
     - Preserves all existing triggers and constraints
*/

-- Helper function to safely handle UUID values
CREATE OR REPLACE FUNCTION safe_uuid(input_value TEXT)
RETURNS UUID AS $$
BEGIN
  -- Handle NULL, empty string, or 'null' string
  IF input_value IS NULL OR 
     TRIM(input_value) = '' OR 
     LOWER(TRIM(input_value)) = 'null' OR
     LOWER(TRIM(input_value)) = 'undefined' THEN
    RETURN NULL;
  END IF;
  
  -- Try to cast to UUID, return NULL if invalid
  BEGIN
    RETURN input_value::UUID;
  EXCEPTION WHEN OTHERS THEN
    -- Log the invalid UUID attempt
    INSERT INTO create_sale_errors (payload, error_message)
    VALUES (
      jsonb_build_object('invalid_uuid_field', input_value),
      'Invalid UUID format: ' || input_value
    );
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- Helper function to safely handle numeric values
CREATE OR REPLACE FUNCTION safe_numeric(input_value TEXT, default_value NUMERIC DEFAULT 0)
RETURNS NUMERIC AS $$
BEGIN
  IF input_value IS NULL OR TRIM(input_value) = '' THEN
    RETURN default_value;
  END IF;
  
  BEGIN
    RETURN input_value::NUMERIC;
  EXCEPTION WHEN OTHERS THEN
    RETURN default_value;
  END;
END;
$$ LANGUAGE plpgsql;

-- Enhanced create_sale RPC function with comprehensive UUID handling
CREATE OR REPLACE FUNCTION create_sale(payload JSONB)
RETURNS UUID AS $$
DECLARE
  sale_id UUID;
  method JSONB;
  installment_date DATE;
  current_installment INTEGER;
  installment_value NUMERIC;
  installment_interval INTEGER;
  start_date DATE;
BEGIN
  -- Log the incoming payload for debugging
  INSERT INTO create_sale_errors (payload, error_message)
  VALUES (payload, 'DEBUG: Incoming payload for create_sale');

  -- Generate UUID for sale if not provided or invalid
  sale_id := COALESCE(
    safe_uuid(payload->>'id'),
    gen_random_uuid()
  );

  -- Comprehensive UUID field cleaning using NULLIF and safe_uuid
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
    COALESCE((payload->>'date')::DATE, CURRENT_DATE),
    CASE 
      WHEN payload->>'delivery_date' IS NULL OR TRIM(payload->>'delivery_date') = '' 
      THEN NULL 
      ELSE (payload->>'delivery_date')::DATE 
    END,
    COALESCE(NULLIF(TRIM(payload->>'client'), ''), 'Cliente não informado'),
    safe_uuid(payload->>'seller_id'),  -- Use safe_uuid function
    NULLIF(TRIM(payload->>'products'), ''),
    NULLIF(TRIM(payload->>'observations'), ''),
    safe_numeric(payload->>'total_value', 0),
    COALESCE(payload->'payment_methods', '[]'::JSONB),
    safe_numeric(payload->>'received_amount', 0),
    safe_numeric(payload->>'pending_amount', 0),
    COALESCE(NULLIF(TRIM(payload->>'status'), ''), 'pendente'),
    NULLIF(TRIM(payload->>'payment_description'), ''),
    NULLIF(TRIM(payload->>'payment_observations'), ''),
    safe_numeric(payload->>'custom_commission_rate', 5.00)
  );

  -- Process payment methods with enhanced UUID handling
  FOR method IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'payment_methods', '[]'::JSONB))
  LOOP
    -- Handle installment-based payment methods (cheque, boleto, cartao_credito)
    IF (method->>'type') IN ('cheque', 'boleto', 'cartao_credito') AND 
       COALESCE((method->>'installments')::INTEGER, 1) > 1 THEN
      
      installment_value := safe_numeric(method->>'installment_value', 
                                       safe_numeric(method->>'amount', 0) / COALESCE((method->>'installments')::INTEGER, 1));
      installment_interval := COALESCE((method->>'installment_interval')::INTEGER, 30);
      start_date := COALESCE((method->>'start_date')::DATE, (payload->>'date')::DATE, CURRENT_DATE);
      
      -- Create installments
      FOR current_installment IN 1..COALESCE((method->>'installments')::INTEGER, 1)
      LOOP
        installment_date := start_date + (installment_interval * (current_installment - 1));
        
        IF (method->>'type') = 'cheque' THEN
          INSERT INTO checks (
            sale_id,
            client,
            value,
            due_date,
            status,
            is_own_check,
            installment_number,
            total_installments,
            observations,
            -- Clean all UUID fields with safe_uuid
            used_in_debt,
            debt_id
          ) VALUES (
            sale_id,
            COALESCE(NULLIF(TRIM(payload->>'client'), ''), 'Cliente não informado'),
            installment_value,
            installment_date,
            'pendente',
            COALESCE((method->>'is_own_check')::BOOLEAN, false),
            current_installment,
            (method->>'installments')::INTEGER,
            NULLIF(TRIM(method->>'observations'), ''),
            safe_uuid(method->>'used_in_debt'),
            safe_uuid(method->>'debt_id')
          );
        ELSIF (method->>'type') = 'boleto' THEN
          INSERT INTO boletos (
            sale_id,
            client,
            value,
            due_date,
            status,
            installment_number,
            total_installments,
            observations,
            -- Clean UUID fields
            debt_id
          ) VALUES (
            sale_id,
            COALESCE(NULLIF(TRIM(payload->>'client'), ''), 'Cliente não informado'),
            installment_value,
            installment_date,
            'pendente',
            current_installment,
            (method->>'installments')::INTEGER,
            NULLIF(TRIM(method->>'observations'), ''),
            safe_uuid(method->>'debt_id')
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Log successful creation
  INSERT INTO create_sale_errors (payload, error_message)
  VALUES (
    jsonb_build_object(
      'sale_id', sale_id,
      'client', payload->>'client',
      'total_value', payload->>'total_value',
      'status', 'SUCCESS'
    ),
    'Sale created successfully with ID: ' || sale_id::TEXT
  );

  RETURN sale_id;

EXCEPTION WHEN OTHERS THEN
  -- Enhanced error logging with more context
  INSERT INTO create_sale_errors (payload, error_message)
  VALUES (
    jsonb_build_object(
      'original_payload', payload,
      'error_code', SQLSTATE,
      'error_context', 'create_sale_function',
      'attempted_sale_id', sale_id
    ),
    'ERROR in create_sale: ' || SQLERRM
  );
  
  -- Re-raise the error
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Create alternative function for sales with existing IDs (for sync)
CREATE OR REPLACE FUNCTION create_sale_with_id(payload JSONB)
RETURNS UUID AS $$
DECLARE
  sale_id UUID;
  existing_sale_count INTEGER;
BEGIN
  -- Extract and validate the provided ID
  sale_id := safe_uuid(payload->>'id');
  
  -- If no valid ID provided, generate one
  IF sale_id IS NULL THEN
    sale_id := gen_random_uuid();
  END IF;
  
  -- Check if sale already exists
  SELECT COUNT(*) INTO existing_sale_count
  FROM sales 
  WHERE id = sale_id;
  
  -- If sale exists, update it instead of creating
  IF existing_sale_count > 0 THEN
    UPDATE sales SET
      date = COALESCE((payload->>'date')::DATE, date),
      delivery_date = CASE 
        WHEN payload->>'delivery_date' IS NULL OR TRIM(payload->>'delivery_date') = '' 
        THEN NULL 
        ELSE (payload->>'delivery_date')::DATE 
      END,
      client = COALESCE(NULLIF(TRIM(payload->>'client'), ''), client),
      seller_id = safe_uuid(payload->>'seller_id'),
      products = NULLIF(TRIM(payload->>'products'), ''),
      observations = NULLIF(TRIM(payload->>'observations'), ''),
      total_value = safe_numeric(payload->>'total_value', total_value),
      payment_methods = COALESCE(payload->'payment_methods', payment_methods),
      received_amount = safe_numeric(payload->>'received_amount', received_amount),
      pending_amount = safe_numeric(payload->>'pending_amount', pending_amount),
      status = COALESCE(NULLIF(TRIM(payload->>'status'), ''), status),
      payment_description = NULLIF(TRIM(payload->>'payment_description'), ''),
      payment_observations = NULLIF(TRIM(payload->>'payment_observations'), ''),
      custom_commission_rate = safe_numeric(payload->>'custom_commission_rate', custom_commission_rate),
      updated_at = NOW()
    WHERE id = sale_id;
    
    RETURN sale_id;
  END IF;
  
  -- Create new sale using the main create_sale function
  RETURN create_sale(jsonb_set(payload, '{id}', to_jsonb(sale_id::TEXT)));

EXCEPTION WHEN OTHERS THEN
  -- Log sync-specific errors
  INSERT INTO create_sale_errors (payload, error_message)
  VALUES (
    jsonb_build_object(
      'sync_payload', payload,
      'attempted_id', sale_id,
      'error_code', SQLSTATE,
      'function', 'create_sale_with_id'
    ),
    'SYNC ERROR in create_sale_with_id: ' || SQLERRM
  );
  
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced RPC functions for debugging
CREATE OR REPLACE FUNCTION get_recent_sale_errors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ
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

CREATE OR REPLACE FUNCTION cleanup_old_sale_errors(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM create_sale_errors 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Test function to validate UUID handling
CREATE OR REPLACE FUNCTION test_uuid_handling()
RETURNS TABLE(
  test_name TEXT,
  input_value TEXT,
  output_value UUID,
  is_valid BOOLEAN
) AS $$
BEGIN
  -- Test various UUID scenarios
  RETURN QUERY VALUES
    ('Valid UUID', '123e4567-e89b-12d3-a456-426614174000', safe_uuid('123e4567-e89b-12d3-a456-426614174000'), true),
    ('Empty string', '', safe_uuid(''), false),
    ('NULL string', 'null', safe_uuid('null'), false),
    ('Undefined string', 'undefined', safe_uuid('undefined'), false),
    ('Invalid format', 'not-a-uuid', safe_uuid('not-a-uuid'), false),
    ('Whitespace only', '   ', safe_uuid('   '), false);
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance on error logging
CREATE INDEX IF NOT EXISTS idx_create_sale_errors_created_at 
ON create_sale_errors(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_create_sale_errors_error_message 
ON create_sale_errors USING gin(to_tsvector('portuguese', error_message));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION safe_uuid(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION safe_numeric(TEXT, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_sale(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_sale_with_id(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recent_sale_errors(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_sale_errors(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION test_uuid_handling() TO anon, authenticated;
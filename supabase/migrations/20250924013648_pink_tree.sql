/*
  # Create sale function and related utilities

  1. Functions
    - `create_sale` - Main function to create sales with validation and related records
    - `get_create_sale_errors` - Function to retrieve error logs
    - `clear_old_create_sale_errors` - Function to clean up old error logs
  
  2. Tables
    - `create_sale_errors` - Error logging table for debugging sale creation issues
  
  3. Security
    - Enable RLS on error logging table
    - Add policies for error log access
*/

-- Create error logging table for sale creation debugging
CREATE TABLE IF NOT EXISTS create_sale_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE create_sale_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on create_sale_errors"
  ON create_sale_errors
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Function to get create sale errors
CREATE OR REPLACE FUNCTION get_create_sale_errors()
RETURNS TABLE (
  id uuid,
  error_message text,
  payload jsonb,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cse.id,
    cse.error_message,
    cse.payload,
    cse.created_at
  FROM create_sale_errors cse
  ORDER BY cse.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear old create sale errors
CREATE OR REPLACE FUNCTION clear_old_create_sale_errors()
RETURNS void AS $$
BEGIN
  DELETE FROM create_sale_errors 
  WHERE created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main function to create sales
CREATE OR REPLACE FUNCTION create_sale(payload jsonb)
RETURNS jsonb AS $$
DECLARE
  sale_id uuid;
  seller_uuid uuid;
  payment_method jsonb;
  check_data jsonb;
  boleto_data jsonb;
  result jsonb;
  i integer;
BEGIN
  -- Log the incoming payload for debugging
  INSERT INTO create_sale_errors (error_message, payload)
  VALUES ('DEBUG: create_sale called with payload', payload);

  -- Validate required fields
  IF payload->>'client' IS NULL OR payload->>'client' = '' THEN
    INSERT INTO create_sale_errors (error_message, payload)
    VALUES ('ERROR: Client name is required', payload);
    RETURN jsonb_build_object('success', false, 'error', 'Client name is required');
  END IF;

  IF (payload->>'total_value')::numeric <= 0 THEN
    INSERT INTO create_sale_errors (error_message, payload)
    VALUES ('ERROR: Total value must be greater than 0', payload);
    RETURN jsonb_build_object('success', false, 'error', 'Total value must be greater than 0');
  END IF;

  -- Generate new sale ID
  sale_id := gen_random_uuid();

  -- Handle seller_id conversion (empty string to NULL)
  seller_uuid := NULL;
  IF payload->>'seller_id' IS NOT NULL AND payload->>'seller_id' != '' THEN
    BEGIN
      seller_uuid := (payload->>'seller_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO create_sale_errors (error_message, payload)
      VALUES ('ERROR: Invalid seller_id format: ' || payload->>'seller_id', payload);
      RETURN jsonb_build_object('success', false, 'error', 'Invalid seller_id format');
    END;
  END IF;

  -- Insert the sale
  BEGIN
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
      CASE 
        WHEN payload->>'delivery_date' IS NOT NULL AND payload->>'delivery_date' != '' 
        THEN (payload->>'delivery_date')::date 
        ELSE NULL 
      END,
      payload->>'client',
      seller_uuid,
      COALESCE(payload->'products', '[]'::jsonb),
      payload->>'observations',
      (payload->>'total_value')::numeric,
      COALESCE(payload->'payment_methods', '[]'::jsonb),
      COALESCE((payload->>'received_amount')::numeric, 0),
      COALESCE((payload->>'pending_amount')::numeric, (payload->>'total_value')::numeric),
      COALESCE(payload->>'status', 'pendente'),
      payload->>'payment_description',
      payload->>'payment_observations',
      COALESCE((payload->>'custom_commission_rate')::numeric, 5.00)
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO create_sale_errors (error_message, payload)
    VALUES ('ERROR inserting sale: ' || SQLERRM, payload);
    RETURN jsonb_build_object('success', false, 'error', 'Failed to create sale: ' || SQLERRM);
  END;

  -- Process payment methods to create checks and boletos
  IF payload->'payment_methods' IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(payload->'payment_methods') - 1 LOOP
      payment_method := payload->'payment_methods'->i;
      
      -- Create checks for check payments
      IF payment_method->>'method' = 'cheque' AND payment_method->'checks' IS NOT NULL THEN
        FOR check_data IN SELECT * FROM jsonb_array_elements(payment_method->'checks') LOOP
          BEGIN
            INSERT INTO checks (
              sale_id,
              client,
              value,
              due_date,
              status,
              is_own_check,
              installment_number,
              total_installments,
              observations
            ) VALUES (
              sale_id,
              payload->>'client',
              (check_data->>'value')::numeric,
              (check_data->>'due_date')::date,
              COALESCE(check_data->>'status', 'pendente'),
              COALESCE((check_data->>'is_own_check')::boolean, false),
              COALESCE((check_data->>'installment_number')::integer, 1),
              COALESCE((check_data->>'total_installments')::integer, 1),
              check_data->>'observations'
            );
          EXCEPTION WHEN OTHERS THEN
            INSERT INTO create_sale_errors (error_message, payload)
            VALUES ('ERROR creating check: ' || SQLERRM || ' - Check data: ' || check_data::text, payload);
          END;
        END LOOP;
      END IF;

      -- Create boletos for boleto payments
      IF payment_method->>'method' = 'boleto' AND payment_method->'boletos' IS NOT NULL THEN
        FOR boleto_data IN SELECT * FROM jsonb_array_elements(payment_method->'boletos') LOOP
          BEGIN
            INSERT INTO boletos (
              sale_id,
              client,
              value,
              due_date,
              status,
              installment_number,
              total_installments,
              observations
            ) VALUES (
              sale_id,
              payload->>'client',
              (boleto_data->>'value')::numeric,
              (boleto_data->>'due_date')::date,
              COALESCE(boleto_data->>'status', 'pendente'),
              COALESCE((boleto_data->>'installment_number')::integer, 1),
              COALESCE((boleto_data->>'total_installments')::integer, 1),
              boleto_data->>'observations'
            );
          EXCEPTION WHEN OTHERS THEN
            INSERT INTO create_sale_errors (error_message, payload)
            VALUES ('ERROR creating boleto: ' || SQLERRM || ' - Boleto data: ' || boleto_data::text, payload);
          END;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Log success
  INSERT INTO create_sale_errors (error_message, payload)
  VALUES ('SUCCESS: Sale created with ID: ' || sale_id::text, payload);

  -- Return success response
  result := jsonb_build_object(
    'success', true,
    'sale_id', sale_id,
    'message', 'Sale created successfully'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO create_sale_errors (error_message, payload)
  VALUES ('UNEXPECTED ERROR in create_sale: ' || SQLERRM, payload);
  RETURN jsonb_build_object('success', false, 'error', 'Unexpected error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
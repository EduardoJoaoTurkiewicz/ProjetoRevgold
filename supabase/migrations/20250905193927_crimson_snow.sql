/*
  # Fix Sales Creation with Robust RPC and Error Logging

  1. New Tables
    - `create_sale_errors` - Debug table for invalid payloads and errors

  2. Enhanced Tables
    - Add missing columns to `sales` table (idempotent)
    - Ensure proper constraints and defaults

  3. Robust Functions
    - `create_sale(payload jsonb)` - Secure RPC with UUID validation
    - `sanitize_uuid(text)` - Helper for UUID validation
    - Comprehensive error logging and payload debugging

  4. Security
    - Enable RLS on new tables
    - Grant proper permissions for RPC functions
    - Secure function execution with proper search_path
*/

-- 1. Create debug table for sale creation errors
CREATE TABLE IF NOT EXISTS public.create_sale_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.create_sale_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on create_sale_errors"
  ON public.create_sale_errors
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Ensure essential columns exist in sales table (idempotent)
DO $$
BEGIN
  -- Add delivery_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'delivery_date'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_date date;
  END IF;

  -- Add custom_commission_rate if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'custom_commission_rate'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN custom_commission_rate numeric(5,2) DEFAULT 5.00;
  END IF;
END $$;

-- 3. Helper function to sanitize and validate UUIDs
CREATE OR REPLACE FUNCTION public.sanitize_uuid(input_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return null for empty/null inputs
  IF input_text IS NULL OR trim(input_text) = '' OR trim(input_text) = 'null' THEN
    RETURN NULL;
  END IF;
  
  -- Validate UUID format
  IF input_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN input_text::uuid;
  ELSE
    RAISE EXCEPTION 'Invalid UUID format: %', input_text;
  END IF;
END;
$$;

-- 4. Helper function to safely convert text to numeric
CREATE OR REPLACE FUNCTION public.safe_numeric(input_text text, default_value numeric DEFAULT 0)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN default_value;
  END IF;
  
  IF input_text ~* '^-?[0-9]+(\.[0-9]+)?$' THEN
    RETURN input_text::numeric;
  ELSE
    RETURN default_value;
  END IF;
END;
$$;

-- 5. Robust create_sale RPC function
CREATE OR REPLACE FUNCTION public.create_sale(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_client_text text;
  v_seller_text text;
  v_client_uuid uuid;
  v_seller_uuid uuid;
  v_total_value numeric;
  v_received_amount numeric;
  v_pending_amount numeric;
  v_commission_rate numeric;
  v_date date;
  v_delivery_date date;
  v_status text;
  boleto_record record;
  cheque_record record;
  payment_method record;
  v_instant_payment_total numeric := 0;
BEGIN
  -- Log the incoming payload for debugging
  RAISE NOTICE 'create_sale called with payload: %', payload;
  
  -- Validate and sanitize required fields
  v_client_text := trim(coalesce(payload->>'client', ''));
  v_seller_text := trim(coalesce(payload->>'seller_id', payload->>'sellerId', ''));
  
  -- Validate client (required)
  IF v_client_text = '' THEN
    INSERT INTO public.create_sale_errors(payload, error_message) 
    VALUES (payload, 'Missing required client field');
    RAISE EXCEPTION 'Cliente é obrigatório (client field is required)';
  END IF;
  
  -- Validate client UUID format
  BEGIN
    v_client_uuid := sanitize_uuid(v_client_text);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.create_sale_errors(payload, error_message) 
    VALUES (payload, 'Invalid client UUID: ' || v_client_text || ' - ' || SQLERRM);
    RAISE EXCEPTION 'UUID de cliente inválido: %', v_client_text;
  END;
  
  -- Validate seller UUID (optional)
  IF v_seller_text IS NOT NULL AND v_seller_text != '' THEN
    BEGIN
      v_seller_uuid := sanitize_uuid(v_seller_text);
      
      -- Verify seller exists and is active
      IF NOT EXISTS (
        SELECT 1 FROM public.employees 
        WHERE id = v_seller_uuid AND is_active = true AND is_seller = true
      ) THEN
        INSERT INTO public.create_sale_errors(payload, error_message) 
        VALUES (payload, 'Seller not found or inactive: ' || v_seller_text);
        RAISE EXCEPTION 'Vendedor não encontrado ou inativo: %', v_seller_text;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.create_sale_errors(payload, error_message) 
      VALUES (payload, 'Invalid seller UUID: ' || v_seller_text || ' - ' || SQLERRM);
      RAISE EXCEPTION 'UUID de vendedor inválido: %', v_seller_text;
    END;
  ELSE
    v_seller_uuid := NULL;
  END IF;
  
  -- Sanitize numeric fields
  v_total_value := safe_numeric(payload->>'total_value', 0);
  v_received_amount := safe_numeric(payload->>'received_amount', 0);
  v_pending_amount := safe_numeric(payload->>'pending_amount', 0);
  v_commission_rate := safe_numeric(payload->>'custom_commission_rate', 5.00);
  
  -- Validate total value
  IF v_total_value <= 0 THEN
    INSERT INTO public.create_sale_errors(payload, error_message) 
    VALUES (payload, 'Invalid total_value: ' || coalesce(payload->>'total_value', 'null'));
    RAISE EXCEPTION 'Valor total deve ser maior que zero';
  END IF;
  
  -- Sanitize dates
  BEGIN
    v_date := COALESCE(nullif(payload->>'date', '')::date, CURRENT_DATE);
  EXCEPTION WHEN OTHERS THEN
    v_date := CURRENT_DATE;
  END;
  
  BEGIN
    v_delivery_date := nullif(payload->>'delivery_date', '')::date;
  EXCEPTION WHEN OTHERS THEN
    v_delivery_date := NULL;
  END;
  
  -- Determine status
  v_status := COALESCE(nullif(payload->>'status', ''), 'pendente');
  
  -- Calculate instant payment total for cash transactions
  FOR payment_method IN
    SELECT * FROM jsonb_to_recordset(COALESCE(payload->'payment_methods', '[]'::jsonb))
    AS x(type text, amount text, installments text)
  LOOP
    IF payment_method.type IN ('dinheiro', 'pix', 'cartao_debito') OR 
       (payment_method.type = 'cartao_credito' AND 
        (payment_method.installments IS NULL OR safe_numeric(payment_method.installments, 1) = 1)) THEN
      v_instant_payment_total := v_instant_payment_total + safe_numeric(payment_method.amount, 0);
    END IF;
  END LOOP;
  
  -- Insert the sale
  INSERT INTO public.sales (
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
    custom_commission_rate,
    created_at,
    updated_at
  ) VALUES (
    v_date,
    v_delivery_date,
    v_client_uuid,
    v_seller_uuid,
    COALESCE(payload->'products', '[]'::jsonb),
    nullif(payload->>'observations', ''),
    v_total_value,
    COALESCE(payload->'payment_methods', '[]'::jsonb),
    v_received_amount,
    v_pending_amount,
    v_status,
    nullif(payload->>'payment_description', ''),
    nullif(payload->>'payment_observations', ''),
    v_commission_rate,
    now(),
    now()
  )
  RETURNING id INTO v_sale_id;
  
  -- Generate boletos if provided
  FOR boleto_record IN
    SELECT * FROM jsonb_to_recordset(COALESCE(payload->'boletos', '[]'::jsonb))
    AS x(number text, due_date text, value text, observations text)
  LOOP
    INSERT INTO public.sale_boletos (
      sale_id,
      number,
      due_date,
      value,
      observations,
      status,
      interest,
      created_at,
      updated_at
    ) VALUES (
      v_sale_id,
      boleto_record.number,
      COALESCE(nullif(boleto_record.due_date, '')::date, v_date + interval '30 days'),
      safe_numeric(boleto_record.value, 0),
      nullif(boleto_record.observations, ''),
      'pendente',
      0,
      now(),
      now()
    );
  END LOOP;
  
  -- Generate cheques if provided
  FOR cheque_record IN
    SELECT * FROM jsonb_to_recordset(COALESCE(payload->'cheques', '[]'::jsonb))
    AS x(bank text, number text, due_date text, value text, used_for_debt text, observations text)
  LOOP
    INSERT INTO public.sale_cheques (
      sale_id,
      bank,
      number,
      due_date,
      value,
      used_for_debt,
      observations,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_sale_id,
      nullif(cheque_record.bank, ''),
      nullif(cheque_record.number, ''),
      COALESCE(nullif(cheque_record.due_date, '')::date, v_date + interval '30 days'),
      safe_numeric(cheque_record.value, 0),
      COALESCE((cheque_record.used_for_debt)::boolean, false),
      nullif(cheque_record.observations, ''),
      'pendente',
      now(),
      now()
    );
  END LOOP;
  
  -- Create cash transaction for instant payments
  IF v_instant_payment_total > 0 THEN
    INSERT INTO public.cash_transactions (
      date,
      type,
      amount,
      description,
      category,
      related_id,
      payment_method,
      created_at,
      updated_at
    ) VALUES (
      v_date,
      'entrada',
      v_instant_payment_total,
      'Recebimento imediato da venda - ' || v_client_uuid,
      'venda',
      v_sale_id,
      'venda_avista',
      now(),
      now()
    );
  END IF;
  
  -- Log successful creation
  RAISE NOTICE 'Sale created successfully with ID: %', v_sale_id;
  
  RETURN v_sale_id;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error with payload for debugging
  BEGIN
    INSERT INTO public.create_sale_errors (payload, error_message, created_at) 
    VALUES (payload, SQLERRM, now());
  EXCEPTION WHEN OTHERS THEN
    -- If even error logging fails, just continue
    NULL;
  END;
  
  -- Re-raise the original error
  RAISE;
END;
$$;

-- Grant permissions for the RPC function
GRANT EXECUTE ON FUNCTION public.create_sale(jsonb) TO authenticated, anon;

-- 6. Function to mark sale boleto as paid
CREATE OR REPLACE FUNCTION public.mark_sale_boleto_paid(
  boleto_id uuid,
  paid_at timestamptz DEFAULT now(),
  interest_amount numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boleto_value numeric;
  v_sale_id uuid;
BEGIN
  -- Get boleto details
  SELECT value, sale_id INTO v_boleto_value, v_sale_id
  FROM public.sale_boletos
  WHERE id = boleto_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Boleto not found: %', boleto_id;
  END IF;
  
  -- Update boleto status
  UPDATE public.sale_boletos
  SET 
    status = 'pago',
    paid_at = mark_sale_boleto_paid.paid_at,
    interest = interest_amount,
    updated_at = now()
  WHERE id = boleto_id;
  
  -- Create cash transaction
  INSERT INTO public.cash_transactions (
    date,
    type,
    amount,
    description,
    category,
    related_id,
    payment_method,
    created_at,
    updated_at
  ) VALUES (
    mark_sale_boleto_paid.paid_at::date,
    'entrada',
    v_boleto_value + interest_amount,
    'Recebimento de boleto - Sale ID: ' || v_sale_id,
    'boleto',
    v_sale_id,
    'boleto',
    now(),
    now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_sale_boleto_paid(uuid, timestamptz, numeric) TO authenticated, anon;

-- 7. Function to mark sale cheque as paid
CREATE OR REPLACE FUNCTION public.mark_sale_cheque_paid(
  cheque_id uuid,
  paid_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cheque_value numeric;
  v_sale_id uuid;
BEGIN
  -- Get cheque details
  SELECT value, sale_id INTO v_cheque_value, v_sale_id
  FROM public.sale_cheques
  WHERE id = cheque_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cheque not found: %', cheque_id;
  END IF;
  
  -- Update cheque status
  UPDATE public.sale_cheques
  SET 
    status = 'pago',
    paid_at = mark_sale_cheque_paid.paid_at,
    updated_at = now()
  WHERE id = cheque_id;
  
  -- Create cash transaction
  INSERT INTO public.cash_transactions (
    date,
    type,
    amount,
    description,
    category,
    related_id,
    payment_method,
    created_at,
    updated_at
  ) VALUES (
    mark_sale_cheque_paid.paid_at::date,
    'entrada',
    v_cheque_value,
    'Recebimento de cheque - Sale ID: ' || v_sale_id,
    'cheque',
    v_sale_id,
    'cheque',
    now(),
    now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_sale_cheque_paid(uuid, timestamptz) TO authenticated, anon;

-- 8. Function to get sale creation errors for debugging
CREATE OR REPLACE FUNCTION public.get_recent_sale_errors(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  payload jsonb,
  error_message text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, payload, error_message, created_at
  FROM public.create_sale_errors
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_sale_errors(integer) TO authenticated, anon;

-- 9. Function to clean old error logs (optional maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_sale_errors(days_old integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.create_sale_errors
  WHERE created_at < (now() - (days_old || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_sale_errors(integer) TO authenticated, anon;
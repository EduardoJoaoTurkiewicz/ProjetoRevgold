/*
  # Update create_sale RPC to Support Optional Bulk Metadata

  This migration drops and recreates the create_sale RPC function to support
  optional bulk import metadata fields (bulk_insert_id and origin_file_name).

  ## Changes
  - Drops existing create_sale RPC function
  - Recreates with support for optional bulk_insert_id and origin_file_name
  - Added column existence check for graceful degradation
  - Maintains backward compatibility with existing sales creation flows

  ## Key Features
  - Checks if bulk metadata columns exist before attempting to use them
  - Falls back to standard INSERT if columns are missing
  - Prevents errors from stopping sale creation if metadata columns are unavailable
*/

DROP FUNCTION IF EXISTS create_sale(jsonb);

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
  bulk_insert_id_val text;
  origin_file_name_val text;
  has_bulk_columns boolean := false;
BEGIN
  sale_id := uuid_generate_v4();

  IF payload->>'seller_id' IS NOT NULL AND payload->>'seller_id' != '' THEN
    BEGIN
      seller_uuid := (payload->>'seller_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      seller_uuid := NULL;
    END;
  ELSE
    seller_uuid := NULL;
  END IF;

  bulk_insert_id_val := payload->>'bulk_insert_id';
  origin_file_name_val := payload->>'origin_file_name';

  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sales' AND column_name = 'bulk_insert_id'
    ) INTO has_bulk_columns;
  EXCEPTION WHEN OTHERS THEN
    has_bulk_columns := false;
  END;

  IF has_bulk_columns AND (bulk_insert_id_val IS NOT NULL OR origin_file_name_val IS NOT NULL) THEN
    INSERT INTO sales (
      id, date, delivery_date, client, seller_id, products, observations,
      total_value, payment_methods, received_amount, pending_amount, status,
      payment_description, payment_observations, custom_commission_rate,
      bulk_insert_id, origin_file_name
    ) VALUES (
      sale_id,
      COALESCE((payload->>'date')::date, CURRENT_DATE),
      CASE WHEN payload->>'delivery_date' IS NOT NULL AND payload->>'delivery_date' != ''
           THEN (payload->>'delivery_date')::date ELSE NULL END,
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
      COALESCE((payload->>'custom_commission_rate')::numeric, 5.00),
      bulk_insert_id_val,
      origin_file_name_val
    );
  ELSE
    INSERT INTO sales (
      id, date, delivery_date, client, seller_id, products, observations,
      total_value, payment_methods, received_amount, pending_amount, status,
      payment_description, payment_observations, custom_commission_rate
    ) VALUES (
      sale_id,
      COALESCE((payload->>'date')::date, CURRENT_DATE),
      CASE WHEN payload->>'delivery_date' IS NOT NULL AND payload->>'delivery_date' != ''
           THEN (payload->>'delivery_date')::date ELSE NULL END,
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
  END IF;

  FOR payment_method IN SELECT jsonb_array_elements(COALESCE(payload->'payment_methods', '[]'::jsonb))
  LOOP
    installment_count := COALESCE((payment_method->>'installments')::integer, 1);
    installment_value := COALESCE((payment_method->>'installment_value')::numeric, 0);
    installment_interval := COALESCE((payment_method->>'installment_interval')::integer, 30);
    current_due_date := COALESCE((payload->>'date')::date, CURRENT_DATE);

    IF (payment_method->>'method') = 'cheque' AND installment_count > 0 AND installment_value > 0 THEN
      FOR i IN 1..installment_count LOOP
        current_due_date := COALESCE((payload->>'date')::date, CURRENT_DATE) + (i * installment_interval);
        INSERT INTO checks (
          sale_id, client, value, due_date, status, installment_number,
          total_installments, is_own_check
        ) VALUES (
          sale_id, payload->>'client', installment_value, current_due_date,
          'pendente', i, installment_count, false
        );
      END LOOP;
    END IF;

    IF (payment_method->>'method') = 'boleto' AND installment_count > 0 AND installment_value > 0 THEN
      FOR i IN 1..installment_count LOOP
        current_due_date := COALESCE((payload->>'date')::date, CURRENT_DATE) + (i * installment_interval);
        INSERT INTO boletos (
          sale_id, client, value, due_date, status, installment_number,
          total_installments
        ) VALUES (
          sale_id, payload->>'client', installment_value, current_due_date,
          'pendente', i, installment_count
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN sale_id;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO create_sale_errors (error_message, payload)
  VALUES (SQLERRM, payload);
  RAISE;
END;
$$ LANGUAGE plpgsql;

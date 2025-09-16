/*
  # Fix products column type from text to jsonb

  1. Schema Changes
    - Alter `sales` table `products` column from text to jsonb
    - Update existing text data to valid jsonb format
    - Ensure compatibility with existing data

  2. Data Migration
    - Convert existing text products to jsonb format
    - Handle null values properly
    - Preserve existing product information

  3. Function Updates
    - Update create_sale function to handle jsonb products
    - Ensure proper type casting in all operations
*/

-- First, update existing text data to valid jsonb format
UPDATE sales 
SET products = CASE 
  WHEN products IS NULL OR products = '' THEN '[]'::jsonb
  WHEN products::text ~ '^[\[\{]' THEN products::jsonb  -- Already JSON format
  ELSE jsonb_build_array(jsonb_build_object('name', products, 'quantity', 1, 'price', total_value, 'total', total_value))
END
WHERE products IS NOT NULL;

-- Now alter the column type to jsonb
ALTER TABLE sales ALTER COLUMN products TYPE jsonb USING 
  CASE 
    WHEN products IS NULL THEN '[]'::jsonb
    WHEN products::text = '' THEN '[]'::jsonb
    WHEN products::text ~ '^[\[\{]' THEN products::text::jsonb
    ELSE jsonb_build_array(jsonb_build_object('name', products::text, 'quantity', 1, 'price', total_value, 'total', total_value))
  END;

-- Set default value for products column
ALTER TABLE sales ALTER COLUMN products SET DEFAULT '[]'::jsonb;

-- Update the create_sale function to properly handle jsonb products
CREATE OR REPLACE FUNCTION public.create_sale(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sale_id uuid;
  cleaned_payload jsonb;
  seller_uuid uuid;
  products_data jsonb;
BEGIN
  -- Log the incoming payload for debugging
  INSERT INTO public.create_sale_errors (payload, error_message)
  VALUES (payload, 'DEBUG: Function called with payload');

  -- Initialize cleaned payload
  cleaned_payload := payload;

  -- Clean and validate seller_id
  IF cleaned_payload ? 'seller_id' THEN
    IF cleaned_payload->>'seller_id' = '' OR 
       cleaned_payload->>'seller_id' = 'null' OR 
       cleaned_payload->>'seller_id' IS NULL THEN
      cleaned_payload := cleaned_payload - 'seller_id' || jsonb_build_object('seller_id', null);
    ELSE
      BEGIN
        seller_uuid := (cleaned_payload->>'seller_id')::uuid;
        cleaned_payload := cleaned_payload - 'seller_id' || jsonb_build_object('seller_id', seller_uuid);
      EXCEPTION WHEN invalid_text_representation THEN
        cleaned_payload := cleaned_payload - 'seller_id' || jsonb_build_object('seller_id', null);
      END;
    END IF;
  END IF;

  -- Handle products field - ensure it's proper jsonb
  IF cleaned_payload ? 'products' THEN
    products_data := cleaned_payload->'products';
    
    -- If products is null or empty, set to empty array
    IF products_data IS NULL OR products_data = 'null'::jsonb THEN
      cleaned_payload := cleaned_payload - 'products' || jsonb_build_object('products', '[]'::jsonb);
    -- If products is a string, convert to proper format
    ELSIF jsonb_typeof(products_data) = 'string' THEN
      cleaned_payload := cleaned_payload - 'products' || jsonb_build_object(
        'products', 
        jsonb_build_array(
          jsonb_build_object(
            'name', products_data #>> '{}',
            'quantity', 1,
            'price', COALESCE((cleaned_payload->>'total_value')::numeric, 0),
            'total', COALESCE((cleaned_payload->>'total_value')::numeric, 0)
          )
        )
      );
    -- If products is already an array, keep it as is
    ELSIF jsonb_typeof(products_data) = 'array' THEN
      -- Products is already in correct format
      NULL;
    ELSE
      -- Fallback: convert to empty array
      cleaned_payload := cleaned_payload - 'products' || jsonb_build_object('products', '[]'::jsonb);
    END IF;
  ELSE
    -- No products field, add empty array
    cleaned_payload := cleaned_payload || jsonb_build_object('products', '[]'::jsonb);
  END IF;

  -- Validate required fields
  IF NOT (cleaned_payload ? 'client') OR 
     cleaned_payload->>'client' = '' OR 
     cleaned_payload->>'client' IS NULL THEN
    RAISE EXCEPTION 'Client is required and cannot be empty';
  END IF;

  IF NOT (cleaned_payload ? 'total_value') OR 
     (cleaned_payload->>'total_value')::numeric <= 0 THEN
    RAISE EXCEPTION 'Total value must be greater than zero';
  END IF;

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
    custom_commission_rate
  ) VALUES (
    COALESCE((cleaned_payload->>'date')::date, CURRENT_DATE),
    CASE WHEN cleaned_payload->>'delivery_date' = '' OR cleaned_payload->>'delivery_date' IS NULL 
         THEN NULL 
         ELSE (cleaned_payload->>'delivery_date')::date 
    END,
    cleaned_payload->>'client',
    CASE WHEN cleaned_payload ? 'seller_id' AND cleaned_payload->>'seller_id' IS NOT NULL 
         THEN (cleaned_payload->>'seller_id')::uuid 
         ELSE NULL 
    END,
    cleaned_payload->'products',  -- Now properly jsonb
    CASE WHEN cleaned_payload->>'observations' = '' OR cleaned_payload->>'observations' IS NULL 
         THEN NULL 
         ELSE cleaned_payload->>'observations' 
    END,
    (cleaned_payload->>'total_value')::numeric,
    COALESCE(cleaned_payload->'payment_methods', '[]'::jsonb),
    COALESCE((cleaned_payload->>'received_amount')::numeric, 0),
    COALESCE((cleaned_payload->>'pending_amount')::numeric, 0),
    COALESCE(cleaned_payload->>'status', 'pendente'),
    CASE WHEN cleaned_payload->>'payment_description' = '' OR cleaned_payload->>'payment_description' IS NULL 
         THEN NULL 
         ELSE cleaned_payload->>'payment_description' 
    END,
    CASE WHEN cleaned_payload->>'payment_observations' = '' OR cleaned_payload->>'payment_observations' IS NULL 
         THEN NULL 
         ELSE cleaned_payload->>'payment_observations' 
    END,
    COALESCE((cleaned_payload->>'custom_commission_rate')::numeric, 5.00)
  ) RETURNING id INTO sale_id;

  RETURN sale_id;

EXCEPTION WHEN OTHERS THEN
  -- Log the error with the payload for debugging
  INSERT INTO public.create_sale_errors (payload, error_message)
  VALUES (payload, SQLERRM);
  
  RAISE;
END;
$$;
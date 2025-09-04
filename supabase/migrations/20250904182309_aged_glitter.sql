/*
  # Create robust sale function with UUID validation and error logging

  1. New Tables
    - `create_sale_errors` - Logs invalid payloads for debugging

  2. Functions
    - `create_sale(jsonb)` - Robust sale creation with safe UUID casting and validation

  3. Security
    - Grant execute permissions to anon and authenticated users
    - Function uses security definer for consistent permissions
*/

-- 1) Tabela de logs para payloads inválidos (debug)
CREATE TABLE IF NOT EXISTS public.create_sale_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on error logs table
ALTER TABLE public.create_sale_errors ENABLE ROW LEVEL SECURITY;

-- Allow all operations on error logs for debugging
CREATE POLICY "Allow all operations on create_sale_errors"
  ON public.create_sale_errors
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2) Função create_sale (robusta, safe-cast e com logs)
CREATE OR REPLACE FUNCTION public.create_sale(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_client_text text := trim(coalesce(payload->>'client',''));
  v_seller_text text := trim(coalesce(payload->>'seller_id',''));
  v_seller_id uuid;
  v_total numeric := 0;
  v_received numeric := 0;
  v_pending numeric := 0;
  r_bo record;
  r_ch record;
BEGIN
  /* ---- VALIDAÇÃO SEGURA DE UUIDs ----
     - não executa CAST direto em strings vazias (evita erro 22P02)
     - valida via regex o formato antes de cast
  */
  
  -- Validação do cliente (obrigatório)
  IF v_client_text = '' OR v_client_text IS NULL THEN
    INSERT INTO public.create_sale_errors(payload, error_message) 
    VALUES (payload, 'Missing client: client field is empty or null');
    RAISE EXCEPTION 'O campo client é obrigatório e está vazio. Informe o nome do cliente.';
  END IF;

  -- Validação do vendedor (opcional)
  IF v_seller_text = '' OR v_seller_text = 'null' OR v_seller_text = 'undefined' THEN
    v_seller_id := NULL;
  ELSIF v_seller_text IS NOT NULL AND NOT (v_seller_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') THEN
    INSERT INTO public.create_sale_errors(payload, error_message) 
    VALUES (payload, 'Invalid seller UUID format: ' || v_seller_text);
    RAISE EXCEPTION 'UUID do vendedor inválido: %. Use um UUID válido ou deixe em branco.', v_seller_text;
  ELSE
    v_seller_id := v_seller_text::uuid;
  END IF;

  /* ---- VALIDAÇÃO NUMÉRICA SEGURA ---- */
  IF coalesce(payload->>'total_value','') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
    v_total := (payload->>'total_value')::numeric;
  ELSE
    v_total := 0;
  END IF;

  IF v_total <= 0 THEN
    INSERT INTO public.create_sale_errors(payload, error_message) 
    VALUES (payload, 'Invalid total_value: must be greater than 0, got: ' || coalesce(payload->>'total_value', 'null'));
    RAISE EXCEPTION 'O valor total da venda deve ser maior que zero. Valor informado: %', coalesce(payload->>'total_value', 'null');
  END IF;

  IF coalesce(payload->>'received_amount','') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
    v_received := (payload->>'received_amount')::numeric;
  ELSE
    v_received := 0;
  END IF;

  IF coalesce(payload->>'pending_amount','') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
    v_pending := (payload->>'pending_amount')::numeric;
  ELSE
    v_pending := 0;
  END IF;

  /* ---- INSERÇÃO DA VENDA (transacional nesta função) ---- */
  INSERT INTO public.sales(
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
  ) VALUES (
    COALESCE(NULLIF(payload->>'date','')::date, CURRENT_DATE),
    NULLIF(payload->>'delivery_date','')::date,
    v_client_text,
    v_seller_id,
    COALESCE(NULLIF(payload->>'custom_commission_rate','')::numeric, 5.00),
    COALESCE(payload->'products','[]'::jsonb),
    NULLIF(payload->>'observations',''),
    v_total,
    COALESCE(payload->'payment_methods','[]'::jsonb),
    NULLIF(payload->>'payment_description',''),
    NULLIF(payload->>'payment_observations',''),
    v_received,
    v_pending,
    COALESCE(NULLIF(payload->>'status',''),'pendente')
  )
  RETURNING id INTO v_sale_id;

  /* ---- GERAR BOLETOS (se vierem) com parsing seguro ----
     espera payload->'boletos' = [ { number, due_date, value, observations } ]
  */
  FOR r_bo IN
    SELECT * FROM jsonb_to_recordset(COALESCE(payload->'boletos','[]'::jsonb))
      AS x(number text, due_date text, value text, observations text)
  LOOP
    INSERT INTO public.sale_boletos(sale_id, number, due_date, value, observations)
    VALUES (
      v_sale_id,
      COALESCE(r_bo.number, 'BOL-' || extract(epoch from now())::text),
      CASE 
        WHEN trim(COALESCE(r_bo.due_date,'')) = '' THEN CURRENT_DATE + INTERVAL '30 days'
        ELSE trim(r_bo.due_date)::date 
      END,
      CASE 
        WHEN COALESCE(r_bo.value,'') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (r_bo.value)::numeric 
        ELSE 0 
      END,
      r_bo.observations
    );
  END LOOP;

  /* ---- GERAR CHEQUES (se vierem) com parsing seguro ---- */
  FOR r_ch IN
    SELECT * FROM jsonb_to_recordset(COALESCE(payload->'cheques','[]'::jsonb))
      AS x(bank text, number text, due_date text, value text, used_for_debt boolean, observations text)
  LOOP
    INSERT INTO public.sale_cheques(sale_id, bank, number, due_date, value, used_for_debt, observations)
    VALUES (
      v_sale_id,
      r_ch.bank,
      r_ch.number,
      CASE 
        WHEN trim(COALESCE(r_ch.due_date,'')) = '' THEN CURRENT_DATE + INTERVAL '30 days'
        ELSE trim(r_ch.due_date)::date 
      END,
      CASE 
        WHEN COALESCE(r_ch.value,'') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (r_ch.value)::numeric 
        ELSE 0 
      END,
      COALESCE(r_ch.used_for_debt, false),
      r_ch.observations
    );
  END LOOP;

  /* RECEBIMENTO imediato (ex.: dinheiro/pix) - criar transação de caixa */
  IF v_received > 0 THEN
    INSERT INTO public.cash_transactions(date, type, amount, description, category, related_id, payment_method)
    VALUES (
      COALESCE(NULLIF(payload->>'date','')::date, CURRENT_DATE), 
      'entrada',
      v_received,
      'Recebimento imediato da venda para ' || v_client_text, 
      'venda', 
      v_sale_id, 
      'avista'
    );
  END IF;

  RETURN v_sale_id;

EXCEPTION WHEN others THEN
  -- registra o payload e a mensagem para debug e repassa uma mensagem amigável
  BEGIN
    INSERT INTO public.create_sale_errors(payload, error_message) 
    VALUES (payload, SQLERRM);
  EXCEPTION WHEN others THEN
    -- se inserir falhar, ignora (não queremos mascarar o erro original)
    NULL;
  END;
  RAISE; -- re-levanta o erro para o cliente ver (mantendo mensagem original)
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_sale(jsonb) TO anon, authenticated;
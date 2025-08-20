/*
  # Corrigir autenticação e políticas de segurança

  1. Configuração de Autenticação
    - Desabilitar confirmação de email
    - Permitir registro automático
    - Configurar usuário padrão do sistema

  2. Políticas de Segurança Simplificadas
    - Permitir acesso total para usuários autenticados
    - Remover restrições desnecessárias
    - Garantir que todas as operações funcionem

  3. Índices e Performance
    - Manter índices existentes
    - Otimizar consultas

  4. Buckets de Storage
    - Configurar buckets para imagens
    - Definir políticas de acesso
*/

-- Configurar autenticação para permitir acesso automático
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false,
  enable_email_confirmations = false
WHERE true;

-- Atualizar políticas para permitir acesso total a usuários autenticados
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.users;
CREATE POLICY "Allow all for authenticated users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.employees;
CREATE POLICY "Allow all for authenticated users"
  ON public.employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.sales;
CREATE POLICY "Allow all for authenticated users"
  ON public.sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.debts;
CREATE POLICY "Allow all for authenticated users"
  ON public.debts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.checks;
CREATE POLICY "Allow all for authenticated users"
  ON public.checks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.boletos;
CREATE POLICY "Allow all for authenticated users"
  ON public.boletos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.installments;
CREATE POLICY "Allow all for authenticated users"
  ON public.installments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.employee_payments;
CREATE POLICY "Allow all for authenticated users"
  ON public.employee_payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.employee_advances;
CREATE POLICY "Allow all for authenticated users"
  ON public.employee_advances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.employee_overtimes;
CREATE POLICY "Allow all for authenticated users"
  ON public.employee_overtimes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.employee_commissions;
CREATE POLICY "Allow all for authenticated users"
  ON public.employee_commissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar buckets de storage se não existirem
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('check-images', 'check-images', true),
  ('employee-documents', 'employee-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para storage de imagens de cheques
DROP POLICY IF EXISTS "Allow authenticated users to upload check images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload check images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'check-images');

DROP POLICY IF EXISTS "Allow authenticated users to view check images" ON storage.objects;
CREATE POLICY "Allow authenticated users to view check images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'check-images');

DROP POLICY IF EXISTS "Allow authenticated users to delete check images" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete check images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'check-images');

-- Políticas para storage de documentos de funcionários
DROP POLICY IF EXISTS "Allow authenticated users to upload employee documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload employee documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Allow authenticated users to view employee documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to view employee documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Allow authenticated users to delete employee documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete employee documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-documents');

-- Criar usuário padrão do sistema se não existir
DO $$
BEGIN
  -- Verificar se o usuário já existe na tabela auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@revgold.com'
  ) THEN
    -- Inserir usuário diretamente na tabela auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      'admin@revgold.com',
      crypt('revgold123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"username": "Sistema RevGold"}',
      false,
      'authenticated'
    );
    
    RAISE NOTICE 'Usuário padrão criado: admin@revgold.com';
  ELSE
    RAISE NOTICE 'Usuário padrão já existe: admin@revgold.com';
  END IF;
END $$;

-- Garantir que todas as tabelas tenham RLS habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_overtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_commissions ENABLE ROW LEVEL SECURITY;

-- Adicionar campos que podem estar faltando
DO $$
BEGIN
  -- Verificar e adicionar custom_commission_rate na tabela sales
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'custom_commission_rate'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN custom_commission_rate numeric(5,2) DEFAULT 5.00;
    RAISE NOTICE 'Campo custom_commission_rate adicionado à tabela sales';
  END IF;
END $$;

-- Garantir que os campos JSONB tenham valores padrão corretos
UPDATE public.sales SET payment_methods = '[]'::jsonb WHERE payment_methods IS NULL;
UPDATE public.debts SET payment_methods = '[]'::jsonb WHERE payment_methods IS NULL;
UPDATE public.debts SET checks_used = '[]'::jsonb WHERE checks_used IS NULL;
UPDATE public.checks SET selected_available_checks = '[]'::jsonb WHERE selected_available_checks IS NULL;

-- Atualizar valores padrão para campos de texto
UPDATE public.sales SET products = 'Produtos vendidos' WHERE products IS NULL OR products = '';
UPDATE public.sales SET observations = '' WHERE observations IS NULL;
UPDATE public.sales SET payment_description = '' WHERE payment_description IS NULL;
UPDATE public.sales SET payment_observations = '' WHERE payment_observations IS NULL;

UPDATE public.debts SET observations = '' WHERE observations IS NULL;
UPDATE public.debts SET payment_description = '' WHERE payment_description IS NULL;
UPDATE public.debts SET debt_payment_description = '' WHERE debt_payment_description IS NULL;

UPDATE public.checks SET observations = '' WHERE observations IS NULL;
UPDATE public.checks SET used_for = '' WHERE used_for IS NULL;
UPDATE public.checks SET front_image = '' WHERE front_image IS NULL;
UPDATE public.checks SET back_image = '' WHERE back_image IS NULL;

UPDATE public.boletos SET observations = '' WHERE observations IS NULL;
UPDATE public.boletos SET boleto_file = '' WHERE boleto_file IS NULL;

UPDATE public.employees SET observations = '' WHERE observations IS NULL;

UPDATE public.employee_payments SET observations = '' WHERE observations IS NULL;
UPDATE public.employee_payments SET receipt = '' WHERE receipt IS NULL;

UPDATE public.employee_advances SET description = '' WHERE description IS NULL;

-- Criar índices adicionais para melhor performance
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_debts_is_paid ON public.debts(is_paid);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_is_seller ON public.employees(is_seller);
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id_date ON public.employee_payments(employee_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_employee_advances_status ON public.employee_advances(status);
CREATE INDEX IF NOT EXISTS idx_employee_overtimes_status ON public.employee_overtimes(status);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_status ON public.employee_commissions(status);
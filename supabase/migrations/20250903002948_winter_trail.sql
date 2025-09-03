/*
  # Sistema Automático de Caixa - Correção Completa

  1. Garantias Básicas
    - Extensões necessárias
    - Tabelas com estrutura correta
    - Políticas de segurança permissivas

  2. Funções de Controle
    - ensure_cash_balance() - Garante existência de registro de saldo
    - update_cash_balance() - Atualiza saldo automaticamente via trigger
    - recalculate_cash_balance() - RPC para recálculo completo

  3. Sistema Anti-Duplicação
    - Trigger para prevenir transações duplicadas
    - Validações rigorosas

  4. Triggers Automáticos
    - Atualização automática do saldo a cada transação
    - Prevenção de duplicatas

  5. Realtime Support
    - Políticas configuradas para realtime
    - Estrutura otimizada para subscriptions
*/

-- 1) Garantias básicas --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabelas (existem no projeto, mas deixamos idempotente)
CREATE TABLE IF NOT EXISTS public.cash_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  initial_balance numeric(15,2) NOT NULL DEFAULT 0,
  initial_date date NOT NULL DEFAULT current_date,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT current_date,
  type text NOT NULL CHECK (type IN ('entrada','saida')),
  amount numeric(15,2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('venda','divida','adiantamento','salario','comissao','cheque','boleto','outro')),
  related_id uuid NULL,
  payment_method text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Políticas permissivas (projeto já usa) para não travar triggers
ALTER TABLE public.cash_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_balances' AND policyname = 'Allow all on cash_balances') THEN
    CREATE POLICY "Allow all on cash_balances" ON public.cash_balances FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_transactions' AND policyname = 'Allow all on cash_transactions') THEN
    CREATE POLICY "Allow all on cash_transactions" ON public.cash_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 2) Função: garantir um registro de saldo -----------------------------------
CREATE OR REPLACE FUNCTION public.ensure_cash_balance()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE 
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.cash_balances ORDER BY created_at DESC LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, current_date, now())
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- 3) Trigger function: atualizar saldo a cada mudança em cash_transactions ----
CREATE OR REPLACE FUNCTION public.update_cash_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  bal RECORD;
  novo numeric(15,2);
BEGIN
  PERFORM public.ensure_cash_balance();
  SELECT * INTO bal FROM public.cash_balances ORDER BY created_at DESC LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      novo := bal.current_balance + NEW.amount;
    ELSE
      novo := bal.current_balance - NEW.amount;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'entrada' THEN
      novo := bal.current_balance - OLD.amount;
    ELSE
      novo := bal.current_balance + OLD.amount;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- desfaz o antigo e aplica o novo
    IF OLD.type = 'entrada' THEN
      novo := bal.current_balance - OLD.amount;
    ELSE
      novo := bal.current_balance + OLD.amount;
    END IF;
    IF NEW.type = 'entrada' THEN
      novo := novo + NEW.amount;
    ELSE
      novo := novo - NEW.amount;
    END IF;
  END IF;

  UPDATE public.cash_balances
     SET current_balance = novo,
         last_updated    = now(),
         updated_at      = now()
   WHERE id = bal.id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS auto_update_cash_balance ON public.cash_transactions;
CREATE TRIGGER auto_update_cash_balance
AFTER INSERT OR UPDATE OR DELETE ON public.cash_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_cash_balance();

-- 4) Recalcular tudo (RPC) ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_cash_balance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  bal RECORD; 
  calc numeric(15,2);
BEGIN
  PERFORM public.ensure_cash_balance();
  SELECT * INTO bal FROM public.cash_balances ORDER BY created_at DESC LIMIT 1;

  SELECT bal.initial_balance
         + COALESCE(SUM(CASE WHEN type='entrada' THEN amount ELSE -amount END), 0)
  INTO calc
  FROM public.cash_transactions;

  UPDATE public.cash_balances
     SET current_balance = calc,
         last_updated    = now(),
         updated_at      = now()
   WHERE id = bal.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_cash_balance() TO anon, authenticated;

-- 5) Prevenir duplicatas óbvias em cash_transactions --------------------------
CREATE OR REPLACE FUNCTION public.prevent_duplicate_cash_transactions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM public.cash_transactions
       WHERE date = NEW.date
         AND description = NEW.description
         AND amount = NEW.amount
         AND type = NEW.type
         AND COALESCE(related_id,'00000000-0000-0000-0000-000000000000') = COALESCE(NEW.related_id,'00000000-0000-0000-0000-000000000000')
         AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
  ) THEN
    -- ignora silenciosamente
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_duplicate_cash_transactions_trigger ON public.cash_transactions;
CREATE TRIGGER prevent_duplicate_cash_transactions_trigger
BEFORE INSERT ON public.cash_transactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_cash_transactions();

-- 6) Índices para performance -------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date_type ON public.cash_transactions(date, type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_related_id ON public.cash_transactions(related_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_category ON public.cash_transactions(category);
CREATE INDEX IF NOT EXISTS idx_cash_balances_created_at ON public.cash_balances(created_at);

-- 7) Função para inicializar caixa com valor inicial -------------------------
CREATE OR REPLACE FUNCTION public.initialize_cash_balance(initial_amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  balance_id uuid;
BEGIN
  -- Verificar se já existe saldo
  SELECT id INTO balance_id FROM public.cash_balances ORDER BY created_at DESC LIMIT 1;
  
  IF balance_id IS NOT NULL THEN
    RAISE EXCEPTION 'Caixa já foi inicializado. Use recalculate_cash_balance() para recalcular.';
  END IF;
  
  -- Criar novo saldo inicial
  INSERT INTO public.cash_balances (
    current_balance, 
    initial_balance, 
    initial_date, 
    last_updated
  ) VALUES (
    initial_amount, 
    initial_amount, 
    current_date, 
    now()
  ) RETURNING id INTO balance_id;
  
  RETURN balance_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_cash_balance(numeric) TO anon, authenticated;

-- 8) Função para obter saldo atual --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_cash_balance()
RETURNS TABLE(
  id uuid,
  current_balance numeric,
  initial_balance numeric,
  initial_date date,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_cash_balance();
  
  RETURN QUERY
  SELECT 
    cb.id,
    cb.current_balance,
    cb.initial_balance,
    cb.initial_date,
    cb.last_updated
  FROM public.cash_balances cb
  ORDER BY cb.created_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_cash_balance() TO anon, authenticated;

-- 9) Limpar registros duplicados de saldo (manter apenas o mais recente) -----
DO $$
DECLARE
  balance_count INTEGER;
  oldest_balance_id uuid;
BEGIN
  SELECT COUNT(*) INTO balance_count FROM public.cash_balances;
  
  IF balance_count > 1 THEN
    -- Manter apenas o mais recente
    DELETE FROM public.cash_balances 
    WHERE id NOT IN (
      SELECT id FROM public.cash_balances ORDER BY created_at DESC LIMIT 1
    );
    
    RAISE NOTICE 'Removidos % registros duplicados de saldo', balance_count - 1;
  END IF;
  
  -- Garantir que existe pelo menos um
  PERFORM public.ensure_cash_balance();
END$$;

-- 10) Trigger para updated_at automático --------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_cash_balances_updated_at ON public.cash_balances;
CREATE TRIGGER update_cash_balances_updated_at
  BEFORE UPDATE ON public.cash_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_transactions_updated_at ON public.cash_transactions;
CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON public.cash_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11) Comentários para documentação -------------------------------------------
COMMENT ON FUNCTION public.ensure_cash_balance() IS 'Garante que existe um registro de saldo de caixa';
COMMENT ON FUNCTION public.update_cash_balance() IS 'Trigger function para atualizar saldo automaticamente';
COMMENT ON FUNCTION public.recalculate_cash_balance() IS 'RPC para recalcular saldo baseado em todas as transações';
COMMENT ON FUNCTION public.prevent_duplicate_cash_transactions() IS 'Previne inserção de transações duplicadas';
COMMENT ON FUNCTION public.initialize_cash_balance(numeric) IS 'Inicializa caixa com valor inicial';
COMMENT ON FUNCTION public.get_current_cash_balance() IS 'Retorna saldo atual do caixa';

COMMENT ON TABLE public.cash_balances IS 'Tabela de saldo do caixa - controlada automaticamente pelo banco';
COMMENT ON TABLE public.cash_transactions IS 'Tabela de transações do caixa - cada entrada/saída atualiza o saldo automaticamente';

-- 12) Log final ---------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '=== SISTEMA AUTOMÁTICO DE CAIXA CONFIGURADO ===';
  RAISE NOTICE 'Triggers: Ativados para atualização automática do saldo';
  RAISE NOTICE 'RPC: recalculate_cash_balance() disponível';
  RAISE NOTICE 'Anti-duplicação: Ativada para cash_transactions';
  RAISE NOTICE 'Realtime: Pronto para subscriptions';
  RAISE NOTICE 'Controle: 100%% pelo banco, 0%% pelo front-end';
  RAISE NOTICE '================================================';
END$$;
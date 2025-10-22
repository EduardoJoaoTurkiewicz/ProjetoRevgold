/*
  # Aplicar tabelas de Cartão de Crédito
  
  Este migration aplica as tabelas necessárias para o módulo de Cartão de Crédito
  que foram criadas anteriormente mas não estão presentes no banco.
  
  1. Tabelas Criadas
    - `credit_card_sales` - Vendas no cartão
    - `credit_card_sale_installments` - Parcelas das vendas
    - `credit_card_debts` - Dívidas no cartão
    - `credit_card_debt_installments` - Parcelas das dívidas
  
  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados
  
  3. Automação
    - Triggers para atualizar valores automaticamente
*/

-- Criar tabela de vendas no cartão de crédito
CREATE TABLE IF NOT EXISTS credit_card_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid,
  client_name text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  first_due_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  anticipated boolean DEFAULT false,
  anticipated_date date,
  anticipated_fee numeric DEFAULT 0,
  anticipated_amount numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de parcelas das vendas no cartão
CREATE TABLE IF NOT EXISTS credit_card_sale_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_card_sale_id uuid REFERENCES credit_card_sales(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
  received_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de dívidas no cartão de crédito
CREATE TABLE IF NOT EXISTS credit_card_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid,
  supplier_name text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  first_due_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de parcelas das dívidas no cartão
CREATE TABLE IF NOT EXISTS credit_card_debt_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_card_debt_id uuid REFERENCES credit_card_debts(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_card_sales_status ON credit_card_sales(status);
CREATE INDEX IF NOT EXISTS idx_credit_card_sales_sale_date ON credit_card_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_sale_installments_status ON credit_card_sale_installments(status);
CREATE INDEX IF NOT EXISTS idx_credit_card_sale_installments_due_date ON credit_card_sale_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_debts_status ON credit_card_debts(status);
CREATE INDEX IF NOT EXISTS idx_credit_card_debts_purchase_date ON credit_card_debts(purchase_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_debt_installments_status ON credit_card_debt_installments(status);
CREATE INDEX IF NOT EXISTS idx_credit_card_debt_installments_due_date ON credit_card_debt_installments(due_date);

-- Habilitar RLS
ALTER TABLE credit_card_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_sale_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_debt_installments ENABLE ROW LEVEL SECURITY;

-- Políticas para credit_card_sales
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sales' AND policyname = 'Permitir SELECT para usuários autenticados') THEN
    CREATE POLICY "Permitir SELECT para usuários autenticados"
      ON credit_card_sales FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sales' AND policyname = 'Permitir INSERT para usuários autenticados') THEN
    CREATE POLICY "Permitir INSERT para usuários autenticados"
      ON credit_card_sales FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sales' AND policyname = 'Permitir UPDATE para usuários autenticados') THEN
    CREATE POLICY "Permitir UPDATE para usuários autenticados"
      ON credit_card_sales FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sales' AND policyname = 'Permitir DELETE para usuários autenticados') THEN
    CREATE POLICY "Permitir DELETE para usuários autenticados"
      ON credit_card_sales FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Políticas para credit_card_sale_installments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sale_installments' AND policyname = 'Permitir SELECT para usuários autenticados') THEN
    CREATE POLICY "Permitir SELECT para usuários autenticados"
      ON credit_card_sale_installments FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sale_installments' AND policyname = 'Permitir INSERT para usuários autenticados') THEN
    CREATE POLICY "Permitir INSERT para usuários autenticados"
      ON credit_card_sale_installments FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sale_installments' AND policyname = 'Permitir UPDATE para usuários autenticados') THEN
    CREATE POLICY "Permitir UPDATE para usuários autenticados"
      ON credit_card_sale_installments FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_sale_installments' AND policyname = 'Permitir DELETE para usuários autenticados') THEN
    CREATE POLICY "Permitir DELETE para usuários autenticados"
      ON credit_card_sale_installments FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Políticas para credit_card_debts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debts' AND policyname = 'Permitir SELECT para usuários autenticados') THEN
    CREATE POLICY "Permitir SELECT para usuários autenticados"
      ON credit_card_debts FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debts' AND policyname = 'Permitir INSERT para usuários autenticados') THEN
    CREATE POLICY "Permitir INSERT para usuários autenticados"
      ON credit_card_debts FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debts' AND policyname = 'Permitir UPDATE para usuários autenticados') THEN
    CREATE POLICY "Permitir UPDATE para usuários autenticados"
      ON credit_card_debts FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debts' AND policyname = 'Permitir DELETE para usuários autenticados') THEN
    CREATE POLICY "Permitir DELETE para usuários autenticados"
      ON credit_card_debts FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Políticas para credit_card_debt_installments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debt_installments' AND policyname = 'Permitir SELECT para usuários autenticados') THEN
    CREATE POLICY "Permitir SELECT para usuários autenticados"
      ON credit_card_debt_installments FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debt_installments' AND policyname = 'Permitir INSERT para usuários autenticados') THEN
    CREATE POLICY "Permitir INSERT para usuários autenticados"
      ON credit_card_debt_installments FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debt_installments' AND policyname = 'Permitir UPDATE para usuários autenticados') THEN
    CREATE POLICY "Permitir UPDATE para usuários autenticados"
      ON credit_card_debt_installments FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_card_debt_installments' AND policyname = 'Permitir DELETE para usuários autenticados') THEN
    CREATE POLICY "Permitir DELETE para usuários autenticados"
      ON credit_card_debt_installments FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Função para atualizar remaining_amount das vendas
CREATE OR REPLACE FUNCTION update_credit_card_sale_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE credit_card_sales
  SET remaining_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM credit_card_sale_installments
    WHERE credit_card_sale_id = NEW.credit_card_sale_id
    AND status = 'pending'
  ),
  status = CASE
    WHEN (SELECT COUNT(*) FROM credit_card_sale_installments WHERE credit_card_sale_id = NEW.credit_card_sale_id AND status = 'pending') = 0 THEN 'completed'
    ELSE 'active'
  END,
  updated_at = now()
  WHERE id = NEW.credit_card_sale_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar remaining_amount das dívidas
CREATE OR REPLACE FUNCTION update_credit_card_debt_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE credit_card_debts
  SET remaining_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM credit_card_debt_installments
    WHERE credit_card_debt_id = NEW.credit_card_debt_id
    AND status = 'pending'
  ),
  status = CASE
    WHEN (SELECT COUNT(*) FROM credit_card_debt_installments WHERE credit_card_debt_id = NEW.credit_card_debt_id AND status = 'pending') = 0 THEN 'completed'
    ELSE 'active'
  END,
  updated_at = now()
  WHERE id = NEW.credit_card_debt_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar remaining_amount automaticamente
DROP TRIGGER IF EXISTS trigger_update_credit_card_sale_remaining ON credit_card_sale_installments;
CREATE TRIGGER trigger_update_credit_card_sale_remaining
  AFTER INSERT OR UPDATE ON credit_card_sale_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_card_sale_remaining_amount();

DROP TRIGGER IF EXISTS trigger_update_credit_card_debt_remaining ON credit_card_debt_installments;
CREATE TRIGGER trigger_update_credit_card_debt_remaining
  AFTER INSERT OR UPDATE ON credit_card_debt_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_card_debt_remaining_amount();
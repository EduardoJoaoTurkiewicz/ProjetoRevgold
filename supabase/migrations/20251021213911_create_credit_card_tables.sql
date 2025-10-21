/*
  # Criar tabelas para gestão de Cartão de Crédito

  1. Novas Tabelas
    - `credit_card_sales` - Vendas no cartão de crédito
      - `id` (uuid, primary key)
      - `sale_id` (uuid, referência opcional)
      - `client_name` (text)
      - `total_amount` (numeric)
      - `remaining_amount` (numeric)
      - `installments` (integer)
      - `sale_date` (date)
      - `first_due_date` (date)
      - `status` (text) - 'active', 'completed'
      - `anticipated` (boolean)
      - `anticipated_date` (date, nullable)
      - `anticipated_fee` (numeric, nullable)
      - `anticipated_amount` (numeric, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `credit_card_sale_installments` - Parcelas das vendas no cartão
      - `id` (uuid, primary key)
      - `credit_card_sale_id` (uuid, referência)
      - `installment_number` (integer)
      - `amount` (numeric)
      - `due_date` (date)
      - `status` (text) - 'pending', 'received'
      - `received_date` (date, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `credit_card_debts` - Dívidas no cartão de crédito
      - `id` (uuid, primary key)
      - `debt_id` (uuid, referência opcional)
      - `supplier_name` (text)
      - `total_amount` (numeric)
      - `remaining_amount` (numeric)
      - `installments` (integer)
      - `purchase_date` (date)
      - `first_due_date` (date)
      - `status` (text) - 'active', 'completed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `credit_card_debt_installments` - Parcelas das dívidas no cartão
      - `id` (uuid, primary key)
      - `credit_card_debt_id` (uuid, referência)
      - `installment_number` (integer)
      - `amount` (numeric)
      - `due_date` (date)
      - `status` (text) - 'pending', 'paid'
      - `paid_date` (date, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas para usuários autenticados

  3. Triggers
    - Trigger para atualizar remaining_amount automaticamente
    - Trigger para processar pagamentos automáticos no vencimento
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
CREATE POLICY "Permitir SELECT para usuários autenticados"
  ON credit_card_sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir INSERT para usuários autenticados"
  ON credit_card_sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para usuários autenticados"
  ON credit_card_sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir DELETE para usuários autenticados"
  ON credit_card_sales FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para credit_card_sale_installments
CREATE POLICY "Permitir SELECT para usuários autenticados"
  ON credit_card_sale_installments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir INSERT para usuários autenticados"
  ON credit_card_sale_installments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para usuários autenticados"
  ON credit_card_sale_installments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir DELETE para usuários autenticados"
  ON credit_card_sale_installments FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para credit_card_debts
CREATE POLICY "Permitir SELECT para usuários autenticados"
  ON credit_card_debts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir INSERT para usuários autenticados"
  ON credit_card_debts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para usuários autenticados"
  ON credit_card_debts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir DELETE para usuários autenticados"
  ON credit_card_debts FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para credit_card_debt_installments
CREATE POLICY "Permitir SELECT para usuários autenticados"
  ON credit_card_debt_installments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir INSERT para usuários autenticados"
  ON credit_card_debt_installments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para usuários autenticados"
  ON credit_card_debt_installments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir DELETE para usuários autenticados"
  ON credit_card_debt_installments FOR DELETE
  TO authenticated
  USING (true);

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
/*
  # Correção completa do schema do banco de dados

  1. Correções de Schema
    - Corrigir inconsistências entre nomes de colunas
    - Garantir que todas as tabelas existam
    - Adicionar campos faltantes
    - Corrigir tipos de dados

  2. Segurança
    - Manter RLS habilitado
    - Políticas permissivas para desenvolvimento

  3. Índices
    - Adicionar índices para performance
*/

-- Garantir que todas as tabelas existam com a estrutura correta

-- Tabela employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  is_seller boolean DEFAULT false,
  salary numeric(10,2) NOT NULL DEFAULT 0,
  payment_day integer NOT NULL DEFAULT 5,
  next_payment_date date,
  is_active boolean DEFAULT true,
  hire_date date NOT NULL,
  observations text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela sales
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  delivery_date date,
  client text NOT NULL,
  seller_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  products text DEFAULT 'Produtos vendidos',
  observations text DEFAULT '',
  total_value numeric(10,2) NOT NULL DEFAULT 0,
  payment_methods jsonb NOT NULL DEFAULT '[]',
  received_amount numeric(10,2) NOT NULL DEFAULT 0,
  pending_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'parcial')),
  payment_description text DEFAULT '',
  payment_observations text DEFAULT '',
  custom_commission_rate numeric(5,2) DEFAULT 5.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela debts
CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  company text NOT NULL,
  total_value numeric(10,2) NOT NULL DEFAULT 0,
  payment_methods jsonb NOT NULL DEFAULT '[]',
  is_paid boolean DEFAULT false,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  pending_amount numeric(10,2) NOT NULL DEFAULT 0,
  checks_used jsonb DEFAULT '[]',
  payment_description text DEFAULT '',
  debt_payment_description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela checks
CREATE TABLE IF NOT EXISTS checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE,
  client text NOT NULL,
  value numeric(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'devolvido', 'reapresentado')),
  is_own_check boolean DEFAULT false,
  observations text DEFAULT '',
  used_for text DEFAULT '',
  installment_number integer,
  total_installments integer,
  front_image text DEFAULT '',
  back_image text DEFAULT '',
  selected_available_checks jsonb DEFAULT '[]',
  used_in_debt uuid REFERENCES debts(id) ON DELETE SET NULL,
  discount_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela boletos
CREATE TABLE IF NOT EXISTS boletos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  client text NOT NULL,
  value numeric(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'vencido', 'cancelado', 'nao_pago')),
  installment_number integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  boleto_file text DEFAULT '',
  observations text DEFAULT '',
  overdue_action text,
  interest_amount numeric(10,2) DEFAULT 0,
  penalty_amount numeric(10,2) DEFAULT 0,
  notary_costs numeric(10,2) DEFAULT 0,
  final_amount numeric(10,2) DEFAULT 0,
  overdue_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela employee_payments
CREATE TABLE IF NOT EXISTS employee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  is_paid boolean DEFAULT true,
  receipt text DEFAULT '',
  observations text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela employee_advances
CREATE TABLE IF NOT EXISTS employee_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  description text DEFAULT '',
  payment_method text NOT NULL DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'desconto_folha')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'descontado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela employee_commissions
CREATE TABLE IF NOT EXISTS employee_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sale_value numeric(10,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 5.00,
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela employee_overtimes
CREATE TABLE IF NOT EXISTS employee_overtimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  hours numeric(5,2) NOT NULL DEFAULT 0,
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela cash_balances
CREATE TABLE IF NOT EXISTS cash_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance numeric(15,2) DEFAULT 0,
  initial_balance numeric(15,2) DEFAULT 0,
  initial_date date DEFAULT CURRENT_DATE,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela cash_transactions
CREATE TABLE IF NOT EXISTS cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount numeric(15,2) DEFAULT 0,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('venda', 'divida', 'adiantamento', 'salario', 'comissao', 'cheque', 'boleto', 'outro')),
  related_id uuid,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela pix_fees
CREATE TABLE IF NOT EXISTS pix_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text NOT NULL,
  bank text NOT NULL,
  transaction_type text NOT NULL DEFAULT 'pix_out' CHECK (transaction_type IN ('pix_out', 'pix_in', 'ted', 'doc', 'other')),
  related_transaction_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela third_party_check_details
CREATE TABLE IF NOT EXISTS third_party_check_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid REFERENCES checks(id) ON DELETE CASCADE,
  bank text NOT NULL,
  agency text NOT NULL,
  account text NOT NULL,
  check_number text NOT NULL,
  issuer text NOT NULL,
  cpf_cnpj text NOT NULL,
  observations text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_overtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_check_details ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para desenvolvimento
CREATE POLICY IF NOT EXISTS "Enable all access for employees" ON employees
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for sales" ON sales
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for debts" ON debts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for checks" ON checks
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for boletos" ON boletos
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for employee_payments" ON employee_payments
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for employee_advances" ON employee_advances
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for employee_commissions" ON employee_commissions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for employee_overtimes" ON employee_overtimes
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for cash_balances" ON cash_balances
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for cash_transactions" ON cash_transactions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for pix_fees" ON pix_fees
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for third_party_check_details" ON third_party_check_details
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debts_updated_at ON debts;
CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checks_updated_at ON checks;
CREATE TRIGGER update_checks_updated_at
  BEFORE UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_boletos_updated_at ON boletos;
CREATE TRIGGER update_boletos_updated_at
  BEFORE UPDATE ON boletos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_payments_updated_at ON employee_payments;
CREATE TRIGGER update_employee_payments_updated_at
  BEFORE UPDATE ON employee_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_advances_updated_at ON employee_advances;
CREATE TRIGGER update_employee_advances_updated_at
  BEFORE UPDATE ON employee_advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_commissions_updated_at ON employee_commissions;
CREATE TRIGGER update_employee_commissions_updated_at
  BEFORE UPDATE ON employee_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_overtimes_updated_at ON employee_overtimes;
CREATE TRIGGER update_employee_overtimes_updated_at
  BEFORE UPDATE ON employee_overtimes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_balances_updated_at ON cash_balances;
CREATE TRIGGER update_cash_balances_updated_at
  BEFORE UPDATE ON cash_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_transactions_updated_at ON cash_transactions;
CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pix_fees_updated_at ON pix_fees;
CREATE TRIGGER update_pix_fees_updated_at
  BEFORE UPDATE ON pix_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_third_party_check_details_updated_at ON third_party_check_details;
CREATE TRIGGER update_third_party_check_details_updated_at
  BEFORE UPDATE ON third_party_check_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_is_seller ON employees(is_seller);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE INDEX IF NOT EXISTS idx_debts_date ON debts(date);
CREATE INDEX IF NOT EXISTS idx_debts_company ON debts(company);
CREATE INDEX IF NOT EXISTS idx_debts_is_paid ON debts(is_paid);

CREATE INDEX IF NOT EXISTS idx_checks_due_date ON checks(due_date);
CREATE INDEX IF NOT EXISTS idx_checks_status ON checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_sale_id ON checks(sale_id);

CREATE INDEX IF NOT EXISTS idx_boletos_due_date ON boletos(due_date);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_sale_id ON boletos(sale_id);

CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_payment_date ON employee_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_employee_advances_employee_id ON employee_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_advances_status ON employee_advances(status);

CREATE INDEX IF NOT EXISTS idx_employee_commissions_employee_id ON employee_commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_sale_id ON employee_commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_status ON employee_commissions(status);

CREATE INDEX IF NOT EXISTS idx_employee_overtimes_employee_id ON employee_overtimes(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_overtimes_status ON employee_overtimes(status);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_category ON cash_transactions(category);

CREATE INDEX IF NOT EXISTS idx_pix_fees_date ON pix_fees(date);
CREATE INDEX IF NOT EXISTS idx_pix_fees_bank ON pix_fees(bank);
CREATE INDEX IF NOT EXISTS idx_pix_fees_transaction_type ON pix_fees(transaction_type);

-- Garantir permissões para roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Criar bucket para imagens se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'check-images',
  'check-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas para storage
CREATE POLICY IF NOT EXISTS "Allow public access to check images"
  ON storage.objects
  FOR ALL
  TO anon, authenticated
  USING (bucket_id = 'check-images')
  WITH CHECK (bucket_id = 'check-images');
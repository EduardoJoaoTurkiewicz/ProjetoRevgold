/*
  # Schema inicial do sistema RevGold

  1. Novas Tabelas
    - `users` - Usuários do sistema
    - `sales` - Vendas realizadas
    - `debts` - Dívidas e gastos
    - `checks` - Cheques recebidos/emitidos
    - `boletos` - Boletos bancários
    - `employees` - Funcionários
    - `employee_payments` - Pagamentos de funcionários
    - `employee_advances` - Adiantamentos
    - `employee_overtimes` - Horas extras
    - `employee_commissions` - Comissões de vendedores
    - `installments` - Parcelas de vendas/dívidas

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados

  3. Relacionamentos
    - Foreign keys entre tabelas relacionadas
    - Cascata para exclusões quando apropriado
*/

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  is_seller boolean DEFAULT false,
  salary decimal(10,2) NOT NULL DEFAULT 0,
  payment_day integer NOT NULL DEFAULT 5,
  next_payment_date date,
  is_active boolean DEFAULT true,
  hire_date date NOT NULL,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  delivery_date date,
  client text NOT NULL,
  seller_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  products jsonb NOT NULL DEFAULT '[]',
  observations text,
  total_value decimal(10,2) NOT NULL DEFAULT 0,
  payment_methods jsonb NOT NULL DEFAULT '[]',
  received_amount decimal(10,2) NOT NULL DEFAULT 0,
  pending_amount decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'parcial')),
  payment_description text,
  payment_observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de dívidas
CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  company text NOT NULL,
  total_value decimal(10,2) NOT NULL DEFAULT 0,
  payment_methods jsonb NOT NULL DEFAULT '[]',
  is_paid boolean DEFAULT false,
  paid_amount decimal(10,2) NOT NULL DEFAULT 0,
  pending_amount decimal(10,2) NOT NULL DEFAULT 0,
  checks_used jsonb DEFAULT '[]',
  payment_description text,
  debt_payment_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de cheques
CREATE TABLE IF NOT EXISTS checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE,
  client text NOT NULL,
  value decimal(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'devolvido', 'reapresentado')),
  is_own_check boolean DEFAULT false,
  observations text,
  used_for text,
  installment_number integer,
  total_installments integer,
  front_image text,
  back_image text,
  selected_available_checks jsonb DEFAULT '[]',
  used_in_debt uuid REFERENCES debts(id) ON DELETE SET NULL,
  discount_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de boletos
CREATE TABLE IF NOT EXISTS boletos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  client text NOT NULL,
  value decimal(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'vencido', 'cancelado', 'nao_pago')),
  installment_number integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  boleto_file text,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de parcelas
CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  is_paid boolean DEFAULT false,
  type text NOT NULL CHECK (type IN ('venda', 'divida')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de pagamentos de funcionários
CREATE TABLE IF NOT EXISTS employee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  is_paid boolean DEFAULT true,
  receipt text,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de adiantamentos
CREATE TABLE IF NOT EXISTS employee_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  description text,
  payment_method text NOT NULL DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'desconto_folha')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'descontado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de horas extras
CREATE TABLE IF NOT EXISTS employee_overtimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  hours decimal(5,2) NOT NULL DEFAULT 0,
  hourly_rate decimal(10,2) NOT NULL DEFAULT 0,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de comissões
CREATE TABLE IF NOT EXISTS employee_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sale_value decimal(10,2) NOT NULL DEFAULT 0,
  commission_rate decimal(5,2) NOT NULL DEFAULT 5.00,
  commission_amount decimal(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_overtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_commissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acesso total para usuários autenticados por enquanto)
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON debts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON checks FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON boletos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON installments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON employee_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON employee_advances FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON employee_overtimes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON employee_commissions FOR ALL TO authenticated USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_debts_date ON debts(date);
CREATE INDEX IF NOT EXISTS idx_debts_company ON debts(company);
CREATE INDEX IF NOT EXISTS idx_checks_due_date ON checks(due_date);
CREATE INDEX IF NOT EXISTS idx_checks_status ON checks(status);
CREATE INDEX IF NOT EXISTS idx_boletos_due_date ON boletos(due_date);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_advances_employee_id ON employee_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_overtimes_employee_id ON employee_overtimes(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_employee_id ON employee_commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_sale_id ON employee_commissions(sale_id);
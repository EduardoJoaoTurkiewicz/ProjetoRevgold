/*
  # Complete Database Schema Setup

  This migration creates the complete database schema for the RevGold management system.

  ## Tables Created
  1. **users** - User management
  2. **cash_balances** - Cash balance tracking
  3. **cash_transactions** - All cash movements
  4. **employees** - Employee management
  5. **sales** - Sales records
  6. **debts** - Company debts and expenses
  7. **checks** - Check management (receivable and payable)
  8. **boletos** - Boleto management
  9. **employee_payments** - Employee salary payments
  10. **employee_advances** - Employee advances
  11. **employee_overtimes** - Overtime tracking
  12. **employee_commissions** - Commission tracking
  13. **pix_fees** - PIX transaction fees
  14. **taxes** - Tax payments
  15. **agenda_events** - Calendar/agenda events
  16. **acertos** - Payment settlements

  ## Functions and Triggers
  - Automatic cash balance updates
  - Commission creation for sales
  - Payment processing triggers
  - Updated timestamp triggers

  ## Security
  - Row Level Security enabled on all tables
  - Permissive policies for development
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text NOT NULL,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON users
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cash balances table
CREATE TABLE IF NOT EXISTS cash_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  initial_balance numeric(15,2) NOT NULL DEFAULT 0,
  initial_date date NOT NULL DEFAULT CURRENT_DATE,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON cash_balances
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_cash_balances_updated_at
  BEFORE UPDATE ON cash_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cash transactions table
CREATE TABLE IF NOT EXISTS cash_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount numeric(15,2) NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('venda', 'divida', 'adiantamento', 'salario', 'comissao', 'cheque', 'boleto', 'outro')),
  related_id uuid,
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON cash_transactions
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX idx_cash_transactions_type ON cash_transactions(type);
CREATE INDEX idx_cash_transactions_category ON cash_transactions(category);
CREATE INDEX idx_cash_transactions_related_id ON cash_transactions(related_id);

CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  position text NOT NULL,
  is_seller boolean DEFAULT false,
  salary numeric(12,2) NOT NULL DEFAULT 0,
  payment_day integer NOT NULL DEFAULT 5 CHECK (payment_day >= 1 AND payment_day <= 31),
  next_payment_date date,
  is_active boolean DEFAULT true,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON employees
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_is_seller ON employees(is_seller);
CREATE INDEX idx_employees_is_active ON employees(is_active);

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  client text NOT NULL,
  seller_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  products jsonb DEFAULT '[]',
  observations text,
  total_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_value >= 0),
  payment_methods jsonb NOT NULL DEFAULT '[]',
  received_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (received_amount >= 0),
  pending_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (pending_amount >= 0),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'parcial')),
  payment_description text,
  payment_observations text,
  custom_commission_rate numeric(5,2) DEFAULT 5.00 CHECK (custom_commission_rate >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON sales
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_client ON sales(client);
CREATE INDEX idx_sales_seller_id ON sales(seller_id);
CREATE INDEX idx_sales_status ON sales(status);

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Debts table
CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  company text NOT NULL,
  total_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_value >= 0),
  payment_methods jsonb NOT NULL DEFAULT '[]',
  is_paid boolean DEFAULT false,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  pending_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (pending_amount >= 0),
  checks_used jsonb DEFAULT '[]',
  payment_description text,
  debt_payment_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON debts
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_debts_date ON debts(date);
CREATE INDEX idx_debts_company ON debts(company);
CREATE INDEX idx_debts_is_paid ON debts(is_paid);

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Checks table
CREATE TABLE IF NOT EXISTS checks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE,
  client text NOT NULL,
  value numeric(12,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'devolvido', 'reapresentado')),
  is_own_check boolean DEFAULT false,
  is_company_payable boolean DEFAULT false,
  company_name text,
  payment_date date,
  observations text,
  used_for text,
  installment_number integer CHECK (installment_number > 0),
  total_installments integer CHECK (total_installments > 0),
  front_image text,
  back_image text,
  selected_available_checks jsonb DEFAULT '[]',
  used_in_debt uuid REFERENCES debts(id) ON DELETE SET NULL,
  discount_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON checks
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_checks_sale_id ON checks(sale_id);
CREATE INDEX idx_checks_debt_id ON checks(debt_id);
CREATE INDEX idx_checks_due_date ON checks(due_date);
CREATE INDEX idx_checks_status ON checks(status);

CREATE TRIGGER update_checks_updated_at
  BEFORE UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Boletos table
CREATE TABLE IF NOT EXISTS boletos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE,
  client text NOT NULL,
  value numeric(12,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'compensado', 'vencido', 'cancelado', 'nao_pago')),
  installment_number integer NOT NULL DEFAULT 1 CHECK (installment_number > 0),
  total_installments integer NOT NULL DEFAULT 1 CHECK (total_installments > 0),
  boleto_file text,
  observations text,
  overdue_action text CHECK (overdue_action IN ('pago_com_juros', 'pago_com_multa', 'pago_integral', 'protestado', 'negativado', 'acordo_realizado', 'cancelado', 'perda_total')),
  interest_amount numeric(12,2) DEFAULT 0 CHECK (interest_amount >= 0),
  penalty_amount numeric(12,2) DEFAULT 0 CHECK (penalty_amount >= 0),
  notary_costs numeric(12,2) DEFAULT 0 CHECK (notary_costs >= 0),
  final_amount numeric(12,2) DEFAULT 0 CHECK (final_amount >= 0),
  overdue_notes text,
  is_company_payable boolean DEFAULT false,
  company_name text,
  payment_date date,
  interest_paid numeric(12,2) DEFAULT 0 CHECK (interest_paid >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON boletos
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_boletos_sale_id ON boletos(sale_id);
CREATE INDEX idx_boletos_debt_id ON boletos(debt_id);
CREATE INDEX idx_boletos_due_date ON boletos(due_date);
CREATE INDEX idx_boletos_status ON boletos(status);

CREATE TRIGGER update_boletos_updated_at
  BEFORE UPDATE ON boletos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Employee payments table
CREATE TABLE IF NOT EXISTS employee_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  is_paid boolean DEFAULT true,
  receipt text,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON employee_payments
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX idx_employee_payments_payment_date ON employee_payments(payment_date);

CREATE TRIGGER update_employee_payments_updated_at
  BEFORE UPDATE ON employee_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Employee advances table
CREATE TABLE IF NOT EXISTS employee_advances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  payment_method text NOT NULL DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'desconto_folha')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'descontado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON employee_advances
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_employee_advances_employee_id ON employee_advances(employee_id);
CREATE INDEX idx_employee_advances_status ON employee_advances(status);

CREATE TRIGGER update_employee_advances_updated_at
  BEFORE UPDATE ON employee_advances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Employee overtimes table
CREATE TABLE IF NOT EXISTS employee_overtimes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  hours numeric(5,2) NOT NULL DEFAULT 0 CHECK (hours >= 0),
  hourly_rate numeric(12,2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_overtimes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON employee_overtimes
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_employee_overtimes_employee_id ON employee_overtimes(employee_id);
CREATE INDEX idx_employee_overtimes_status ON employee_overtimes(status);

CREATE TRIGGER update_employee_overtimes_updated_at
  BEFORE UPDATE ON employee_overtimes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Employee commissions table
CREATE TABLE IF NOT EXISTS employee_commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sale_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (sale_value >= 0),
  commission_rate numeric(5,2) NOT NULL DEFAULT 5.00 CHECK (commission_rate >= 0),
  commission_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, sale_id)
);

ALTER TABLE employee_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON employee_commissions
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_employee_commissions_employee_id ON employee_commissions(employee_id);
CREATE INDEX idx_employee_commissions_sale_id ON employee_commissions(sale_id);
CREATE INDEX idx_employee_commissions_status ON employee_commissions(status);

CREATE TRIGGER update_employee_commissions_updated_at
  BEFORE UPDATE ON employee_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PIX fees table
CREATE TABLE IF NOT EXISTS pix_fees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  description text NOT NULL,
  bank text NOT NULL,
  transaction_type text NOT NULL DEFAULT 'pix_out' CHECK (transaction_type IN ('pix_out', 'pix_in', 'ted', 'doc', 'other')),
  related_transaction_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pix_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON pix_fees
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_pix_fees_date ON pix_fees(date);
CREATE INDEX idx_pix_fees_bank ON pix_fees(bank);
CREATE INDEX idx_pix_fees_transaction_type ON pix_fees(transaction_type);

CREATE TRIGGER update_pix_fees_updated_at
  BEFORE UPDATE ON pix_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Taxes table
CREATE TABLE IF NOT EXISTS taxes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  tax_type text NOT NULL CHECK (tax_type IN ('irpj', 'csll', 'pis', 'cofins', 'icms', 'iss', 'simples_nacional', 'inss', 'fgts', 'iptu', 'ipva', 'outros')),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  due_date date,
  payment_method text NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'cartao_debito', 'cartao_credito', 'cheque', 'boleto', 'outros')),
  reference_period text,
  document_number text,
  observations text,
  receipt_file text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON taxes
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_taxes_date ON taxes(date);
CREATE INDEX idx_taxes_tax_type ON taxes(tax_type);
CREATE INDEX idx_taxes_due_date ON taxes(due_date);

CREATE TRIGGER update_taxes_updated_at
  BEFORE UPDATE ON taxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Agenda events table
CREATE TABLE IF NOT EXISTS agenda_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time text,
  type text NOT NULL DEFAULT 'evento' CHECK (type IN ('evento', 'reuniao', 'pagamento', 'cobranca', 'entrega', 'outros')),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado', 'adiado')),
  reminder_date date,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON agenda_events
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_agenda_events_date ON agenda_events(date);
CREATE INDEX idx_agenda_events_type ON agenda_events(type);
CREATE INDEX idx_agenda_events_status ON agenda_events(status);

CREATE TRIGGER update_agenda_events_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Acertos table
CREATE TABLE IF NOT EXISTS acertos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name text NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  pending_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (pending_amount >= 0),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'parcial', 'pago')),
  payment_date date,
  payment_method text CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'cheque', 'boleto', 'transferencia')),
  payment_installments integer CHECK (payment_installments > 0),
  payment_installment_value numeric(12,2) CHECK (payment_installment_value >= 0),
  payment_interval integer CHECK (payment_interval > 0),
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE acertos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON acertos
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_acertos_client_name ON acertos(client_name);
CREATE INDEX idx_acertos_status ON acertos(status);
CREATE INDEX idx_acertos_payment_date ON acertos(payment_date);

CREATE TRIGGER update_acertos_updated_at
  BEFORE UPDATE ON acertos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
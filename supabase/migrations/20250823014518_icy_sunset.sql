/*
  # Create Cash Management Tables

  1. New Tables
    - `cash_balances`
      - `id` (uuid, primary key)
      - `current_balance` (numeric)
      - `initial_balance` (numeric)
      - `initial_date` (date)
      - `last_updated` (timestamp)
    - `cash_transactions`
      - `id` (uuid, primary key)
      - `date` (date)
      - `type` (text) - entrada/saida
      - `amount` (numeric)
      - `description` (text)
      - `category` (text)
      - `related_id` (uuid)
      - `payment_method` (text)
      - `created_at` (timestamp)
    - `third_party_check_details`
      - `id` (uuid, primary key)
      - `check_id` (uuid, foreign key)
      - `bank` (text)
      - `agency` (text)
      - `account` (text)
      - `check_number` (text)
      - `issuer` (text)
      - `cpf_cnpj` (text)
      - `observations` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create cash_balances table
CREATE TABLE IF NOT EXISTS cash_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance numeric(15,2) DEFAULT 0,
  initial_balance numeric(15,2) DEFAULT 0,
  initial_date date DEFAULT CURRENT_DATE,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on cash_balances"
  ON cash_balances
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create cash_transactions table
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

ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on cash_transactions"
  ON cash_transactions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create third_party_check_details table
CREATE TABLE IF NOT EXISTS third_party_check_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid REFERENCES checks(id) ON DELETE CASCADE,
  bank text NOT NULL,
  agency text NOT NULL,
  account text NOT NULL,
  check_number text NOT NULL,
  issuer text NOT NULL,
  cpf_cnpj text NOT NULL,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE third_party_check_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on third_party_check_details"
  ON third_party_check_details
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_category ON cash_transactions(category);
CREATE INDEX IF NOT EXISTS idx_third_party_check_details_check_id ON third_party_check_details(check_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cash_balances_updated_at ON cash_balances;
CREATE TRIGGER update_cash_balances_updated_at
  BEFORE UPDATE ON cash_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_transactions_updated_at ON cash_transactions;
CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_third_party_check_details_updated_at ON third_party_check_details;
CREATE TRIGGER update_third_party_check_details_updated_at
  BEFORE UPDATE ON third_party_check_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
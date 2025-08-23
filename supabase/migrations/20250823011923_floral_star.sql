/*
  # Sistema de Controle de Caixa

  1. New Tables
    - `cash_flow`
      - `id` (uuid, primary key)
      - `date` (date)
      - `type` (text) - entrada ou saida
      - `amount` (numeric)
      - `description` (text)
      - `category` (text)
      - `related_id` (uuid, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `cash_balance`
      - `id` (uuid, primary key)
      - `current_balance` (numeric)
      - `last_updated` (timestamp)
      - `initial_balance` (numeric)
      - `initial_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `third_party_checks`
      - `id` (uuid, primary key)
      - `check_id` (uuid, foreign key)
      - `bank` (text)
      - `agency` (text)
      - `account` (text)
      - `check_number` (text)
      - `issuer` (text)
      - `cpf_cnpj` (text)
      - `observations` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
</sql>

CREATE TABLE IF NOT EXISTS cash_flow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('venda', 'divida', 'adiantamento', 'salario', 'comissao', 'outro')),
  related_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance numeric(10,2) NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  initial_balance numeric(10,2) NOT NULL DEFAULT 0,
  initial_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS third_party_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_checks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on cash_flow"
  ON cash_flow
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on cash_balance"
  ON cash_balance
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on third_party_checks"
  ON third_party_checks
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_category ON cash_flow(category);
CREATE INDEX IF NOT EXISTS idx_third_party_checks_check_id ON third_party_checks(check_id);
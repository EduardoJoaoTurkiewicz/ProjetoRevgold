/*
  # Create taxes table for tax management

  1. New Tables
    - `taxes`
      - `id` (uuid, primary key)
      - `date` (date, when tax was paid)
      - `tax_type` (text, type of tax)
      - `description` (text, description of tax)
      - `amount` (numeric, amount paid)
      - `due_date` (date, original due date)
      - `payment_method` (text, how it was paid)
      - `reference_period` (text, period this tax refers to)
      - `document_number` (text, tax document number)
      - `observations` (text, additional notes)
      - `receipt_file` (text, receipt file path)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `taxes` table
    - Add policy for authenticated users to manage taxes
*/

CREATE TABLE IF NOT EXISTS taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  tax_type text NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) DEFAULT 0 NOT NULL,
  due_date date,
  payment_method text NOT NULL DEFAULT 'dinheiro',
  reference_period text,
  document_number text,
  observations text,
  receipt_file text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on taxes"
  ON taxes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_taxes_date ON taxes USING btree (date);
CREATE INDEX IF NOT EXISTS idx_taxes_tax_type ON taxes USING btree (tax_type);
CREATE INDEX IF NOT EXISTS idx_taxes_due_date ON taxes USING btree (due_date);

CREATE TRIGGER IF NOT EXISTS update_taxes_updated_at
  BEFORE UPDATE ON taxes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for payment methods
ALTER TABLE taxes ADD CONSTRAINT taxes_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['dinheiro'::text, 'pix'::text, 'transferencia'::text, 'cartao_debito'::text, 'cartao_credito'::text, 'cheque'::text, 'boleto'::text, 'outros'::text]));

-- Add constraint for tax types
ALTER TABLE taxes ADD CONSTRAINT taxes_tax_type_check 
  CHECK (tax_type = ANY (ARRAY['irpj'::text, 'csll'::text, 'pis'::text, 'cofins'::text, 'icms'::text, 'iss'::text, 'simples_nacional'::text, 'inss'::text, 'fgts'::text, 'iptu'::text, 'ipva'::text, 'outros'::text]));
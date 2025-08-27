/*
  # Create taxes table

  1. New Tables
    - `taxes`
      - `id` (uuid, primary key)
      - `date` (date, required) - Date when the tax was paid
      - `tax_type` (text, required) - Type of tax (IRPJ, CSLL, PIS, etc.)
      - `description` (text, required) - Description of the tax payment
      - `amount` (numeric, required) - Amount paid
      - `due_date` (date, optional) - Due date of the tax
      - `payment_method` (text, required) - How the tax was paid
      - `reference_period` (text, optional) - Reference period for the tax
      - `document_number` (text, optional) - Document/receipt number
      - `observations` (text, optional) - Additional notes
      - `receipt_file` (text, optional) - Receipt file path/name
      - `created_at` (timestamp) - Record creation timestamp
      - `updated_at` (timestamp) - Record update timestamp

  2. Security
    - Enable RLS on `taxes` table
    - Add policies for authenticated users to perform all operations
    - Add policies for anonymous users to perform all operations (for development)

  3. Triggers
    - Add trigger to automatically update `updated_at` timestamp
    - Add trigger to fix date storage format
*/

-- Create the taxes table
CREATE TABLE IF NOT EXISTS public.taxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  tax_type text NOT NULL CHECK (tax_type IN ('irpj', 'csll', 'pis', 'cofins', 'icms', 'iss', 'simples_nacional', 'inss', 'fgts', 'iptu', 'ipva', 'outros')),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  due_date date,
  payment_method text NOT NULL CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'cartao_debito', 'cartao_credito', 'cheque', 'boleto', 'outros')),
  reference_period text,
  document_number text,
  observations text,
  receipt_file text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow all for authenticated users"
  ON public.taxes
  FOR ALL
  TO authenticated
  USING (true);

-- Create RLS policies for anonymous users (for development)
CREATE POLICY "Allow all operations on taxes"
  ON public.taxes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_taxes_date ON public.taxes USING btree (date);
CREATE INDEX IF NOT EXISTS idx_taxes_tax_type ON public.taxes USING btree (tax_type);
CREATE INDEX IF NOT EXISTS idx_taxes_due_date ON public.taxes USING btree (due_date);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_taxes_updated_at
  BEFORE UPDATE ON public.taxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to fix date storage
CREATE TRIGGER fix_dates_taxes
  BEFORE INSERT OR UPDATE ON public.taxes
  FOR EACH ROW EXECUTE FUNCTION fix_date_storage();
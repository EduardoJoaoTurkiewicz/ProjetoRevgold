/*
  # Criar tabela de tarifas PIX

  1. Nova Tabela
    - `pix_fees`
      - `id` (uuid, primary key)
      - `date` (date, data da tarifa)
      - `amount` (numeric, valor da tarifa)
      - `description` (text, descrição da tarifa)
      - `bank` (text, banco que cobrou)
      - `transaction_type` (text, tipo de transação)
      - `related_transaction_id` (uuid, ID da transação relacionada)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `pix_fees`
    - Adicionar políticas para usuários autenticados
*/

CREATE TABLE IF NOT EXISTS pix_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text NOT NULL,
  bank text NOT NULL,
  transaction_type text NOT NULL DEFAULT 'pix_out',
  related_transaction_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT pix_fees_amount_check CHECK (amount >= 0),
  CONSTRAINT pix_fees_transaction_type_check CHECK (transaction_type = ANY (ARRAY['pix_out'::text, 'pix_in'::text, 'ted'::text, 'doc'::text, 'other'::text]))
);

ALTER TABLE pix_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on pix_fees"
  ON pix_fees
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pix_fees_date ON pix_fees USING btree (date);
CREATE INDEX IF NOT EXISTS idx_pix_fees_bank ON pix_fees USING btree (bank);

CREATE TRIGGER IF NOT EXISTS fix_dates_pix_fees
  BEFORE INSERT OR UPDATE ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION fix_date_storage();

CREATE TRIGGER IF NOT EXISTS update_pix_fees_updated_at
  BEFORE UPDATE ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
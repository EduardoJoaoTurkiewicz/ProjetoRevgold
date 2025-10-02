/*
  # Tabela de Acertos de Clientes

  1. Nova Tabela
    - `acertos` - Gestão de pagamentos mensais de clientes
      - `id` (uuid, primary key)
      - `client_name` (text, nome do cliente)
      - `total_amount` (numeric, valor total do acerto)
      - `paid_amount` (numeric, valor já pago)
      - `pending_amount` (numeric, valor pendente)
      - `status` (text, status do pagamento)
      - `payment_date` (date, data do último pagamento)
      - `payment_method` (text, forma de pagamento)
      - `payment_installments` (integer, número de parcelas)
      - `payment_installment_value` (numeric, valor da parcela)
      - `payment_interval` (integer, intervalo entre parcelas)
      - `observations` (text, observações)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Enable RLS na tabela `acertos`
    - Política permissiva para desenvolvimento
*/

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

CREATE POLICY "Allow all operations" ON acertos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_acertos_client_name ON acertos(client_name);
CREATE INDEX IF NOT EXISTS idx_acertos_status ON acertos(status);
CREATE INDEX IF NOT EXISTS idx_acertos_payment_date ON acertos(payment_date);

CREATE TRIGGER update_acertos_updated_at 
  BEFORE UPDATE ON acertos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON acertos TO anon, authenticated;
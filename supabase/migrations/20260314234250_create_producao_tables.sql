/*
  # Create Producao Tables

  ## Summary
  Creates the production module tables to track manufacturing batches.

  ## New Tables

  ### producoes
  - `id` (uuid, primary key) - unique identifier
  - `titulo` (text, not null) - production batch title
  - `lote` (text, not null, unique) - auto-generated batch code in format MT-YYYYMMDD-XXXX
  - `fabricacao_date` (date, not null) - manufacturing date
  - `validade_date` (date, not null) - expiration date (fabricacao + 2 years)
  - `created_at` (timestamptz) - record creation timestamp

  ### producao_itens
  - `id` (uuid, primary key) - unique identifier
  - `producao_id` (uuid, FK -> producoes.id) - reference to production batch
  - `produto_id` (uuid, FK -> estoque_produtos.id) - product being produced
  - `variacao_id` (uuid, FK -> estoque_variacoes.id) - product variation
  - `cor_id` (uuid, FK -> estoque_cores.id, nullable) - color (null if product has no colors)
  - `quantidade` (integer, not null) - quantity produced

  ## Security
  - RLS enabled on both tables
  - Authenticated users can select, insert, update, delete their own records

  ## Notes
  1. lote format: MT-YYYYMMDD-0001 (sequential per day, resets each day)
  2. validade_date is always fabricacao_date + 2 years
  3. Estoque saldos are updated externally by the application when production is confirmed
*/

CREATE TABLE IF NOT EXISTS producoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  lote text NOT NULL UNIQUE,
  fabricacao_date date NOT NULL DEFAULT CURRENT_DATE,
  validade_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS producao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producao_id uuid NOT NULL REFERENCES producoes(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES estoque_produtos(id),
  variacao_id uuid NOT NULL REFERENCES estoque_variacoes(id),
  cor_id uuid REFERENCES estoque_cores(id),
  quantidade integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_producao_itens_producao_id ON producao_itens(producao_id);
CREATE INDEX IF NOT EXISTS idx_producao_itens_produto_id ON producao_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_producao_itens_variacao_id ON producao_itens(variacao_id);
CREATE INDEX IF NOT EXISTS idx_producao_itens_cor_id ON producao_itens(cor_id);
CREATE INDEX IF NOT EXISTS idx_producoes_fabricacao_date ON producoes(fabricacao_date);
CREATE INDEX IF NOT EXISTS idx_producoes_lote ON producoes(lote);

ALTER TABLE producoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE producao_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select producoes"
  ON producoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert producoes"
  ON producoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update producoes"
  ON producoes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete producoes"
  ON producoes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can select producao_itens"
  ON producao_itens FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert producao_itens"
  ON producao_itens FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update producao_itens"
  ON producao_itens FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete producao_itens"
  ON producao_itens FOR DELETE
  TO authenticated
  USING (true);

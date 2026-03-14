/*
  # Create Estoque (Inventory) Module Tables

  ## Summary
  Creates the complete inventory management system for Montreal Tintas.

  ## New Tables

  ### 1. estoque_produtos
  - Main product catalog table
  - Stores product name, description, and whether it has color variants
  - `tem_cor` boolean controls whether color variants apply (false for items like sandpaper)

  ### 2. estoque_cores
  - Color variants for products that have colors
  - Linked to estoque_produtos via produto_id FK
  - Only used when the parent product has `tem_cor = true`

  ### 3. estoque_variacoes
  - Size/format variations for products (e.g., "18L", "3.6L", "25KG")
  - Each variation has a default unit price
  - Linked to estoque_produtos via produto_id FK

  ### 4. estoque_saldos
  - Stock balance/quantity tracking
  - Junction table between product, variation, and optionally color
  - `cor_id` is NULL for products without colors (`tem_cor = false`)
  - One row per (variacao_id x cor_id) combination, or per variacao_id when no colors

  ## Security
  - RLS enabled on all 4 tables
  - Authenticated users can read and write all inventory data
  - No public access

  ## Indexes
  - Foreign key indexes on all FK columns for join performance
*/

-- estoque_produtos
CREATE TABLE IF NOT EXISTS estoque_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tem_cor boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE estoque_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select estoque_produtos"
  ON estoque_produtos FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert estoque_produtos"
  ON estoque_produtos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update estoque_produtos"
  ON estoque_produtos FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete estoque_produtos"
  ON estoque_produtos FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- estoque_cores
CREATE TABLE IF NOT EXISTS estoque_cores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES estoque_produtos(id) ON DELETE CASCADE,
  nome_cor text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estoque_cores_produto_id_idx ON estoque_cores(produto_id);

ALTER TABLE estoque_cores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select estoque_cores"
  ON estoque_cores FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert estoque_cores"
  ON estoque_cores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update estoque_cores"
  ON estoque_cores FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete estoque_cores"
  ON estoque_cores FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- estoque_variacoes
CREATE TABLE IF NOT EXISTS estoque_variacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES estoque_produtos(id) ON DELETE CASCADE,
  nome_variacao text NOT NULL,
  valor_unitario_padrao numeric NOT NULL DEFAULT 0,
  descricao text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estoque_variacoes_produto_id_idx ON estoque_variacoes(produto_id);

ALTER TABLE estoque_variacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select estoque_variacoes"
  ON estoque_variacoes FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert estoque_variacoes"
  ON estoque_variacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update estoque_variacoes"
  ON estoque_variacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete estoque_variacoes"
  ON estoque_variacoes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- estoque_saldos
CREATE TABLE IF NOT EXISTS estoque_saldos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES estoque_produtos(id) ON DELETE CASCADE,
  variacao_id uuid NOT NULL REFERENCES estoque_variacoes(id) ON DELETE CASCADE,
  cor_id uuid REFERENCES estoque_cores(id) ON DELETE CASCADE,
  quantidade_atual numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estoque_saldos_produto_id_idx ON estoque_saldos(produto_id);
CREATE INDEX IF NOT EXISTS estoque_saldos_variacao_id_idx ON estoque_saldos(variacao_id);
CREATE INDEX IF NOT EXISTS estoque_saldos_cor_id_idx ON estoque_saldos(cor_id);

ALTER TABLE estoque_saldos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select estoque_saldos"
  ON estoque_saldos FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert estoque_saldos"
  ON estoque_saldos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update estoque_saldos"
  ON estoque_saldos FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete estoque_saldos"
  ON estoque_saldos FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

/*
  # Create sale_items and estoque_movimentos tables

  ## Summary
  This migration creates two new tables to support structured sale line items
  and a full audit log of all stock movements.

  ## New Tables

  ### sale_items
  Stores individual product line items per sale (relational, replaces the legacy free-text products field).
  - id: primary key
  - sale_id: FK to sales table
  - produto_id: FK to estoque_produtos
  - variacao_id: FK to estoque_variacoes
  - cor_id: optional FK to estoque_cores
  - quantidade: quantity sold
  - valor_unitario: unit price at time of sale
  - valor_total: computed line total
  - created_at

  ### estoque_movimentos
  Audit log for every stock change (IN/OUT/ADJUST) with origin tracking.
  - id: primary key
  - tipo: IN | OUT | ADJUST
  - origem: SALE_CREATE | SALE_EDIT | SALE_DELETE | PRODUCAO | MANUAL
  - sale_id: optional reference to the sale that caused the movement
  - produto_id, variacao_id, cor_id: which item moved
  - quantidade: absolute quantity of the movement (always positive)
  - created_at

  ## Security
  - RLS enabled on both tables
  - anon role gets SELECT/INSERT/UPDATE/DELETE (matches existing pattern for this app)
*/

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  produto_id uuid NOT NULL,
  variacao_id uuid NOT NULL,
  cor_id uuid NULL,
  quantidade numeric NOT NULL CHECK (quantidade > 0),
  valor_unitario numeric NOT NULL CHECK (valor_unitario >= 0),
  valor_total numeric NOT NULL CHECK (valor_total >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_produto_id ON sale_items(produto_id);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select sale_items"
  ON sale_items FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert sale_items"
  ON sale_items FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update sale_items"
  ON sale_items FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete sale_items"
  ON sale_items FOR DELETE TO anon USING (true);

CREATE POLICY "authenticated can select sale_items"
  ON sale_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert sale_items"
  ON sale_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update sale_items"
  ON sale_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can delete sale_items"
  ON sale_items FOR DELETE TO authenticated USING (true);


CREATE TABLE IF NOT EXISTS estoque_movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('IN', 'OUT', 'ADJUST')),
  origem text NOT NULL CHECK (origem IN ('SALE_CREATE', 'SALE_EDIT', 'SALE_DELETE', 'PRODUCAO', 'MANUAL')),
  sale_id uuid NULL,
  produto_id uuid NOT NULL,
  variacao_id uuid NOT NULL,
  cor_id uuid NULL,
  quantidade numeric NOT NULL CHECK (quantidade > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estoque_movimentos_sale_id ON estoque_movimentos(sale_id);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentos_produto_id ON estoque_movimentos(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentos_created_at ON estoque_movimentos(created_at);

ALTER TABLE estoque_movimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select estoque_movimentos"
  ON estoque_movimentos FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert estoque_movimentos"
  ON estoque_movimentos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "authenticated can select estoque_movimentos"
  ON estoque_movimentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert estoque_movimentos"
  ON estoque_movimentos FOR INSERT TO authenticated WITH CHECK (true);

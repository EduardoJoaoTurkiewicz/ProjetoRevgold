/*
  # Fix Estoque RLS Policies - Allow Anon Role Access

  ## Summary
  The app does not use authentication, so all requests come from the `anon` role.
  The existing policies are scoped to `TO authenticated` only, which blocks all
  INSERT, UPDATE, and DELETE operations.

  ## Changes
  - Drop all existing policies on estoque_produtos, estoque_cores, estoque_variacoes, estoque_saldos
  - Recreate all policies targeting BOTH `anon` and `authenticated` roles

  ## Tables Affected
  - estoque_produtos
  - estoque_cores
  - estoque_variacoes
  - estoque_saldos
*/

-- estoque_produtos
DROP POLICY IF EXISTS "Authenticated users can select estoque_produtos" ON estoque_produtos;
DROP POLICY IF EXISTS "Authenticated users can insert estoque_produtos" ON estoque_produtos;
DROP POLICY IF EXISTS "Authenticated users can update estoque_produtos" ON estoque_produtos;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_produtos" ON estoque_produtos;

CREATE POLICY "Allow select estoque_produtos" ON estoque_produtos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert estoque_produtos" ON estoque_produtos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update estoque_produtos" ON estoque_produtos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete estoque_produtos" ON estoque_produtos FOR DELETE TO anon, authenticated USING (true);

-- estoque_cores
DROP POLICY IF EXISTS "Authenticated users can select estoque_cores" ON estoque_cores;
DROP POLICY IF EXISTS "Authenticated users can insert estoque_cores" ON estoque_cores;
DROP POLICY IF EXISTS "Authenticated users can update estoque_cores" ON estoque_cores;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_cores" ON estoque_cores;

CREATE POLICY "Allow select estoque_cores" ON estoque_cores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert estoque_cores" ON estoque_cores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update estoque_cores" ON estoque_cores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete estoque_cores" ON estoque_cores FOR DELETE TO anon, authenticated USING (true);

-- estoque_variacoes
DROP POLICY IF EXISTS "Authenticated users can select estoque_variacoes" ON estoque_variacoes;
DROP POLICY IF EXISTS "Authenticated users can insert estoque_variacoes" ON estoque_variacoes;
DROP POLICY IF EXISTS "Authenticated users can update estoque_variacoes" ON estoque_variacoes;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_variacoes" ON estoque_variacoes;

CREATE POLICY "Allow select estoque_variacoes" ON estoque_variacoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert estoque_variacoes" ON estoque_variacoes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update estoque_variacoes" ON estoque_variacoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete estoque_variacoes" ON estoque_variacoes FOR DELETE TO anon, authenticated USING (true);

-- estoque_saldos
DROP POLICY IF EXISTS "Authenticated users can select estoque_saldos" ON estoque_saldos;
DROP POLICY IF EXISTS "Authenticated users can insert estoque_saldos" ON estoque_saldos;
DROP POLICY IF EXISTS "Authenticated users can update estoque_saldos" ON estoque_saldos;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_saldos" ON estoque_saldos;

CREATE POLICY "Allow select estoque_saldos" ON estoque_saldos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert estoque_saldos" ON estoque_saldos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update estoque_saldos" ON estoque_saldos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete estoque_saldos" ON estoque_saldos FOR DELETE TO anon, authenticated USING (true);

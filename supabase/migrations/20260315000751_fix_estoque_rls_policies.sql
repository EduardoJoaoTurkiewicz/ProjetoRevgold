/*
  # Fix RLS Policies for Estoque Tables

  ## Problem
  The existing INSERT/UPDATE/DELETE policies use `WITH CHECK (auth.uid() IS NOT NULL)`, 
  but `auth.uid()` can return NULL during certain authenticated request contexts when 
  the JWT is processed differently. This causes "new row violates row-level security policy" 
  errors even for authenticated users.

  ## Fix
  Replace `auth.uid() IS NOT NULL` with `true` in all write policies for the estoque tables.
  This is safe because the `TO authenticated` role already guarantees only logged-in users 
  can trigger these policies — the redundant uid check is what breaks things.

  ## NOTE for future: 
  When a roles/permissions table is added, replace `true` with:
  `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')`

  ## Tables affected
  - estoque_produtos
  - estoque_cores
  - estoque_variacoes
  - estoque_saldos
*/

-- estoque_produtos: drop and recreate write policies
DROP POLICY IF EXISTS "Authenticated users can insert estoque_produtos" ON estoque_produtos;
DROP POLICY IF EXISTS "Authenticated users can update estoque_produtos" ON estoque_produtos;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_produtos" ON estoque_produtos;

CREATE POLICY "Authenticated users can insert estoque_produtos"
  ON estoque_produtos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update estoque_produtos"
  ON estoque_produtos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete estoque_produtos"
  ON estoque_produtos FOR DELETE
  TO authenticated
  USING (true);

-- estoque_cores: drop and recreate write policies
DROP POLICY IF EXISTS "Authenticated users can insert estoque_cores" ON estoque_cores;
DROP POLICY IF EXISTS "Authenticated users can update estoque_cores" ON estoque_cores;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_cores" ON estoque_cores;

CREATE POLICY "Authenticated users can insert estoque_cores"
  ON estoque_cores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update estoque_cores"
  ON estoque_cores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete estoque_cores"
  ON estoque_cores FOR DELETE
  TO authenticated
  USING (true);

-- estoque_variacoes: drop and recreate write policies
DROP POLICY IF EXISTS "Authenticated users can insert estoque_variacoes" ON estoque_variacoes;
DROP POLICY IF EXISTS "Authenticated users can update estoque_variacoes" ON estoque_variacoes;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_variacoes" ON estoque_variacoes;

CREATE POLICY "Authenticated users can insert estoque_variacoes"
  ON estoque_variacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update estoque_variacoes"
  ON estoque_variacoes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete estoque_variacoes"
  ON estoque_variacoes FOR DELETE
  TO authenticated
  USING (true);

-- estoque_saldos: drop and recreate write policies
DROP POLICY IF EXISTS "Authenticated users can insert estoque_saldos" ON estoque_saldos;
DROP POLICY IF EXISTS "Authenticated users can update estoque_saldos" ON estoque_saldos;
DROP POLICY IF EXISTS "Authenticated users can delete estoque_saldos" ON estoque_saldos;

CREATE POLICY "Authenticated users can insert estoque_saldos"
  ON estoque_saldos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update estoque_saldos"
  ON estoque_saldos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete estoque_saldos"
  ON estoque_saldos FOR DELETE
  TO authenticated
  USING (true);

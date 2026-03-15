/*
  # Fix RLS Policies - Allow anon access to producoes and credit card tables

  ## Problem
  All affected tables only had policies for the `authenticated` role, but the app
  uses the `anon` role (no Supabase Auth login). This caused "new row violates
  row-level security policy" errors when trying to insert data.

  ## Changes
  - Drop existing `authenticated`-only policies on:
    - producoes
    - producao_itens
    - credit_card_sales
    - credit_card_sale_installments
    - credit_card_debts
    - credit_card_debt_installments
    - credit_card_acertos
    - credit_card_acerto_installments
    - credit_card_anticipated_sales
    - anticipated_credit_card_sales
  - Recreate all policies targeting both `anon` and `authenticated` roles

  ## Security
  Policies use USING (true) / WITH CHECK (true) consistent with all other tables
  in this project that already follow this same pattern.
*/

-- producoes
DROP POLICY IF EXISTS "Authenticated users can select producoes" ON producoes;
DROP POLICY IF EXISTS "Authenticated users can insert producoes" ON producoes;
DROP POLICY IF EXISTS "Authenticated users can update producoes" ON producoes;
DROP POLICY IF EXISTS "Authenticated users can delete producoes" ON producoes;

CREATE POLICY "Allow select producoes" ON producoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert producoes" ON producoes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update producoes" ON producoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete producoes" ON producoes FOR DELETE TO anon, authenticated USING (true);

-- producao_itens
DROP POLICY IF EXISTS "Authenticated users can select producao_itens" ON producao_itens;
DROP POLICY IF EXISTS "Authenticated users can insert producao_itens" ON producao_itens;
DROP POLICY IF EXISTS "Authenticated users can update producao_itens" ON producao_itens;
DROP POLICY IF EXISTS "Authenticated users can delete producao_itens" ON producao_itens;

CREATE POLICY "Allow select producao_itens" ON producao_itens FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert producao_itens" ON producao_itens FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update producao_itens" ON producao_itens FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete producao_itens" ON producao_itens FOR DELETE TO anon, authenticated USING (true);

-- credit_card_sales
DROP POLICY IF EXISTS "Authenticated users can select credit_card_sales" ON credit_card_sales;
DROP POLICY IF EXISTS "Authenticated users can insert credit_card_sales" ON credit_card_sales;
DROP POLICY IF EXISTS "Authenticated users can update credit_card_sales" ON credit_card_sales;
DROP POLICY IF EXISTS "Authenticated users can delete credit_card_sales" ON credit_card_sales;

CREATE POLICY "Allow select credit_card_sales" ON credit_card_sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert credit_card_sales" ON credit_card_sales FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update credit_card_sales" ON credit_card_sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete credit_card_sales" ON credit_card_sales FOR DELETE TO anon, authenticated USING (true);

-- credit_card_sale_installments
DROP POLICY IF EXISTS "Authenticated users can select credit_card_sale_installments" ON credit_card_sale_installments;
DROP POLICY IF EXISTS "Authenticated users can insert credit_card_sale_installments" ON credit_card_sale_installments;
DROP POLICY IF EXISTS "Authenticated users can update credit_card_sale_installments" ON credit_card_sale_installments;
DROP POLICY IF EXISTS "Authenticated users can delete credit_card_sale_installments" ON credit_card_sale_installments;

CREATE POLICY "Allow select credit_card_sale_installments" ON credit_card_sale_installments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert credit_card_sale_installments" ON credit_card_sale_installments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update credit_card_sale_installments" ON credit_card_sale_installments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete credit_card_sale_installments" ON credit_card_sale_installments FOR DELETE TO anon, authenticated USING (true);

-- credit_card_debts
DROP POLICY IF EXISTS "Authenticated users can select credit_card_debts" ON credit_card_debts;
DROP POLICY IF EXISTS "Authenticated users can insert credit_card_debts" ON credit_card_debts;
DROP POLICY IF EXISTS "Authenticated users can update credit_card_debts" ON credit_card_debts;
DROP POLICY IF EXISTS "Authenticated users can delete credit_card_debts" ON credit_card_debts;

CREATE POLICY "Allow select credit_card_debts" ON credit_card_debts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert credit_card_debts" ON credit_card_debts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update credit_card_debts" ON credit_card_debts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete credit_card_debts" ON credit_card_debts FOR DELETE TO anon, authenticated USING (true);

-- credit_card_debt_installments
DROP POLICY IF EXISTS "Authenticated users can select credit_card_debt_installments" ON credit_card_debt_installments;
DROP POLICY IF EXISTS "Authenticated users can insert credit_card_debt_installments" ON credit_card_debt_installments;
DROP POLICY IF EXISTS "Authenticated users can update credit_card_debt_installments" ON credit_card_debt_installments;
DROP POLICY IF EXISTS "Authenticated users can delete credit_card_debt_installments" ON credit_card_debt_installments;

CREATE POLICY "Allow select credit_card_debt_installments" ON credit_card_debt_installments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert credit_card_debt_installments" ON credit_card_debt_installments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update credit_card_debt_installments" ON credit_card_debt_installments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete credit_card_debt_installments" ON credit_card_debt_installments FOR DELETE TO anon, authenticated USING (true);

-- credit_card_acertos
DROP POLICY IF EXISTS "Authenticated users can select credit_card_acertos" ON credit_card_acertos;
DROP POLICY IF EXISTS "Authenticated users can insert credit_card_acertos" ON credit_card_acertos;
DROP POLICY IF EXISTS "Authenticated users can update credit_card_acertos" ON credit_card_acertos;
DROP POLICY IF EXISTS "Authenticated users can delete credit_card_acertos" ON credit_card_acertos;

CREATE POLICY "Allow select credit_card_acertos" ON credit_card_acertos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert credit_card_acertos" ON credit_card_acertos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update credit_card_acertos" ON credit_card_acertos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete credit_card_acertos" ON credit_card_acertos FOR DELETE TO anon, authenticated USING (true);

-- credit_card_acerto_installments
DROP POLICY IF EXISTS "Authenticated users can select credit_card_acerto_installments" ON credit_card_acerto_installments;
DROP POLICY IF EXISTS "Authenticated users can insert credit_card_acerto_installments" ON credit_card_acerto_installments;
DROP POLICY IF EXISTS "Authenticated users can update credit_card_acerto_installments" ON credit_card_acerto_installments;
DROP POLICY IF EXISTS "Authenticated users can delete credit_card_acerto_installments" ON credit_card_acerto_installments;

CREATE POLICY "Allow select credit_card_acerto_installments" ON credit_card_acerto_installments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert credit_card_acerto_installments" ON credit_card_acerto_installments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update credit_card_acerto_installments" ON credit_card_acerto_installments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete credit_card_acerto_installments" ON credit_card_acerto_installments FOR DELETE TO anon, authenticated USING (true);

-- credit_card_anticipated_sales
DROP POLICY IF EXISTS "Authenticated users can select credit_card_anticipated_sales" ON credit_card_anticipated_sales;
DROP POLICY IF EXISTS "Authenticated users can insert credit_card_anticipated_sales" ON credit_card_anticipated_sales;
DROP POLICY IF EXISTS "Authenticated users can update credit_card_anticipated_sales" ON credit_card_anticipated_sales;
DROP POLICY IF EXISTS "Authenticated users can delete credit_card_anticipated_sales" ON credit_card_anticipated_sales;

CREATE POLICY "Allow select credit_card_anticipated_sales" ON credit_card_anticipated_sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert credit_card_anticipated_sales" ON credit_card_anticipated_sales FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update credit_card_anticipated_sales" ON credit_card_anticipated_sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete credit_card_anticipated_sales" ON credit_card_anticipated_sales FOR DELETE TO anon, authenticated USING (true);

-- anticipated_credit_card_sales
DROP POLICY IF EXISTS "Authenticated users can select anticipated_credit_card_sales" ON anticipated_credit_card_sales;
DROP POLICY IF EXISTS "Authenticated users can insert anticipated_credit_card_sales" ON anticipated_credit_card_sales;
DROP POLICY IF EXISTS "Authenticated users can update anticipated_credit_card_sales" ON anticipated_credit_card_sales;
DROP POLICY IF EXISTS "Authenticated users can delete anticipated_credit_card_sales" ON anticipated_credit_card_sales;

CREATE POLICY "Allow select anticipated_credit_card_sales" ON anticipated_credit_card_sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert anticipated_credit_card_sales" ON anticipated_credit_card_sales FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update anticipated_credit_card_sales" ON anticipated_credit_card_sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete anticipated_credit_card_sales" ON anticipated_credit_card_sales FOR DELETE TO anon, authenticated USING (true);

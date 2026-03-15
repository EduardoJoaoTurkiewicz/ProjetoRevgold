/*
  # Create Clientes Table

  ## Summary
  Creates the customer management module table to track PF (individual) and PJ (company) clients.

  ## New Tables

  ### clientes
  - `id` (uuid, primary key) - unique identifier
  - `tipo` (text, not null) - customer type: 'PF' (Pessoa Física) or 'PJ' (Pessoa Jurídica)
  - `razao_social` (text, nullable) - legal company name (PJ only)
  - `nome_fantasia` (text, nullable) - trade name / fantasy name (PJ only)
  - `nome_completo` (text, nullable) - full name (PF only)
  - `cnpj` (text, nullable) - CNPJ tax ID (PJ only), stored unmasked
  - `cpf` (text, nullable) - CPF tax ID (PF only), stored unmasked
  - `telefone` (text) - phone/WhatsApp number
  - `email` (text, nullable) - email address
  - `endereco_rua` (text, nullable) - street address
  - `endereco_numero` (text, nullable) - address number
  - `endereco_bairro` (text, nullable) - neighborhood
  - `endereco_cidade` (text, not null) - city
  - `endereco_uf` (text, not null) - state abbreviation (2 chars)
  - `endereco_cep` (text, nullable) - postal code
  - `endereco_complemento` (text, nullable) - address complement / reference
  - `vendedor_responsavel_id` (uuid, nullable, FK -> employees.id) - assigned salesperson
  - `tags` (jsonb, default '[]') - array of custom tags
  - `created_at` (timestamptz) - record creation timestamp
  - `updated_at` (timestamptz) - last update timestamp

  ## Security
  - Enable RLS on clientes table
  - Authenticated users can read all clients
  - Authenticated users can insert, update, and delete clients
  - Anonymous users can also read/write (matching pattern of other tables in this project)

  ## Indexes
  - Index on endereco_cidade for city filtering
  - Index on vendedor_responsavel_id for salesperson filtering
  - Index on tipo for type filtering
*/

CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('PF', 'PJ')),
  razao_social text,
  nome_fantasia text,
  nome_completo text,
  cnpj text,
  cpf text,
  telefone text NOT NULL DEFAULT '',
  email text,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text NOT NULL DEFAULT '',
  endereco_uf text NOT NULL DEFAULT '',
  endereco_cep text,
  endereco_complemento text,
  vendedor_responsavel_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clientes_cidade_idx ON clientes(endereco_cidade);
CREATE INDEX IF NOT EXISTS clientes_vendedor_idx ON clientes(vendedor_responsavel_id);
CREATE INDEX IF NOT EXISTS clientes_tipo_idx ON clientes(tipo);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clientes"
  ON clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON clientes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can read clientes"
  ON clientes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can insert clientes"
  ON clientes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon users can update clientes"
  ON clientes FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can delete clientes"
  ON clientes FOR DELETE
  TO anon
  USING (true);

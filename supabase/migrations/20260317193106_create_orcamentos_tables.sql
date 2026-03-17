/*
  # Criar tabelas de Orçamentos

  ## Resumo
  Implementação do módulo de orçamentos, permitindo a criação e gestão de propostas
  comerciais que podem ser convertidas em vendas sem impactar o estoque físico.

  ## Novas Tabelas

  ### orcamentos
  - `id` (uuid, PK) - Identificador único
  - `numero` (serial) - Número sequencial do orçamento para exibição
  - `cliente_id` (uuid, FK nullable) - Referência ao cliente cadastrado
  - `cliente_nome` (text) - Nome do cliente (desnormalizado para histórico)
  - `vendedor` (text) - Nome do vendedor responsável
  - `data_criacao` (date) - Data de criação do orçamento
  - `data_validade` (date) - Data de vencimento da validade do orçamento
  - `valor_total` (numeric) - Valor total calculado
  - `status` (text) - Estado: pendente / convertido / vencido
  - `observacoes` (text) - Observações livres
  - `venda_id` (uuid, nullable) - ID da venda gerada após conversão
  - `created_at` / `updated_at` (timestamptz)

  ### orcamento_itens
  - `id` (uuid, PK) - Identificador único
  - `orcamento_id` (uuid, FK) - Referência ao orçamento (CASCADE DELETE)
  - `produto_id` (uuid, FK) - Referência ao produto no estoque
  - `variacao_id` (uuid, FK) - Referência à variação do produto
  - `cor_id` (uuid, FK nullable) - Referência à cor, se aplicável
  - `nome_produto` (text) - Nome desnormalizado
  - `nome_variacao` (text) - Nome da variação desnormalizado
  - `nome_cor` (text, nullable) - Nome da cor desnormalizado
  - `quantidade` (numeric) - Quantidade do item
  - `valor_unitario` (numeric) - Valor unitário
  - `subtotal` (numeric) - Subtotal calculado

  ## Segurança
  - RLS habilitado em ambas as tabelas
  - Acesso permitido a usuários autenticados e anônimos (consistente com o padrão do sistema)
*/

CREATE TABLE IF NOT EXISTS orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial NOT NULL,
  cliente_id uuid,
  cliente_nome text NOT NULL DEFAULT '',
  vendedor text NOT NULL DEFAULT '',
  data_criacao date NOT NULL DEFAULT CURRENT_DATE,
  data_validade date NOT NULL,
  valor_total numeric(15, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'convertido', 'vencido')),
  observacoes text,
  venda_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL,
  variacao_id uuid NOT NULL,
  cor_id uuid,
  nome_produto text NOT NULL DEFAULT '',
  nome_variacao text NOT NULL DEFAULT '',
  nome_cor text,
  quantidade numeric(15, 3) NOT NULL DEFAULT 1,
  valor_unitario numeric(15, 2) NOT NULL DEFAULT 0,
  subtotal numeric(15, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select orcamentos"
  ON orcamentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can select orcamentos"
  ON orcamentos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can insert orcamentos"
  ON orcamentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon users can insert orcamentos"
  ON orcamentos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orcamentos"
  ON orcamentos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can update orcamentos"
  ON orcamentos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orcamentos"
  ON orcamentos FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can delete orcamentos"
  ON orcamentos FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can select orcamento_itens"
  ON orcamento_itens FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can select orcamento_itens"
  ON orcamento_itens FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can insert orcamento_itens"
  ON orcamento_itens FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon users can insert orcamento_itens"
  ON orcamento_itens FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orcamento_itens"
  ON orcamento_itens FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can update orcamento_itens"
  ON orcamento_itens FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orcamento_itens"
  ON orcamento_itens FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon users can delete orcamento_itens"
  ON orcamento_itens FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_validade ON orcamentos(data_validade);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id ON orcamento_itens(orcamento_id);

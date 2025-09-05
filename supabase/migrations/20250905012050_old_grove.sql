/*
  # Adicionar campo delivery_date à tabela sales

  1. Alterações na Tabela
    - Adicionar coluna `delivery_date` (date, opcional) à tabela `sales`
    - Campo para armazenar a data de entrega prevista da venda

  2. Segurança
    - Nenhuma alteração nas políticas RLS (campo não sensível)
    - Campo opcional, não afeta vendas existentes

  3. Observações
    - Campo opcional para melhor controle logístico
    - Compatível com o front-end existente
*/

-- Adicionar coluna delivery_date à tabela sales se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'delivery_date'
  ) THEN
    ALTER TABLE sales ADD COLUMN delivery_date date;
    
    -- Adicionar comentário explicativo
    COMMENT ON COLUMN sales.delivery_date IS 'Data prevista para entrega dos produtos da venda';
    
    -- Criar índice para consultas por data de entrega
    CREATE INDEX IF NOT EXISTS idx_sales_delivery_date ON sales(delivery_date) WHERE delivery_date IS NOT NULL;
    
    RAISE NOTICE 'Coluna delivery_date adicionada à tabela sales com sucesso';
  ELSE
    RAISE NOTICE 'Coluna delivery_date já existe na tabela sales';
  END IF;
END $$;
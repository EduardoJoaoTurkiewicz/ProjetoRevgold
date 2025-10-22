/*
  # Adicionar campo supplier_name à tabela checks
  
  1. Alterações
    - Adiciona coluna `supplier_name` à tabela `checks`
    - Este campo armazena o nome do fornecedor quando o cheque é usado para pagamento de dívidas
  
  2. Notas
    - Campo opcional (nullable)
    - Permite rastrear qual fornecedor foi pago com cada cheque
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'supplier_name'
  ) THEN
    ALTER TABLE checks ADD COLUMN supplier_name TEXT;
  END IF;
END $$;
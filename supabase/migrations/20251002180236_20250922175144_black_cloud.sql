/*
  # Extensão da Tabela Acertos para Empresas

  1. Alterações na Tabela
    - Adicionar campo `company_name` para distinguir empresas
    - Adicionar campo `type` para distinguir entre cliente e empresa
    - Adicionar campo `related_debts` para vincular dívidas
    - Adicionar campo `available_checks` para cheques disponíveis

  2. Índices
    - Índice para `company_name`
    - Índice para `type`
    - Índice composto para busca eficiente

  3. Segurança
    - Manter RLS habilitado
    - Políticas permissivas para desenvolvimento
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'acertos' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE acertos ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'acertos' AND column_name = 'type'
  ) THEN
    ALTER TABLE acertos ADD COLUMN type text NOT NULL DEFAULT 'cliente' CHECK (type IN ('cliente', 'empresa'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'acertos' AND column_name = 'related_debts'
  ) THEN
    ALTER TABLE acertos ADD COLUMN related_debts jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'acertos' AND column_name = 'available_checks'
  ) THEN
    ALTER TABLE acertos ADD COLUMN available_checks jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_acertos_company_name ON acertos(company_name);
CREATE INDEX IF NOT EXISTS idx_acertos_type ON acertos(type);
CREATE INDEX IF NOT EXISTS idx_acertos_type_client ON acertos(type, client_name);
CREATE INDEX IF NOT EXISTS idx_acertos_type_company ON acertos(type, company_name);

CREATE OR REPLACE FUNCTION create_acerto_from_debt()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  acerto_amount NUMERIC := 0;
  existing_acerto RECORD;
  new_total_amount NUMERIC;
  new_pending_amount NUMERIC;
BEGIN
  FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    IF payment_method->>'type' = 'acerto' THEN
      acerto_amount := acerto_amount + COALESCE((payment_method->>'amount')::NUMERIC, 0);
    END IF;
  END LOOP;
  
  IF acerto_amount > 0 THEN
    SELECT * INTO existing_acerto 
    FROM acertos 
    WHERE client_name = NEW.company AND type = 'empresa'
    LIMIT 1;
    
    IF existing_acerto IS NOT NULL THEN
      new_total_amount := existing_acerto.total_amount + acerto_amount;
      new_pending_amount := new_total_amount - existing_acerto.paid_amount;
      
      UPDATE acertos 
      SET 
        total_amount = new_total_amount,
        pending_amount = new_pending_amount,
        updated_at = now()
      WHERE id = existing_acerto.id;
      
    ELSE
      INSERT INTO acertos (
        client_name,
        company_name,
        type,
        total_amount,
        paid_amount,
        pending_amount,
        status
      ) VALUES (
        NEW.company,
        NEW.company,
        'empresa',
        acerto_amount,
        0,
        acerto_amount,
        'pendente'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_acerto_from_debt
  AFTER INSERT ON debts
  FOR EACH ROW EXECUTE FUNCTION create_acerto_from_debt();

CREATE OR REPLACE FUNCTION update_acerto_related_debts()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  has_acerto BOOLEAN := false;
  related_debts_array JSONB;
BEGIN
  FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    IF payment_method->>'type' = 'acerto' THEN
      has_acerto := true;
      EXIT;
    END IF;
  END LOOP;
  
  IF has_acerto THEN
    SELECT related_debts INTO related_debts_array
    FROM acertos 
    WHERE client_name = NEW.company AND type = 'empresa'
    LIMIT 1;
    
    IF related_debts_array IS NULL THEN
      related_debts_array := '[]'::jsonb;
    END IF;
    
    IF NOT (related_debts_array ? NEW.id::text) THEN
      related_debts_array := related_debts_array || jsonb_build_array(NEW.id);
      
      UPDATE acertos 
      SET related_debts = related_debts_array
      WHERE client_name = NEW.company AND type = 'empresa';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_acerto_related_debts
  AFTER INSERT ON debts
  FOR EACH ROW EXECUTE FUNCTION update_acerto_related_debts();

GRANT EXECUTE ON FUNCTION create_acerto_from_debt() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_acerto_related_debts() TO anon, authenticated;
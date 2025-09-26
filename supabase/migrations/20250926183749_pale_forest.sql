/*
  # Sistema de Permutas - Gestão de Veículos em Troca

  1. Nova Tabela
    - `permutas` - Gestão de veículos recebidos em troca
      - `id` (uuid, primary key)
      - `client_name` (text, nome do cliente que deu o veículo)
      - `vehicle_make` (text, marca do veículo)
      - `vehicle_model` (text, modelo do veículo)
      - `vehicle_year` (integer, ano do veículo)
      - `vehicle_plate` (text, placa do veículo)
      - `vehicle_chassis` (text, chassi do veículo)
      - `vehicle_color` (text, cor do veículo)
      - `vehicle_mileage` (integer, quilometragem)
      - `vehicle_value` (numeric, valor avaliado do veículo)
      - `consumed_value` (numeric, valor já consumido em vendas)
      - `remaining_value` (numeric, valor restante disponível)
      - `status` (text, status da permuta)
      - `notes` (text, observações sobre o veículo)
      - `registration_date` (date, data de registro)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Enable RLS na tabela `permutas`
    - Política permissiva para desenvolvimento

  3. Índices
    - Índices para performance em consultas frequentes
*/

-- Criar tabela de permutas
CREATE TABLE IF NOT EXISTS permutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year integer NOT NULL CHECK (vehicle_year >= 1900 AND vehicle_year <= 2030),
  vehicle_plate text NOT NULL,
  vehicle_chassis text,
  vehicle_color text,
  vehicle_mileage integer DEFAULT 0 CHECK (vehicle_mileage >= 0),
  vehicle_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (vehicle_value >= 0),
  consumed_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (consumed_value >= 0),
  remaining_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (remaining_value >= 0),
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado', 'cancelado')),
  notes text,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE permutas ENABLE ROW LEVEL SECURITY;

-- Política permissiva para desenvolvimento
CREATE POLICY "Allow all operations" ON permutas 
  FOR ALL TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_permutas_client_name ON permutas(client_name);
CREATE INDEX IF NOT EXISTS idx_permutas_status ON permutas(status);
CREATE INDEX IF NOT EXISTS idx_permutas_vehicle_plate ON permutas(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_permutas_registration_date ON permutas(registration_date);

-- Trigger para updated_at
CREATE TRIGGER update_permutas_updated_at 
  BEFORE UPDATE ON permutas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar valores da permuta automaticamente
CREATE OR REPLACE FUNCTION update_permuta_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular valor restante
  NEW.remaining_value := NEW.vehicle_value - NEW.consumed_value;
  
  -- Atualizar status baseado no valor restante
  IF NEW.remaining_value <= 0 THEN
    NEW.status := 'finalizado';
  ELSIF NEW.consumed_value > 0 THEN
    NEW.status := 'ativo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar valores automaticamente
CREATE TRIGGER auto_update_permuta_values
  BEFORE INSERT OR UPDATE ON permutas
  FOR EACH ROW EXECUTE FUNCTION update_permuta_values();

-- Função para processar venda com permuta
CREATE OR REPLACE FUNCTION process_permuta_sale()
RETURNS TRIGGER AS $$
DECLARE
  payment_method jsonb;
  permuta_amount numeric := 0;
  permuta_vehicle_id uuid;
  current_permuta RECORD;
BEGIN
  -- Verificar se há método de pagamento "permuta"
  FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    IF payment_method->>'type' = 'permuta' THEN
      permuta_amount := COALESCE((payment_method->>'amount')::numeric, 0);
      
      -- Tentar extrair o ID do veículo do método de pagamento
      IF payment_method->>'vehicle_id' IS NOT NULL THEN
        BEGIN
          permuta_vehicle_id := (payment_method->>'vehicle_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          permuta_vehicle_id := NULL;
        END;
      END IF;
      
      -- Se não temos ID específico, buscar veículo ativo do cliente
      IF permuta_vehicle_id IS NULL THEN
        SELECT id INTO permuta_vehicle_id
        FROM permutas 
        WHERE client_name = NEW.client 
          AND status = 'ativo' 
          AND remaining_value >= permuta_amount
        ORDER BY registration_date ASC
        LIMIT 1;
      END IF;
      
      -- Atualizar permuta se encontrada
      IF permuta_vehicle_id IS NOT NULL THEN
        SELECT * INTO current_permuta FROM permutas WHERE id = permuta_vehicle_id;
        
        IF current_permuta IS NOT NULL AND current_permuta.remaining_value >= permuta_amount THEN
          UPDATE permutas 
          SET 
            consumed_value = consumed_value + permuta_amount,
            updated_at = now()
          WHERE id = permuta_vehicle_id;
          
          -- Log da operação
          INSERT INTO cash_transactions (
            date,
            type,
            amount,
            description,
            category,
            related_id,
            payment_method
          ) VALUES (
            NEW.date,
            'entrada',
            0, -- Valor zero pois não afeta o caixa
            'Venda com permuta - ' || NEW.client || ' (Veículo: ' || current_permuta.vehicle_make || ' ' || current_permuta.vehicle_model || ')',
            'venda',
            NEW.id,
            'permuta'
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar vendas com permuta
CREATE TRIGGER auto_process_permuta_sale
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION process_permuta_sale();

-- Permissões
GRANT ALL ON permutas TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_permuta_values() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_permuta_sale() TO anon, authenticated;
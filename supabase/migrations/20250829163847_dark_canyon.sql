/*
  # Correção do Sistema de Caixa e Prevenção de Duplicatas

  1. Correções no Sistema de Caixa
    - Garantir que apenas um registro de saldo existe
    - Melhorar triggers para atualização automática
    - Corrigir função de atualização do saldo

  2. Prevenção de Duplicatas
    - Adicionar constraints únicos para prevenir duplicações
    - Melhorar validações de dados

  3. Correções Gerais
    - Corrigir triggers que podem estar causando problemas
    - Melhorar integridade dos dados
*/

-- 1. CORRIGIR SISTEMA DE CAIXA

-- Garantir que existe apenas um registro de saldo
DELETE FROM cash_balances WHERE id NOT IN (
  SELECT id FROM cash_balances ORDER BY created_at LIMIT 1
);

-- Se não existe nenhum saldo, criar um inicial
INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
SELECT 0, 0, CURRENT_DATE, now()
WHERE NOT EXISTS (SELECT 1 FROM cash_balances);

-- Melhorar a função de atualização do saldo do caixa
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_record RECORD;
  amount_change NUMERIC := 0;
BEGIN
  -- Obter o registro de saldo atual
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at LIMIT 1;
  
  -- Se não existe saldo, criar um
  IF balance_record IS NULL THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, now());
    SELECT * INTO balance_record FROM cash_balances ORDER BY created_at LIMIT 1;
  END IF;

  -- Calcular mudança no saldo baseado na operação
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      amount_change := NEW.amount;
    ELSE
      amount_change := -NEW.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter transação antiga
    IF OLD.type = 'entrada' THEN
      amount_change := -OLD.amount;
    ELSE
      amount_change := OLD.amount;
    END IF;
    -- Aplicar nova transação
    IF NEW.type = 'entrada' THEN
      amount_change := amount_change + NEW.amount;
    ELSE
      amount_change := amount_change - NEW.amount;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverter transação deletada
    IF OLD.type = 'entrada' THEN
      amount_change := -OLD.amount;
    ELSE
      amount_change := OLD.amount;
    END IF;
  END IF;

  -- Atualizar saldo
  UPDATE cash_balances 
  SET 
    current_balance = current_balance + amount_change,
    last_updated = now(),
    updated_at = now()
  WHERE id = balance_record.id;

  -- Log da operação
  RAISE NOTICE 'Saldo atualizado: % (mudança: %)', balance_record.current_balance + amount_change, amount_change;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. MELHORAR TRIGGERS PARA TRANSAÇÕES AUTOMÁTICAS DE CAIXA

-- Função melhorada para lidar com vendas
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
BEGIN
  -- Processar cada método de pagamento
  FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    -- Apenas métodos que afetam o caixa imediatamente
    IF (payment_method->>'type') IN ('dinheiro', 'pix', 'cartao_debito') OR 
       ((payment_method->>'type') = 'cartao_credito' AND 
        (payment_method->>'installments' IS NULL OR (payment_method->>'installments')::int = 1)) THEN
      
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
        (payment_method->>'amount')::numeric,
        'Venda - ' || NEW.client || ' (' || (payment_method->>'type') || ')',
        'venda',
        NEW.id,
        payment_method->>'type'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função melhorada para boletos
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas quando status muda para compensado
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    -- Calcular valor líquido (valor final menos custos de cartório)
    DECLARE
      net_amount NUMERIC := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
    BEGIN
      -- Entrada do valor líquido
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        CURRENT_DATE,
        'entrada',
        net_amount,
        'Boleto compensado - ' || NEW.client,
        'boleto',
        NEW.id,
        'boleto'
      );
      
      -- Se houve custos de cartório, registrar como saída
      IF COALESCE(NEW.notary_costs, 0) > 0 THEN
        INSERT INTO cash_transactions (
          date,
          type,
          amount,
          description,
          category,
          related_id,
          payment_method
        ) VALUES (
          CURRENT_DATE,
          'saida',
          NEW.notary_costs,
          'Custos de cartório - Boleto ' || NEW.client,
          'outro',
          NEW.id,
          'outros'
        );
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função melhorada para cheques
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas quando status muda para compensado
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    IF NEW.is_own_check THEN
      -- Cheque próprio = saída de caixa
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        CURRENT_DATE,
        'saida',
        NEW.value,
        'Cheque próprio pago - ' || NEW.client,
        'cheque',
        NEW.id,
        'cheque'
      );
    ELSE
      -- Cheque de terceiros = entrada de caixa
      INSERT INTO cash_transactions (
        date,
        type,
        amount,
        description,
        category,
        related_id,
        payment_method
      ) VALUES (
        CURRENT_DATE,
        'entrada',
        NEW.value,
        'Cheque compensado - ' || NEW.client,
        'cheque',
        NEW.id,
        'cheque'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para pagamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar saída de caixa para pagamento de funcionário
  INSERT INTO cash_transactions (
    date,
    type,
    amount,
    description,
    category,
    related_id,
    payment_method
  ) VALUES (
    NEW.payment_date,
    'saida',
    NEW.amount,
    'Pagamento de salário - Funcionário ID: ' || NEW.employee_id,
    'salario',
    NEW.id,
    'dinheiro'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para adiantamentos
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar saída de caixa para adiantamento
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
    'saida',
    NEW.amount,
    'Adiantamento - Funcionário ID: ' || NEW.employee_id,
    'adiantamento',
    NEW.id,
    NEW.payment_method
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para tarifas PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar saída de caixa para tarifa PIX
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
    'saida',
    NEW.amount,
    'Tarifa PIX - ' || NEW.bank || ': ' || NEW.description,
    'outro',
    NEW.id,
    'pix'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para impostos
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar saída de caixa para pagamento de imposto
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
    'saida',
    NEW.amount,
    'Imposto - ' || NEW.description,
    'outro',
    NEW.id,
    NEW.payment_method
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ADICIONAR CONSTRAINTS PARA PREVENIR DUPLICATAS

-- Constraint para vendas (cliente + data + valor total)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sales_unique_constraint'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT sales_unique_constraint 
    UNIQUE (client, date, total_value);
  END IF;
END $$;

-- Constraint para dívidas (empresa + data + valor + descrição)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'debts_unique_constraint'
  ) THEN
    ALTER TABLE debts ADD CONSTRAINT debts_unique_constraint 
    UNIQUE (company, date, total_value, description);
  END IF;
END $$;

-- Constraint para funcionários (nome + cargo + salário)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_unique_constraint'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_unique_constraint 
    UNIQUE (name, position, salary);
  END IF;
END $$;

-- Constraint para boletos (cliente + valor + vencimento + parcela)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'boletos_unique_constraint'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT boletos_unique_constraint 
    UNIQUE (client, value, due_date, installment_number, total_installments);
  END IF;
END $$;

-- Constraint para cheques (cliente + valor + vencimento + parcela)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'checks_unique_constraint'
  ) THEN
    ALTER TABLE checks ADD CONSTRAINT checks_unique_constraint 
    UNIQUE (client, value, due_date, installment_number, total_installments);
  END IF;
END $$;

-- Constraint para comissões (funcionário + venda)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employee_commissions_unique_constraint'
  ) THEN
    ALTER TABLE employee_commissions ADD CONSTRAINT employee_commissions_unique_constraint 
    UNIQUE (employee_id, sale_id);
  END IF;
END $$;

-- 4. GARANTIR QUE OS TRIGGERS ESTÃO CORRETOS

-- Recriar trigger para vendas
DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION handle_sale_cash_transaction();

-- Recriar trigger para boletos
DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION handle_boleto_payment();

-- Recriar trigger para cheques
DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW
  EXECUTE FUNCTION handle_check_payment();

-- Recriar trigger para pagamentos de funcionários
DROP TRIGGER IF EXISTS auto_handle_employee_payment ON employee_payments;
CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_payment();

-- Recriar trigger para adiantamentos
DROP TRIGGER IF EXISTS auto_handle_employee_advance ON employee_advances;
CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_advance();

-- Recriar trigger para tarifas PIX
DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION handle_pix_fee();

-- Recriar trigger para impostos
DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW
  EXECUTE FUNCTION handle_tax_payment();

-- Trigger para atualizar saldo do caixa
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_balance();

-- 5. FUNÇÃO PARA RECALCULAR SALDO DO CAIXA BASEADO EM TODAS AS TRANSAÇÕES

CREATE OR REPLACE FUNCTION recalculate_cash_balance()
RETURNS VOID AS $$
DECLARE
  total_entries NUMERIC := 0;
  total_exits NUMERIC := 0;
  new_balance NUMERIC := 0;
  balance_record RECORD;
BEGIN
  -- Calcular total de entradas
  SELECT COALESCE(SUM(amount), 0) INTO total_entries
  FROM cash_transactions
  WHERE type = 'entrada';

  -- Calcular total de saídas
  SELECT COALESCE(SUM(amount), 0) INTO total_exits
  FROM cash_transactions
  WHERE type = 'saida';

  -- Calcular novo saldo
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at LIMIT 1;
  
  IF balance_record IS NOT NULL THEN
    new_balance := COALESCE(balance_record.initial_balance, 0) + total_entries - total_exits;
    
    UPDATE cash_balances 
    SET 
      current_balance = new_balance,
      last_updated = now(),
      updated_at = now()
    WHERE id = balance_record.id;
  END IF;

  RAISE NOTICE 'Saldo recalculado: % (Entradas: %, Saídas: %)', new_balance, total_entries, total_exits;
END;
$$ LANGUAGE plpgsql;

-- 6. LIMPAR TRANSAÇÕES DUPLICADAS DE CAIXA

-- Remover transações duplicadas de caixa
DELETE FROM cash_transactions a USING cash_transactions b
WHERE a.id > b.id
  AND a.date = b.date
  AND a.type = b.type
  AND a.amount = b.amount
  AND a.description = b.description
  AND a.category = b.category
  AND COALESCE(a.related_id, '') = COALESCE(b.related_id, '');

-- 7. RECALCULAR SALDO APÓS LIMPEZA

SELECT recalculate_cash_balance();

-- 8. ADICIONAR ÍNDICES PARA MELHOR PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_cash_transactions_date_type ON cash_transactions(date, type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_related_id ON cash_transactions(related_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_category ON cash_transactions(category);

-- 9. FUNÇÃO PARA VERIFICAR INTEGRIDADE DO SISTEMA

CREATE OR REPLACE FUNCTION check_system_integrity()
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  potential_duplicates BIGINT,
  status TEXT
) AS $$
BEGIN
  -- Verificar vendas
  RETURN QUERY
  SELECT 
    'sales'::TEXT,
    COUNT(*)::BIGINT,
    (COUNT(*) - COUNT(DISTINCT (client, date, total_value)))::BIGINT,
    CASE 
      WHEN COUNT(*) = COUNT(DISTINCT (client, date, total_value)) THEN 'OK'
      ELSE 'DUPLICATAS ENCONTRADAS'
    END::TEXT
  FROM sales;

  -- Verificar dívidas
  RETURN QUERY
  SELECT 
    'debts'::TEXT,
    COUNT(*)::BIGINT,
    (COUNT(*) - COUNT(DISTINCT (company, date, total_value, description)))::BIGINT,
    CASE 
      WHEN COUNT(*) = COUNT(DISTINCT (company, date, total_value, description)) THEN 'OK'
      ELSE 'DUPLICATAS ENCONTRADAS'
    END::TEXT
  FROM debts;

  -- Verificar funcionários
  RETURN QUERY
  SELECT 
    'employees'::TEXT,
    COUNT(*)::BIGINT,
    (COUNT(*) - COUNT(DISTINCT (name, position, salary)))::BIGINT,
    CASE 
      WHEN COUNT(*) = COUNT(DISTINCT (name, position, salary)) THEN 'OK'
      ELSE 'DUPLICATAS ENCONTRADAS'
    END::TEXT
  FROM employees;

  -- Verificar saldo do caixa
  RETURN QUERY
  SELECT 
    'cash_balances'::TEXT,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) > 1 THEN COUNT(*) - 1 ELSE 0 END::BIGINT,
    CASE 
      WHEN COUNT(*) = 1 THEN 'OK'
      WHEN COUNT(*) = 0 THEN 'NENHUM SALDO ENCONTRADO'
      ELSE 'MÚLTIPLOS SALDOS ENCONTRADOS'
    END::TEXT
  FROM cash_balances;
END;
$$ LANGUAGE plpgsql;

-- 10. EXECUTAR VERIFICAÇÃO DE INTEGRIDADE

SELECT * FROM check_system_integrity();
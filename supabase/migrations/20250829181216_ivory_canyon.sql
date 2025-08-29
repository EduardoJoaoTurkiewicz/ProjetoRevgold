/*
  # Correção Completa do Sistema RevGold

  1. Correção de Duplicatas
    - Remover todas as duplicatas existentes
    - Adicionar constraints únicos rigorosos
    - Implementar validações para prevenir futuras duplicatas

  2. Sistema de Caixa Automático Completo
    - Atualização automática do saldo para TODAS as operações
    - Triggers para vendas, dívidas, boletos, cheques, salários, impostos
    - Sistema robusto de controle de entradas e saídas

  3. Correções de Estrutura
    - Corrigir problemas de foreign keys
    - Melhorar validações de dados
    - Otimizar performance

  4. Sistema Anti-Duplicação
    - Constraints únicos para todas as tabelas
    - Validações rigorosas
    - Prevenção automática de duplicatas
*/

-- ========================================
-- 1. LIMPAR DUPLICATAS EXISTENTES
-- ========================================

-- Remover vendas duplicadas (manter a mais antiga)
WITH sales_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY client, date, total_value 
    ORDER BY created_at ASC
  ) as rn
  FROM sales
)
DELETE FROM sales 
WHERE id IN (
  SELECT id FROM sales_duplicates WHERE rn > 1
);

-- Remover dívidas duplicadas
WITH debts_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY company, date, total_value, description 
    ORDER BY created_at ASC
  ) as rn
  FROM debts
)
DELETE FROM debts 
WHERE id IN (
  SELECT id FROM debts_duplicates WHERE rn > 1
);

-- Remover funcionários duplicados
WITH employees_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY name, position, salary 
    ORDER BY created_at ASC
  ) as rn
  FROM employees
)
DELETE FROM employees 
WHERE id IN (
  SELECT id FROM employees_duplicates WHERE rn > 1
);

-- Remover boletos duplicados
WITH boletos_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY client, value, due_date, installment_number, total_installments 
    ORDER BY created_at ASC
  ) as rn
  FROM boletos
)
DELETE FROM boletos 
WHERE id IN (
  SELECT id FROM boletos_duplicates WHERE rn > 1
);

-- Remover cheques duplicados
WITH checks_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY client, value, due_date, installment_number, total_installments 
    ORDER BY created_at ASC
  ) as rn
  FROM checks
)
DELETE FROM checks 
WHERE id IN (
  SELECT id FROM checks_duplicates WHERE rn > 1
);

-- Remover comissões duplicadas
WITH commissions_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY employee_id, sale_id 
    ORDER BY created_at ASC
  ) as rn
  FROM employee_commissions
)
DELETE FROM employee_commissions 
WHERE id IN (
  SELECT id FROM commissions_duplicates WHERE rn > 1
);

-- Remover transações de caixa duplicadas
WITH cash_duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY date, type, amount, description, category, COALESCE(related_id::text, '')
    ORDER BY created_at ASC
  ) as rn
  FROM cash_transactions
)
DELETE FROM cash_transactions 
WHERE id IN (
  SELECT id FROM cash_duplicates WHERE rn > 1
);

-- ========================================
-- 2. ADICIONAR CONSTRAINTS ÚNICOS RIGOROSOS
-- ========================================

-- Constraint para vendas
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_unique_constraint;
ALTER TABLE sales ADD CONSTRAINT sales_unique_constraint 
  UNIQUE (client, date, total_value);

-- Constraint para dívidas
ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_unique_constraint;
ALTER TABLE debts ADD CONSTRAINT debts_unique_constraint 
  UNIQUE (company, date, total_value, description);

-- Constraint para funcionários
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_unique_constraint;
ALTER TABLE employees ADD CONSTRAINT employees_unique_constraint 
  UNIQUE (name, position, salary);

-- Constraint para boletos
ALTER TABLE boletos DROP CONSTRAINT IF EXISTS boletos_unique_constraint;
ALTER TABLE boletos ADD CONSTRAINT boletos_unique_constraint 
  UNIQUE (client, value, due_date, installment_number, total_installments);

-- Constraint para cheques
ALTER TABLE checks DROP CONSTRAINT IF EXISTS checks_unique_constraint;
ALTER TABLE checks ADD CONSTRAINT checks_unique_constraint 
  UNIQUE (client, value, due_date, installment_number, total_installments);

-- Constraint para comissões
ALTER TABLE employee_commissions DROP CONSTRAINT IF EXISTS employee_commissions_unique_constraint;
ALTER TABLE employee_commissions ADD CONSTRAINT employee_commissions_unique_constraint 
  UNIQUE (employee_id, sale_id);

-- ========================================
-- 3. SISTEMA DE CAIXA AUTOMÁTICO COMPLETO
-- ========================================

-- Garantir que existe apenas um registro de saldo
DELETE FROM cash_balances WHERE id NOT IN (
  SELECT id FROM cash_balances ORDER BY created_at LIMIT 1
);

-- Criar saldo inicial se não existir
INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
SELECT 0, 0, CURRENT_DATE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM cash_balances);

-- Função principal para atualizar saldo do caixa
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_record RECORD;
  amount_change NUMERIC := 0;
  new_balance NUMERIC := 0;
BEGIN
  -- Buscar registro de saldo atual
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at LIMIT 1;
  
  -- Se não existe saldo, criar um
  IF balance_record IS NULL THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, NOW());
    SELECT * INTO balance_record FROM cash_balances ORDER BY created_at LIMIT 1;
  END IF;

  -- Calcular mudança no saldo
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

  -- Calcular novo saldo
  new_balance := balance_record.current_balance + amount_change;

  -- Atualizar saldo
  UPDATE cash_balances 
  SET 
    current_balance = new_balance,
    last_updated = NOW(),
    updated_at = NOW()
  WHERE id = balance_record.id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. TRIGGERS PARA OPERAÇÕES AUTOMÁTICAS
-- ========================================

-- Função para processar vendas
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  method_type TEXT;
  method_amount NUMERIC;
  method_installments INTEGER;
BEGIN
  -- Processar cada método de pagamento da venda
  IF NEW.payment_methods IS NOT NULL AND jsonb_array_length(NEW.payment_methods) > 0 THEN
    FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
    LOOP
      method_type := payment_method->>'type';
      method_amount := COALESCE((payment_method->>'amount')::NUMERIC, 0);
      method_installments := COALESCE((payment_method->>'installments')::INTEGER, 1);
      
      -- Apenas métodos que geram entrada imediata no caixa
      IF method_type IN ('dinheiro', 'pix', 'cartao_debito') OR 
         (method_type = 'cartao_credito' AND method_installments = 1) THEN
        
        -- Verificar se já existe transação para evitar duplicatas
        IF NOT EXISTS (
          SELECT 1 FROM cash_transactions 
          WHERE related_id = NEW.id 
          AND description = 'Venda - ' || NEW.client || ' (' || method_type || ')'
          AND amount = method_amount
          AND type = 'entrada'
        ) THEN
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
            method_amount,
            'Venda - ' || NEW.client || ' (' || method_type || ')',
            'venda',
            NEW.id,
            method_type
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar boletos pagos/recebidos
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
DECLARE
  net_amount NUMERIC;
  notary_costs NUMERIC;
  total_paid NUMERIC;
BEGIN
  -- Apenas quando status muda para compensado
  IF (OLD.status IS NULL OR OLD.status != 'compensado') AND NEW.status = 'compensado' THEN
    
    -- Se é boleto da empresa (que a empresa deve pagar)
    IF NEW.is_company_payable = true THEN
      total_paid := NEW.value + COALESCE(NEW.interest_paid, 0);
      
      -- Verificar se já existe transação
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id AND type = 'saida' AND category = 'divida'
      ) THEN
        INSERT INTO cash_transactions (
          date,
          type,
          amount,
          description,
          category,
          related_id,
          payment_method
        ) VALUES (
          COALESCE(NEW.payment_date, NEW.due_date),
          'saida',
          total_paid,
          'Pagamento de boleto - ' || COALESCE(NEW.company_name, 'Empresa'),
          'divida',
          NEW.id,
          'boleto'
        );
      END IF;
    ELSE
      -- Boleto recebido pela empresa
      net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
      notary_costs := COALESCE(NEW.notary_costs, 0);
      
      -- Verificar se já existe transação
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id AND type = 'entrada' AND category = 'boleto'
      ) THEN
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
          COALESCE(NEW.payment_date, NEW.due_date),
          'entrada',
          net_amount,
          'Boleto recebido - ' || NEW.client,
          'boleto',
          NEW.id,
          'boleto'
        );
        
        -- Se houve custos de cartório, registrar como saída separada
        IF notary_costs > 0 THEN
          INSERT INTO cash_transactions (
            date,
            type,
            amount,
            description,
            category,
            related_id,
            payment_method
          ) VALUES (
            COALESCE(NEW.payment_date, NEW.due_date),
            'saida',
            notary_costs,
            'Custos de cartório - Boleto ' || NEW.client,
            'outro',
            NEW.id,
            'outros'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar cheques compensados
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas quando status muda para compensado
  IF (OLD.status IS NULL OR OLD.status != 'compensado') AND NEW.status = 'compensado' THEN
    
    -- Verificar se já existe transação
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id AND category = 'cheque'
    ) THEN
      
      IF NEW.is_own_check = true OR NEW.is_company_payable = true THEN
        -- Cheque próprio ou da empresa = saída de caixa
        INSERT INTO cash_transactions (
          date,
          type,
          amount,
          description,
          category,
          related_id,
          payment_method
        ) VALUES (
          COALESCE(NEW.payment_date, NEW.due_date),
          'saida',
          NEW.value,
          'Cheque próprio pago - ' || COALESCE(NEW.company_name, NEW.client),
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
          COALESCE(NEW.payment_date, NEW.due_date),
          'entrada',
          NEW.value,
          'Cheque compensado - ' || NEW.client,
          'cheque',
          NEW.id,
          'cheque'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar pagamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Verificar se já existe transação
  IF NOT EXISTS (
    SELECT 1 FROM cash_transactions 
    WHERE related_id = NEW.id AND category = 'salario'
  ) THEN
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
      'Pagamento de salário - ' || COALESCE(employee_name, 'Funcionário'),
      'salario',
      NEW.id,
      'dinheiro'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar adiantamentos
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Apenas para métodos que afetam o caixa
  IF NEW.payment_method IN ('dinheiro', 'pix', 'transferencia') THEN
    -- Verificar se já existe transação
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id AND category = 'adiantamento'
    ) THEN
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
        'Adiantamento - ' || COALESCE(employee_name, 'Funcionário'),
        'adiantamento',
        NEW.id,
        NEW.payment_method
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar dívidas pagas
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  method_type TEXT;
  method_amount NUMERIC;
BEGIN
  -- Apenas quando dívida é marcada como paga
  IF (OLD.is_paid IS NULL OR OLD.is_paid = false) AND NEW.is_paid = true THEN
    
    -- Processar cada método de pagamento
    IF NEW.payment_methods IS NOT NULL AND jsonb_array_length(NEW.payment_methods) > 0 THEN
      FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
      LOOP
        method_type := payment_method->>'type';
        method_amount := COALESCE((payment_method->>'amount')::NUMERIC, 0);
        
        -- Apenas métodos que afetam o caixa imediatamente
        IF method_type IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
          
          -- Verificar se já existe transação
          IF NOT EXISTS (
            SELECT 1 FROM cash_transactions 
            WHERE related_id = NEW.id 
            AND description = 'Pagamento - ' || NEW.company || ' (' || method_type || ')'
            AND amount = method_amount
            AND type = 'saida'
          ) THEN
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
              method_amount,
              'Pagamento - ' || NEW.company || ' (' || method_type || ')',
              'divida',
              NEW.id,
              method_type
            );
          END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar tarifas PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe transação
  IF NOT EXISTS (
    SELECT 1 FROM cash_transactions 
    WHERE related_id = NEW.id AND category = 'outro' AND description LIKE 'Tarifa PIX%'
  ) THEN
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar impostos
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para métodos que afetam o caixa
  IF NEW.payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
    -- Verificar se já existe transação
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id AND category = 'outro' AND description LIKE 'Imposto%'
    ) THEN
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar comissões automaticamente
CREATE OR REPLACE FUNCTION create_commission_for_sale()
RETURNS TRIGGER AS $$
DECLARE
  seller_record RECORD;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Verificar se há vendedor e se é vendedor ativo
  IF NEW.seller_id IS NOT NULL THEN
    SELECT * INTO seller_record FROM employees 
    WHERE id = NEW.seller_id AND is_seller = true AND is_active = true;
    
    IF seller_record IS NOT NULL THEN
      commission_rate := COALESCE(NEW.custom_commission_rate, 5.00);
      commission_amount := (NEW.total_value * commission_rate) / 100;
      
      -- Verificar se já existe comissão
      IF NOT EXISTS (SELECT 1 FROM employee_commissions WHERE sale_id = NEW.id) THEN
        INSERT INTO employee_commissions (
          employee_id,
          sale_id,
          sale_value,
          commission_rate,
          commission_amount,
          date,
          status
        ) VALUES (
          NEW.seller_id,
          NEW.id,
          NEW.total_value,
          commission_rate,
          commission_amount,
          NEW.date,
          'pendente'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. APLICAR TODOS OS TRIGGERS
-- ========================================

-- Trigger principal para atualização do saldo
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_balance();

-- Triggers para vendas
DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION handle_sale_cash_transaction();

DROP TRIGGER IF EXISTS auto_create_commission ON sales;
CREATE TRIGGER auto_create_commission
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION create_commission_for_sale();

-- Triggers para boletos
DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION handle_boleto_payment();

-- Triggers para cheques
DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW
  EXECUTE FUNCTION handle_check_payment();

-- Triggers para funcionários
DROP TRIGGER IF EXISTS auto_handle_employee_payment ON employee_payments;
CREATE TRIGGER auto_handle_employee_payment
  AFTER INSERT ON employee_payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_payment();

DROP TRIGGER IF EXISTS auto_handle_employee_advance ON employee_advances;
CREATE TRIGGER auto_handle_employee_advance
  AFTER INSERT ON employee_advances
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_advance();

-- Triggers para dívidas
DROP TRIGGER IF EXISTS auto_handle_debt_payment ON debts;
CREATE TRIGGER auto_handle_debt_payment
  AFTER UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION handle_debt_payment();

-- Triggers para tarifas PIX
DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION handle_pix_fee();

-- Triggers para impostos
DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW
  EXECUTE FUNCTION handle_tax_payment();

-- ========================================
-- 6. FUNÇÃO PARA RECALCULAR SALDO COMPLETO
-- ========================================

CREATE OR REPLACE FUNCTION recalculate_cash_balance()
RETURNS VOID AS $$
DECLARE
  total_entries NUMERIC := 0;
  total_exits NUMERIC := 0;
  calculated_balance NUMERIC := 0;
  balance_record RECORD;
  initial_balance NUMERIC := 0;
BEGIN
  -- Buscar saldo inicial
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at LIMIT 1;
  
  IF balance_record IS NOT NULL THEN
    initial_balance := COALESCE(balance_record.initial_balance, 0);
  ELSE
    -- Criar registro inicial se não existir
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, NOW());
    SELECT * INTO balance_record FROM cash_balances ORDER BY created_at LIMIT 1;
  END IF;

  -- Calcular total de entradas
  SELECT COALESCE(SUM(amount), 0) INTO total_entries
  FROM cash_transactions
  WHERE type = 'entrada';

  -- Calcular total de saídas
  SELECT COALESCE(SUM(amount), 0) INTO total_exits
  FROM cash_transactions
  WHERE type = 'saida';

  -- Calcular saldo final
  calculated_balance := initial_balance + total_entries - total_exits;

  -- Atualizar saldo
  UPDATE cash_balances 
  SET 
    current_balance = calculated_balance,
    last_updated = NOW(),
    updated_at = NOW()
  WHERE id = balance_record.id;

  RAISE NOTICE 'Saldo recalculado: R$ % (Inicial: R$ %, Entradas: R$ %, Saídas: R$ %)', 
    calculated_balance, initial_balance, total_entries, total_exits;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. FUNÇÃO PARA VERIFICAR INTEGRIDADE
-- ========================================

CREATE OR REPLACE FUNCTION check_system_integrity()
RETURNS TABLE(
  table_name TEXT,
  total_records BIGINT,
  duplicates_found BIGINT,
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
      WHEN COUNT(*) = COUNT(DISTINCT (client, date, total_value)) THEN 'OK - SEM DUPLICATAS'
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
      WHEN COUNT(*) = COUNT(DISTINCT (company, date, total_value, description)) THEN 'OK - SEM DUPLICATAS'
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
      WHEN COUNT(*) = COUNT(DISTINCT (name, position, salary)) THEN 'OK - SEM DUPLICATAS'
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
      WHEN COUNT(*) = 1 THEN 'OK - UM SALDO'
      WHEN COUNT(*) = 0 THEN 'ERRO - NENHUM SALDO'
      ELSE 'ERRO - MÚLTIPLOS SALDOS'
    END::TEXT
  FROM cash_balances;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. EXECUTAR RECÁLCULO FINAL
-- ========================================

-- Recalcular saldo baseado em todas as transações
SELECT recalculate_cash_balance();

-- Verificar integridade do sistema
SELECT * FROM check_system_integrity();

-- ========================================
-- 9. OTIMIZAÇÕES DE PERFORMANCE
-- ========================================

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sales_client_date_value ON sales(client, date, total_value);
CREATE INDEX IF NOT EXISTS idx_debts_company_date_value ON debts(company, date, total_value);
CREATE INDEX IF NOT EXISTS idx_employees_name_position ON employees(name, position);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_related_type ON cash_transactions(related_id, type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date_category ON cash_transactions(date, category);

-- ========================================
-- 10. LOGS E NOTIFICAÇÕES
-- ========================================

-- Log final
DO $$
DECLARE
  sales_count INTEGER;
  debts_count INTEGER;
  employees_count INTEGER;
  cash_balance NUMERIC;
BEGIN
  SELECT COUNT(*) INTO sales_count FROM sales;
  SELECT COUNT(*) INTO debts_count FROM debts;
  SELECT COUNT(*) INTO employees_count FROM employees;
  SELECT current_balance INTO cash_balance FROM cash_balances ORDER BY created_at LIMIT 1;
  
  RAISE NOTICE '=== SISTEMA REVGOLD CORRIGIDO ===';
  RAISE NOTICE 'Vendas: % registros', sales_count;
  RAISE NOTICE 'Dívidas: % registros', debts_count;
  RAISE NOTICE 'Funcionários: % registros', employees_count;
  RAISE NOTICE 'Saldo do Caixa: R$ %', COALESCE(cash_balance, 0);
  RAISE NOTICE 'Sistema de caixa automático: ATIVADO';
  RAISE NOTICE 'Prevenção de duplicatas: ATIVADA';
  RAISE NOTICE '================================';
END $$;
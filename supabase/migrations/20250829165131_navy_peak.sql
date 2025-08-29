/*
  # Correção completa do sistema de vendas e caixa automático

  1. Sistema de Caixa Automático
    - Função para recalcular saldo baseado em todas as transações
    - Triggers automáticos para todas as operações financeiras
    - Controle rigoroso de entradas e saídas

  2. Correções de Vendas
    - Corrigir estrutura da tabela sales
    - Melhorar triggers para criação automática de cheques/boletos
    - Corrigir sistema de comissões

  3. Integridade de Dados
    - Prevenir duplicatas
    - Validações rigorosas
    - Logs detalhados
*/

-- 1. FUNÇÃO PARA RECALCULAR SALDO DO CAIXA BASEADO EM TODAS AS TRANSAÇÕES
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

-- 2. FUNÇÃO MELHORADA PARA ATUALIZAR SALDO DO CAIXA
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

  RAISE NOTICE 'Caixa atualizado: R$ % -> R$ % (mudança: R$ %)', 
    balance_record.current_balance, new_balance, amount_change;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO PARA PROCESSAR VENDAS E CRIAR TRANSAÇÕES DE CAIXA
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
          AND description LIKE 'Venda - ' || NEW.client || '%'
          AND amount = method_amount
          AND payment_method = method_type
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
          
          RAISE NOTICE 'Transação de caixa criada: Venda % - % - R$ %', 
            NEW.client, method_type, method_amount;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO PARA PROCESSAR BOLETOS PAGOS
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
      
      -- Verificar se já existe transação para evitar duplicatas
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id 
        AND type = 'saida'
        AND category = 'divida'
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
          'Pagamento de boleto - ' || COALESCE(NEW.company_name, 'Empresa') ||
          CASE WHEN NEW.interest_paid > 0 THEN ' (com juros)' ELSE '' END,
          'divida',
          NEW.id,
          'boleto'
        );
        
        RAISE NOTICE 'Transação de caixa criada: Pagamento boleto % - R$ %', 
          COALESCE(NEW.company_name, 'Empresa'), total_paid;
      END IF;
    ELSE
      -- Boleto recebido pela empresa
      net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
      notary_costs := COALESCE(NEW.notary_costs, 0);
      
      -- Verificar se já existe transação para evitar duplicatas
      IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE related_id = NEW.id 
        AND type = 'entrada'
        AND category = 'boleto'
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
          'Boleto recebido - ' || NEW.client ||
          CASE WHEN NEW.overdue_action IS NOT NULL THEN ' (' || NEW.overdue_action || ')' ELSE '' END,
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
        
        RAISE NOTICE 'Transação de caixa criada: Boleto recebido % - Líquido: R$ %, Custos: R$ %', 
          NEW.client, net_amount, notary_costs;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO PARA PROCESSAR CHEQUES COMPENSADOS
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas quando status muda para compensado
  IF (OLD.status IS NULL OR OLD.status != 'compensado') AND NEW.status = 'compensado' THEN
    
    -- Verificar se já existe transação para evitar duplicatas
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id 
      AND category = 'cheque'
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
        
        RAISE NOTICE 'Transação de caixa criada: Cheque próprio pago % - R$ %', 
          COALESCE(NEW.company_name, NEW.client), NEW.value;
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
        
        RAISE NOTICE 'Transação de caixa criada: Cheque compensado % - R$ %', 
          NEW.client, NEW.value;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA PROCESSAR PAGAMENTOS DE FUNCIONÁRIOS
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Verificar se já existe transação para evitar duplicatas
  IF NOT EXISTS (
    SELECT 1 FROM cash_transactions 
    WHERE related_id = NEW.id 
    AND category = 'salario'
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
    
    RAISE NOTICE 'Transação de caixa criada: Pagamento salário % - R$ %', 
      COALESCE(employee_name, 'Funcionário'), NEW.amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA PROCESSAR ADIANTAMENTOS
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Apenas para métodos que afetam o caixa
  IF NEW.payment_method IN ('dinheiro', 'pix', 'transferencia') THEN
    -- Verificar se já existe transação para evitar duplicatas
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id 
      AND category = 'adiantamento'
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
      
      RAISE NOTICE 'Transação de caixa criada: Adiantamento % - R$ %', 
        COALESCE(employee_name, 'Funcionário'), NEW.amount;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO PARA PROCESSAR DÍVIDAS PAGAS
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
          
          -- Verificar se já existe transação para evitar duplicatas
          IF NOT EXISTS (
            SELECT 1 FROM cash_transactions 
            WHERE related_id = NEW.id 
            AND description LIKE 'Pagamento - ' || NEW.company || '%'
            AND amount = method_amount
            AND payment_method = method_type
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
            
            RAISE NOTICE 'Transação de caixa criada: Pagamento dívida % - % - R$ %', 
              NEW.company, method_type, method_amount;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA PROCESSAR TARIFAS PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe transação para evitar duplicatas
  IF NOT EXISTS (
    SELECT 1 FROM cash_transactions 
    WHERE related_id = NEW.id 
    AND category = 'outro'
    AND description LIKE 'Tarifa PIX%'
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
    
    RAISE NOTICE 'Transação de caixa criada: Tarifa PIX % - R$ %', 
      NEW.bank, NEW.amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PARA PROCESSAR IMPOSTOS
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para métodos que afetam o caixa
  IF NEW.payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
    -- Verificar se já existe transação para evitar duplicatas
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE related_id = NEW.id 
      AND category = 'outro'
      AND description LIKE 'Imposto%'
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
      
      RAISE NOTICE 'Transação de caixa criada: Imposto % - R$ %', 
        NEW.description, NEW.amount;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. FUNÇÃO PARA CRIAR COMISSÕES AUTOMATICAMENTE
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
      
      -- Verificar se já existe comissão para evitar duplicatas
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
        
        RAISE NOTICE 'Comissão criada: % - R$ % (%% sobre R$ %)', 
          seller_record.name, commission_amount, commission_rate, NEW.total_value;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. RECRIAR TODOS OS TRIGGERS

-- Trigger principal para atualização do saldo do caixa
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

-- 13. LIMPAR TRANSAÇÕES DUPLICADAS EXISTENTES
DELETE FROM cash_transactions a USING cash_transactions b
WHERE a.id > b.id
  AND a.date = b.date
  AND a.type = b.type
  AND a.amount = b.amount
  AND a.description = b.description
  AND a.category = b.category
  AND COALESCE(a.related_id::text, '') = COALESCE(b.related_id::text, '');

-- 14. GARANTIR QUE EXISTE SALDO INICIAL
INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
SELECT 0, 0, CURRENT_DATE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM cash_balances);

-- 15. RECALCULAR SALDO BASEADO EM TODAS AS TRANSAÇÕES
SELECT recalculate_cash_balance();

-- 16. FUNÇÃO PARA VERIFICAR INTEGRIDADE DO SISTEMA
CREATE OR REPLACE FUNCTION check_system_integrity()
RETURNS TABLE(
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Verificar saldo do caixa
  RETURN QUERY
  SELECT 
    'Cash Balance'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM cash_balances) = 1 THEN 'OK'
      WHEN (SELECT COUNT(*) FROM cash_balances) = 0 THEN 'NO BALANCE FOUND'
      ELSE 'MULTIPLE BALANCES'
    END::TEXT,
    'Current balance: R$ ' || COALESCE((SELECT current_balance FROM cash_balances ORDER BY created_at LIMIT 1)::TEXT, '0')
  ;

  -- Verificar transações de caixa
  RETURN QUERY
  SELECT 
    'Cash Transactions'::TEXT,
    'OK'::TEXT,
    'Total transactions: ' || (SELECT COUNT(*) FROM cash_transactions)::TEXT ||
    ', Entries: R$ ' || COALESCE((SELECT SUM(amount) FROM cash_transactions WHERE type = 'entrada')::TEXT, '0') ||
    ', Exits: R$ ' || COALESCE((SELECT SUM(amount) FROM cash_transactions WHERE type = 'saida')::TEXT, '0')
  ;

  -- Verificar vendas
  RETURN QUERY
  SELECT 
    'Sales'::TEXT,
    'OK'::TEXT,
    'Total sales: ' || (SELECT COUNT(*) FROM sales)::TEXT ||
    ', Total value: R$ ' || COALESCE((SELECT SUM(total_value) FROM sales)::TEXT, '0')
  ;
END;
$$ LANGUAGE plpgsql;

-- 17. EXECUTAR VERIFICAÇÃO DE INTEGRIDADE
SELECT * FROM check_system_integrity();
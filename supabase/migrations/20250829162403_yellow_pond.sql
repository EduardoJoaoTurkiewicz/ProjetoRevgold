/*
  # Correção do sistema de pagamentos e caixa

  1. Correções na estrutura
    - Corrigir estrutura da coluna payment_methods
    - Adicionar constraints para evitar duplicatas
    - Melhorar sistema de caixa automático

  2. Segurança
    - Manter RLS habilitado
    - Preservar políticas existentes

  3. Melhorias
    - Sistema de caixa mais robusto
    - Prevenção de duplicatas
    - Triggers aprimorados
*/

-- Primeiro, vamos corrigir a estrutura da tabela sales para garantir que payment_methods seja JSONB
DO $$
BEGIN
  -- Verificar se a coluna payment_methods existe e tem o tipo correto
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'payment_methods' AND data_type != 'jsonb'
  ) THEN
    -- Converter para JSONB se não for
    ALTER TABLE sales ALTER COLUMN payment_methods TYPE jsonb USING payment_methods::jsonb;
  END IF;
END $$;

-- Adicionar constraints únicos para evitar duplicatas
DO $$
BEGIN
  -- Constraint para vendas (evitar duplicatas por cliente, data e valor)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'sales' AND constraint_name = 'unique_sale_constraint'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT unique_sale_constraint 
    UNIQUE (client, date, total_value);
  END IF;
  
  -- Constraint para dívidas (evitar duplicatas por empresa, data, valor e descrição)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'debts' AND constraint_name = 'unique_debt_constraint'
  ) THEN
    ALTER TABLE debts ADD CONSTRAINT unique_debt_constraint 
    UNIQUE (company, date, total_value, description);
  END IF;
  
  -- Constraint para funcionários (evitar duplicatas por nome e cargo)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'employees' AND constraint_name = 'unique_employee_constraint'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT unique_employee_constraint 
    UNIQUE (name, position);
  END IF;
  
  -- Constraint para boletos (evitar duplicatas por cliente, valor, vencimento e parcela)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'boletos' AND constraint_name = 'unique_boleto_constraint'
  ) THEN
    ALTER TABLE boletos ADD CONSTRAINT unique_boleto_constraint 
    UNIQUE (client, value, due_date, installment_number, total_installments);
  END IF;
  
  -- Constraint para cheques (evitar duplicatas por cliente, valor, vencimento e parcela)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'checks' AND constraint_name = 'unique_check_constraint'
  ) THEN
    ALTER TABLE checks ADD CONSTRAINT unique_check_constraint 
    UNIQUE (client, value, due_date, installment_number, total_installments);
  END IF;
  
  -- Constraint para comissões (evitar duplicatas por funcionário e venda)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'employee_commissions' AND constraint_name = 'unique_commission_constraint'
  ) THEN
    ALTER TABLE employee_commissions ADD CONSTRAINT unique_commission_constraint 
    UNIQUE (employee_id, sale_id);
  END IF;
END $$;

-- Função aprimorada para atualizar saldo do caixa
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_record RECORD;
  new_balance NUMERIC(15,2);
BEGIN
  -- Buscar o registro de saldo atual
  SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  
  -- Se não existe saldo, criar um inicial
  IF balance_record IS NULL THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, NOW());
    SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
  END IF;
  
  -- Calcular novo saldo baseado na operação
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      new_balance := balance_record.current_balance + NEW.amount;
    ELSE
      new_balance := balance_record.current_balance - NEW.amount;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter transação antiga
    IF OLD.type = 'entrada' THEN
      new_balance := balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := balance_record.current_balance + OLD.amount;
    END IF;
    
    -- Aplicar nova transação
    IF NEW.type = 'entrada' THEN
      new_balance := new_balance + NEW.amount;
    ELSE
      new_balance := new_balance - NEW.amount;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverter transação deletada
    IF OLD.type = 'entrada' THEN
      new_balance := balance_record.current_balance - OLD.amount;
    ELSE
      new_balance := balance_record.current_balance + OLD.amount;
    END IF;
  END IF;
  
  -- Atualizar saldo
  UPDATE cash_balances 
  SET current_balance = new_balance, 
      last_updated = NOW()
  WHERE id = balance_record.id;
  
  -- Log da operação
  RAISE NOTICE 'Saldo atualizado: % -> % (Operação: %, Tipo: %, Valor: %)', 
    balance_record.current_balance, new_balance, TG_OP, 
    COALESCE(NEW.type, OLD.type), COALESCE(NEW.amount, OLD.amount);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa automaticamente para vendas
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  transaction_amount NUMERIC(10,2);
  payment_type TEXT;
BEGIN
  -- Processar cada método de pagamento da venda
  FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
  LOOP
    payment_type := payment_method->>'type';
    transaction_amount := (payment_method->>'amount')::NUMERIC;
    
    -- Apenas métodos que geram entrada imediata no caixa
    IF payment_type IN ('dinheiro', 'pix', 'cartao_debito') OR 
       (payment_type = 'cartao_credito' AND 
        (payment_method->>'installments' IS NULL OR (payment_method->>'installments')::INTEGER = 1)) THEN
      
      -- Criar transação de entrada no caixa
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.date,
        'entrada',
        transaction_amount,
        'Venda - ' || NEW.client || ' (' || payment_type || ')',
        'venda',
        NEW.id,
        payment_type
      );
      
      RAISE NOTICE 'Transação de caixa criada para venda: % - % - R$ %', 
        NEW.client, payment_type, transaction_amount;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para pagamentos de boletos
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
DECLARE
  net_amount NUMERIC(10,2);
  notary_costs NUMERIC(10,2);
BEGIN
  -- Apenas quando o status muda para compensado
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    -- Calcular valor líquido (valor final menos custos de cartório)
    net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
    notary_costs := COALESCE(NEW.notary_costs, 0);
    
    -- Criar entrada no caixa pelo valor líquido
    IF net_amount > 0 THEN
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.due_date,
        'entrada',
        net_amount,
        'Boleto pago - ' || NEW.client,
        'boleto',
        NEW.id,
        'boleto'
      );
    END IF;
    
    -- Criar saída no caixa pelos custos de cartório (se houver)
    IF notary_costs > 0 THEN
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.due_date,
        'saida',
        notary_costs,
        'Custos de cartório - Boleto ' || NEW.client,
        'outro',
        NEW.id,
        'outros'
      );
    END IF;
    
    RAISE NOTICE 'Transações de caixa criadas para boleto: % - Líquido: R$ % - Custos: R$ %', 
      NEW.client, net_amount, notary_costs;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para cheques compensados
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas quando o status muda para compensado
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    
    -- Se é cheque próprio (empresa paga), criar saída
    IF NEW.is_own_check = true OR NEW.is_company_payable = true THEN
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.due_date,
        'saida',
        NEW.value,
        'Cheque próprio pago - ' || NEW.client,
        'cheque',
        NEW.id,
        'cheque'
      );
      
      RAISE NOTICE 'Transação de saída criada para cheque próprio: % - R$ %', 
        NEW.client, NEW.value;
    ELSE
      -- Se é cheque de terceiros (empresa recebe), criar entrada
      INSERT INTO cash_transactions (
        date, type, amount, description, category, related_id, payment_method
      ) VALUES (
        NEW.due_date,
        'entrada',
        NEW.value,
        'Cheque compensado - ' || NEW.client,
        'cheque',
        NEW.id,
        'cheque'
      );
      
      RAISE NOTICE 'Transação de entrada criada para cheque: % - R$ %', 
        NEW.client, NEW.value;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para pagamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Criar transação de saída no caixa
  INSERT INTO cash_transactions (
    date, type, amount, description, category, related_id, payment_method
  ) VALUES (
    NEW.payment_date,
    'saida',
    NEW.amount,
    'Pagamento de salário - ' || COALESCE(employee_name, 'Funcionário'),
    'salario',
    NEW.id,
    'dinheiro'
  );
  
  RAISE NOTICE 'Transação de caixa criada para pagamento: % - R$ %', 
    COALESCE(employee_name, 'Funcionário'), NEW.amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para adiantamentos
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
BEGIN
  -- Buscar nome do funcionário
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  -- Criar transação de saída no caixa (apenas para métodos que afetam o caixa)
  IF NEW.payment_method IN ('dinheiro', 'pix', 'transferencia') THEN
    INSERT INTO cash_transactions (
      date, type, amount, description, category, related_id, payment_method
    ) VALUES (
      NEW.date,
      'saida',
      NEW.amount,
      'Adiantamento - ' || COALESCE(employee_name, 'Funcionário'),
      'adiantamento',
      NEW.id,
      NEW.payment_method
    );
    
    RAISE NOTICE 'Transação de caixa criada para adiantamento: % - R$ %', 
      COALESCE(employee_name, 'Funcionário'), NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para tarifas PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa
  INSERT INTO cash_transactions (
    date, type, amount, description, category, related_id, payment_method
  ) VALUES (
    NEW.date,
    'saida',
    NEW.amount,
    'Tarifa PIX - ' || NEW.bank || ': ' || NEW.description,
    'outro',
    NEW.id,
    'pix'
  );
  
  RAISE NOTICE 'Transação de caixa criada para tarifa PIX: % - R$ %', 
    NEW.bank, NEW.amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar transação de caixa para impostos
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar transação de saída no caixa (apenas para métodos que afetam o caixa)
  IF NEW.payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
    INSERT INTO cash_transactions (
      date, type, amount, description, category, related_id, payment_method
    ) VALUES (
      NEW.date,
      'saida',
      NEW.amount,
      'Imposto - ' || NEW.description,
      'outro',
      NEW.id,
      NEW.payment_method
    );
    
    RAISE NOTICE 'Transação de caixa criada para imposto: % - R$ %', 
      NEW.description, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers para garantir funcionamento correto
DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION handle_sale_cash_transaction();

DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
  AFTER UPDATE ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION handle_boleto_payment();

DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
  AFTER UPDATE ON checks
  FOR EACH ROW
  EXECUTE FUNCTION handle_check_payment();

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

DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
  AFTER INSERT ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION handle_pix_fee();

DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
  AFTER INSERT ON taxes
  FOR EACH ROW
  EXECUTE FUNCTION handle_tax_payment();

-- Recriar trigger para atualização automática do saldo
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
  AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_balance();

-- Função para processar pagamentos de dívidas
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_method JSONB;
  transaction_amount NUMERIC(10,2);
  payment_type TEXT;
BEGIN
  -- Apenas quando a dívida é marcada como paga
  IF OLD.is_paid = false AND NEW.is_paid = true THEN
    
    -- Processar cada método de pagamento da dívida
    FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
    LOOP
      payment_type := payment_method->>'type';
      transaction_amount := (payment_method->>'amount')::NUMERIC;
      
      -- Apenas métodos que afetam o caixa imediatamente
      IF payment_type IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
        
        -- Criar transação de saída no caixa
        INSERT INTO cash_transactions (
          date, type, amount, description, category, related_id, payment_method
        ) VALUES (
          NEW.date,
          'saida',
          transaction_amount,
          'Pagamento - ' || NEW.company || ' (' || payment_type || ')',
          'divida',
          NEW.id,
          payment_type
        );
        
        RAISE NOTICE 'Transação de caixa criada para pagamento de dívida: % - % - R$ %', 
          NEW.company, payment_type, transaction_amount;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para pagamentos de dívidas
DROP TRIGGER IF EXISTS auto_handle_debt_payment ON debts;
CREATE TRIGGER auto_handle_debt_payment
  AFTER UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION handle_debt_payment();

-- Limpar dados duplicados existentes (executar apenas uma vez)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Remover vendas duplicadas (manter a mais antiga)
  WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY client, date, total_value 
      ORDER BY created_at ASC
    ) as rn
    FROM sales
  )
  DELETE FROM sales 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Removidas % vendas duplicadas', duplicate_count;
  
  -- Remover dívidas duplicadas
  WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY company, date, total_value, description 
      ORDER BY created_at ASC
    ) as rn
    FROM debts
  )
  DELETE FROM debts 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Removidas % dívidas duplicadas', duplicate_count;
  
  -- Remover funcionários duplicados
  WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY name, position 
      ORDER BY created_at ASC
    ) as rn
    FROM employees
  )
  DELETE FROM employees 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Removidos % funcionários duplicados', duplicate_count;
  
  -- Remover boletos duplicados
  WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY client, value, due_date, installment_number, total_installments 
      ORDER BY created_at ASC
    ) as rn
    FROM boletos
  )
  DELETE FROM boletos 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Removidos % boletos duplicados', duplicate_count;
  
  -- Remover cheques duplicados
  WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY client, value, due_date, installment_number, total_installments 
      ORDER BY created_at ASC
    ) as rn
    FROM checks
  )
  DELETE FROM checks 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Removidos % cheques duplicados', duplicate_count;
  
  -- Remover comissões duplicadas
  WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY employee_id, sale_id 
      ORDER BY created_at ASC
    ) as rn
    FROM employee_commissions
  )
  DELETE FROM employee_commissions 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Removidas % comissões duplicadas', duplicate_count;
  
END $$;

-- Garantir que existe pelo menos um registro de saldo de caixa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cash_balances) THEN
    INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
    VALUES (0, 0, CURRENT_DATE, NOW());
    RAISE NOTICE 'Registro inicial de saldo de caixa criado';
  END IF;
END $$;
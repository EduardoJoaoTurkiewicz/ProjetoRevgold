/*
  # Sistema Automático de Caixa Completo

  1. Funções de Atualização
    - Função para atualizar saldo do caixa automaticamente
    - Função para recalcular saldo baseado em todas as transações
    - Função para inicializar caixa com valor inicial

  2. Triggers Automáticos
    - Vendas: Atualiza caixa quando pagamento é em dinheiro, PIX, débito ou crédito à vista
    - Dívidas: Atualiza caixa quando pagamento é feito
    - Cheques: Atualiza caixa quando compensado
    - Boletos: Atualiza caixa quando pago
    - Funcionários: Atualiza caixa para salários e adiantamentos
    - PIX Fees: Atualiza caixa para tarifas
    - Impostos: Atualiza caixa quando pago

  3. Sistema de Integridade
    - Prevenção de duplicatas em transações de caixa
    - Validações rigorosas
    - Logs de auditoria
*/

-- Função para atualizar saldo do caixa
CREATE OR REPLACE FUNCTION update_cash_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance_record RECORD;
    new_balance NUMERIC(15,2);
BEGIN
    -- Buscar saldo atual
    SELECT * INTO current_balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
    
    -- Se não existe saldo, criar um inicial
    IF current_balance_record IS NULL THEN
        INSERT INTO cash_balances (current_balance, initial_balance, initial_date, last_updated)
        VALUES (0, 0, CURRENT_DATE, NOW());
        SELECT * INTO current_balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
    END IF;
    
    -- Calcular novo saldo baseado no tipo de operação
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'entrada' THEN
            new_balance := current_balance_record.current_balance + NEW.amount;
        ELSE
            new_balance := current_balance_record.current_balance - NEW.amount;
        END IF;
        
        -- Atualizar saldo
        UPDATE cash_balances 
        SET current_balance = new_balance, 
            last_updated = NOW()
        WHERE id = current_balance_record.id;
        
        RAISE NOTICE 'Saldo atualizado: % -> % (% %)', 
            current_balance_record.current_balance, 
            new_balance, 
            NEW.type, 
            NEW.amount;
            
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverter operação
        IF OLD.type = 'entrada' THEN
            new_balance := current_balance_record.current_balance - OLD.amount;
        ELSE
            new_balance := current_balance_record.current_balance + OLD.amount;
        END IF;
        
        -- Atualizar saldo
        UPDATE cash_balances 
        SET current_balance = new_balance, 
            last_updated = NOW()
        WHERE id = current_balance_record.id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverter operação antiga e aplicar nova
        IF OLD.type = 'entrada' THEN
            new_balance := current_balance_record.current_balance - OLD.amount;
        ELSE
            new_balance := current_balance_record.current_balance + OLD.amount;
        END IF;
        
        IF NEW.type = 'entrada' THEN
            new_balance := new_balance + NEW.amount;
        ELSE
            new_balance := new_balance - NEW.amount;
        END IF;
        
        -- Atualizar saldo
        UPDATE cash_balances 
        SET current_balance = new_balance, 
            last_updated = NOW()
        WHERE id = current_balance_record.id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular saldo completo
CREATE OR REPLACE FUNCTION recalculate_cash_balance()
RETURNS VOID AS $$
DECLARE
    balance_record RECORD;
    calculated_balance NUMERIC(15,2);
    initial_balance NUMERIC(15,2);
BEGIN
    -- Buscar registro de saldo
    SELECT * INTO balance_record FROM cash_balances ORDER BY created_at DESC LIMIT 1;
    
    IF balance_record IS NULL THEN
        RAISE EXCEPTION 'Nenhum saldo de caixa encontrado. Inicialize o caixa primeiro.';
    END IF;
    
    initial_balance := COALESCE(balance_record.initial_balance, 0);
    
    -- Calcular saldo baseado em todas as transações
    SELECT 
        initial_balance + COALESCE(SUM(
            CASE 
                WHEN type = 'entrada' THEN amount 
                ELSE -amount 
            END
        ), 0)
    INTO calculated_balance
    FROM cash_transactions;
    
    -- Atualizar saldo
    UPDATE cash_balances 
    SET current_balance = calculated_balance,
        last_updated = NOW()
    WHERE id = balance_record.id;
    
    RAISE NOTICE 'Saldo recalculado: %', calculated_balance;
END;
$$ LANGUAGE plpgsql;

-- Função para processar vendas automaticamente
CREATE OR REPLACE FUNCTION handle_sale_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    payment_method JSONB;
    transaction_description TEXT;
    seller_name TEXT;
BEGIN
    -- Buscar nome do vendedor se existir
    IF NEW.seller_id IS NOT NULL THEN
        SELECT name INTO seller_name FROM employees WHERE id = NEW.seller_id;
    END IF;
    
    -- Processar cada método de pagamento
    FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
    LOOP
        -- Apenas métodos que geram entrada imediata no caixa
        IF (payment_method->>'type')::TEXT IN ('dinheiro', 'pix', 'cartao_debito') OR
           ((payment_method->>'type')::TEXT = 'cartao_credito' AND 
            (COALESCE((payment_method->>'installments')::INTEGER, 1) = 1)) THEN
            
            transaction_description := 'Venda - ' || NEW.client || 
                CASE 
                    WHEN seller_name IS NOT NULL THEN ' (Vendedor: ' || seller_name || ')'
                    ELSE ''
                END ||
                ' - ' || UPPER(REPLACE((payment_method->>'type')::TEXT, '_', ' '));
            
            -- Inserir transação de caixa
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
                (payment_method->>'amount')::NUMERIC,
                transaction_description,
                'venda',
                NEW.id,
                (payment_method->>'type')::TEXT
            );
            
            RAISE NOTICE 'Transação de caixa criada para venda: % - %', 
                NEW.client, 
                (payment_method->>'amount')::NUMERIC;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar pagamentos de dívidas
CREATE OR REPLACE FUNCTION handle_debt_payment()
RETURNS TRIGGER AS $$
DECLARE
    payment_method JSONB;
    transaction_description TEXT;
BEGIN
    -- Apenas processar se a dívida foi marcada como paga
    IF NEW.is_paid = TRUE AND (OLD.is_paid = FALSE OR OLD.is_paid IS NULL) THEN
        
        -- Processar cada método de pagamento
        FOR payment_method IN SELECT * FROM jsonb_array_elements(NEW.payment_methods)
        LOOP
            -- Apenas métodos que geram saída imediata do caixa
            IF (payment_method->>'type')::TEXT IN ('dinheiro', 'pix', 'cartao_debito', 'transferencia') THEN
                
                transaction_description := 'Pagamento de dívida - ' || NEW.company || 
                    ' - ' || UPPER(REPLACE((payment_method->>'type')::TEXT, '_', ' '));
                
                -- Inserir transação de caixa
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
                    (payment_method->>'amount')::NUMERIC,
                    transaction_description,
                    'divida',
                    NEW.id,
                    (payment_method->>'type')::TEXT
                );
                
                RAISE NOTICE 'Transação de caixa criada para pagamento de dívida: % - %', 
                    NEW.company, 
                    (payment_method->>'amount')::NUMERIC;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar cheques compensados
CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
DECLARE
    transaction_description TEXT;
BEGIN
    -- Processar quando cheque é marcado como compensado
    IF NEW.status = 'compensado' AND (OLD.status != 'compensado' OR OLD.status IS NULL) THEN
        
        IF NEW.is_own_check = TRUE OR NEW.is_company_payable = TRUE THEN
            -- Cheque próprio ou da empresa = saída de caixa
            transaction_description := 'Cheque próprio pago - ' || NEW.client;
            
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
                transaction_description,
                'cheque',
                NEW.id,
                'cheque'
            );
        ELSE
            -- Cheque de terceiros = entrada de caixa
            transaction_description := 'Cheque compensado - ' || NEW.client;
            
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
                transaction_description,
                'cheque',
                NEW.id,
                'cheque'
            );
        END IF;
        
        RAISE NOTICE 'Transação de caixa criada para cheque: % - %', NEW.client, NEW.value;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar boletos pagos
CREATE OR REPLACE FUNCTION handle_boleto_payment()
RETURNS TRIGGER AS $$
DECLARE
    transaction_description TEXT;
    net_amount NUMERIC(15,2);
BEGIN
    -- Processar quando boleto é marcado como compensado
    IF NEW.status = 'compensado' AND (OLD.status != 'compensado' OR OLD.status IS NULL) THEN
        
        IF NEW.is_company_payable = TRUE THEN
            -- Boleto que a empresa deve pagar = saída de caixa
            net_amount := NEW.value + COALESCE(NEW.interest_paid, 0);
            transaction_description := 'Boleto pago - ' || COALESCE(NEW.company_name, NEW.client);
            
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
                net_amount,
                transaction_description,
                'boleto',
                NEW.id,
                'boleto'
            );
        ELSE
            -- Boleto recebido = entrada de caixa (valor final menos custos de cartório)
            net_amount := COALESCE(NEW.final_amount, NEW.value) - COALESCE(NEW.notary_costs, 0);
            transaction_description := 'Boleto recebido - ' || NEW.client;
            
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
                transaction_description,
                'boleto',
                NEW.id,
                'boleto'
            );
            
            -- Se houve custos de cartório, registrar como saída separada
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
                    COALESCE(NEW.payment_date, NEW.due_date),
                    'saida',
                    NEW.notary_costs,
                    'Custos de cartório - Boleto ' || NEW.client,
                    'outro',
                    NEW.id,
                    'cartorio'
                );
            END IF;
        END IF;
        
        RAISE NOTICE 'Transação de caixa criada para boleto: % - %', NEW.client, net_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar pagamentos de funcionários
CREATE OR REPLACE FUNCTION handle_employee_payment()
RETURNS TRIGGER AS $$
DECLARE
    employee_name TEXT;
    transaction_description TEXT;
BEGIN
    -- Buscar nome do funcionário
    SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
    
    transaction_description := 'Pagamento de salário - ' || COALESCE(employee_name, 'Funcionário');
    
    -- Inserir transação de caixa
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
        transaction_description,
        'salario',
        NEW.id,
        'dinheiro'
    );
    
    RAISE NOTICE 'Transação de caixa criada para pagamento de funcionário: % - %', 
        employee_name, NEW.amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar adiantamentos
CREATE OR REPLACE FUNCTION handle_employee_advance()
RETURNS TRIGGER AS $$
DECLARE
    employee_name TEXT;
    transaction_description TEXT;
BEGIN
    -- Buscar nome do funcionário
    SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
    
    transaction_description := 'Adiantamento - ' || COALESCE(employee_name, 'Funcionário') || 
        ' (' || UPPER(REPLACE(NEW.payment_method, '_', ' ')) || ')';
    
    -- Inserir transação de caixa apenas para métodos que afetam o caixa
    IF NEW.payment_method IN ('dinheiro', 'pix', 'transferencia') THEN
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
            transaction_description,
            'adiantamento',
            NEW.id,
            NEW.payment_method
        );
        
        RAISE NOTICE 'Transação de caixa criada para adiantamento: % - %', 
            employee_name, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar tarifas PIX
CREATE OR REPLACE FUNCTION handle_pix_fee()
RETURNS TRIGGER AS $$
DECLARE
    transaction_description TEXT;
BEGIN
    transaction_description := 'Tarifa PIX - ' || NEW.bank || ': ' || NEW.description;
    
    -- Inserir transação de caixa
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
        transaction_description,
        'outro',
        NEW.id,
        'pix'
    );
    
    RAISE NOTICE 'Transação de caixa criada para tarifa PIX: % - %', NEW.bank, NEW.amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para processar impostos
CREATE OR REPLACE FUNCTION handle_tax_payment()
RETURNS TRIGGER AS $$
DECLARE
    transaction_description TEXT;
    tax_type_label TEXT;
BEGIN
    -- Converter tipo de imposto para label legível
    tax_type_label := CASE NEW.tax_type
        WHEN 'irpj' THEN 'IRPJ'
        WHEN 'csll' THEN 'CSLL'
        WHEN 'pis' THEN 'PIS'
        WHEN 'cofins' THEN 'COFINS'
        WHEN 'icms' THEN 'ICMS'
        WHEN 'iss' THEN 'ISS'
        WHEN 'simples_nacional' THEN 'Simples Nacional'
        WHEN 'inss' THEN 'INSS'
        WHEN 'fgts' THEN 'FGTS'
        WHEN 'iptu' THEN 'IPTU'
        WHEN 'ipva' THEN 'IPVA'
        ELSE 'Outros'
    END;
    
    transaction_description := 'Imposto - ' || tax_type_label || ': ' || NEW.description;
    
    -- Inserir transação de caixa apenas para métodos que afetam o caixa
    IF NEW.payment_method IN ('dinheiro', 'pix', 'transferencia', 'cartao_debito') THEN
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
            transaction_description,
            'outro',
            NEW.id,
            NEW.payment_method
        );
        
        RAISE NOTICE 'Transação de caixa criada para imposto: % - %', tax_type_label, NEW.amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers para o sistema automático de caixa

-- Trigger para atualizar saldo automaticamente
DROP TRIGGER IF EXISTS auto_update_cash_balance ON cash_transactions;
CREATE TRIGGER auto_update_cash_balance
    AFTER INSERT OR UPDATE OR DELETE ON cash_transactions
    FOR EACH ROW EXECUTE FUNCTION update_cash_balance();

-- Trigger para vendas
DROP TRIGGER IF EXISTS auto_handle_sale_cash ON sales;
CREATE TRIGGER auto_handle_sale_cash
    AFTER INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION handle_sale_cash_transaction();

-- Trigger para dívidas
DROP TRIGGER IF EXISTS auto_handle_debt_payment ON debts;
CREATE TRIGGER auto_handle_debt_payment
    AFTER UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION handle_debt_payment();

-- Trigger para cheques
DROP TRIGGER IF EXISTS auto_handle_check_payment ON checks;
CREATE TRIGGER auto_handle_check_payment
    AFTER UPDATE ON checks
    FOR EACH ROW EXECUTE FUNCTION handle_check_payment();

-- Trigger para boletos
DROP TRIGGER IF EXISTS auto_handle_boleto_payment ON boletos;
CREATE TRIGGER auto_handle_boleto_payment
    AFTER UPDATE ON boletos
    FOR EACH ROW EXECUTE FUNCTION handle_boleto_payment();

-- Trigger para pagamentos de funcionários
DROP TRIGGER IF EXISTS auto_handle_employee_payment ON employee_payments;
CREATE TRIGGER auto_handle_employee_payment
    AFTER INSERT ON employee_payments
    FOR EACH ROW EXECUTE FUNCTION handle_employee_payment();

-- Trigger para adiantamentos
DROP TRIGGER IF EXISTS auto_handle_employee_advance ON employee_advances;
CREATE TRIGGER auto_handle_employee_advance
    AFTER INSERT ON employee_advances
    FOR EACH ROW EXECUTE FUNCTION handle_employee_advance();

-- Trigger para tarifas PIX
DROP TRIGGER IF EXISTS auto_handle_pix_fee ON pix_fees;
CREATE TRIGGER auto_handle_pix_fee
    AFTER INSERT ON pix_fees
    FOR EACH ROW EXECUTE FUNCTION handle_pix_fee();

-- Trigger para impostos
DROP TRIGGER IF EXISTS auto_handle_tax_payment ON taxes;
CREATE TRIGGER auto_handle_tax_payment
    AFTER INSERT ON taxes
    FOR EACH ROW EXECUTE FUNCTION handle_tax_payment();

-- Função para prevenir duplicatas em transações de caixa
CREATE OR REPLACE FUNCTION prevent_duplicate_cash_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se já existe uma transação similar
    IF EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE date = NEW.date
          AND type = NEW.type
          AND amount = NEW.amount
          AND description = NEW.description
          AND category = NEW.category
          AND COALESCE(related_id, '') = COALESCE(NEW.related_id, '')
          AND id != COALESCE(NEW.id, '')
    ) THEN
        RAISE NOTICE 'Transação de caixa duplicada prevenida: % - %', NEW.description, NEW.amount;
        RETURN NULL; -- Previne a inserção
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para prevenir duplicatas
DROP TRIGGER IF EXISTS prevent_duplicate_cash_transactions_trigger ON cash_transactions;
CREATE TRIGGER prevent_duplicate_cash_transactions_trigger
    BEFORE INSERT ON cash_transactions
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_cash_transactions();
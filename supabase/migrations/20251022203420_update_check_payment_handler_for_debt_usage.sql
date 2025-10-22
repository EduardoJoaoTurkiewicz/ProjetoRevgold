/*
  # Atualizar handler de pagamento de cheques para não afetar caixa quando usados em dívidas
  
  1. Alterações
    - Modifica função `handle_check_payment()` para verificar se o cheque foi usado em dívida
    - Cheques usados em dívidas (campo `used_in_debt` preenchido) NÃO geram transação de caixa
    - Apenas cheques compensados diretamente (sem uso em dívida) afetam o caixa
  
  2. Lógica
    - Se `NEW.used_in_debt IS NOT NULL` -> não cria cash_transaction (cheque foi usado para pagar fornecedor)
    - Se `NEW.used_in_debt IS NULL` -> cria cash_transaction normalmente (cheque foi depositado/compensado)
*/

CREATE OR REPLACE FUNCTION handle_check_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'compensado'
  IF OLD.status != 'compensado' AND NEW.status = 'compensado' THEN
    
    -- Se o cheque foi usado em uma dívida, NÃO cria transação de caixa
    -- Porque o cheque foi usado para pagar um fornecedor diretamente, não entrou no caixa
    IF NEW.used_in_debt IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Cheque próprio ou da empresa pagável
    IF NEW.is_own_check = true OR NEW.is_company_payable = true THEN
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
      -- Cheque de terceiros (cliente)
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;
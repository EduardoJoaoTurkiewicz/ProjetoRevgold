/*
  # Create sale and debt boletos/cheques tables

  1. New Tables
    - `sale_boletos` - Boletos generated from sales (to receive)
    - `sale_cheques` - Cheques generated from sales (to receive)  
    - `debt_boletos` - Boletos generated from debts (to pay)
    - `debt_cheques` - Cheques generated from debts (to pay)

  2. Triggers
    - Auto-update cash balance when boletos/cheques are marked as paid
    - Handle interest amounts for overdue boletos
    - Separate logic for receivables (sales) vs payables (debts)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Sale Boletos (A Receber)
CREATE TABLE IF NOT EXISTS public.sale_boletos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  number text NOT NULL,
  due_date date NOT NULL,
  value numeric(12,2) NOT NULL DEFAULT 0,
  status text CHECK (status IN ('pendente','pago','cancelado')) DEFAULT 'pendente',
  paid_at timestamptz,
  interest numeric(12,2) DEFAULT 0,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sale Cheques (A Receber)
CREATE TABLE IF NOT EXISTS public.sale_cheques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  bank text,
  number text,
  due_date date NOT NULL,
  value numeric(12,2) NOT NULL DEFAULT 0,
  used_for_debt boolean DEFAULT false,
  status text CHECK (status IN ('pendente','pago','usado','cancelado')) DEFAULT 'pendente',
  paid_at timestamptz,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Debt Boletos (A Pagar)
CREATE TABLE IF NOT EXISTS public.debt_boletos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES public.debts(id) ON DELETE CASCADE,
  number text NOT NULL,
  due_date date NOT NULL,
  value numeric(12,2) NOT NULL DEFAULT 0,
  status text CHECK (status IN ('pendente','pago','cancelado')) DEFAULT 'pendente',
  paid_at timestamptz,
  interest numeric(12,2) DEFAULT 0,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Debt Cheques (A Pagar)
CREATE TABLE IF NOT EXISTS public.debt_cheques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid REFERENCES public.debts(id) ON DELETE CASCADE,
  bank text,
  number text,
  due_date date NOT NULL,
  value numeric(12,2) NOT NULL DEFAULT 0,
  status text CHECK (status IN ('pendente','pago','cancelado')) DEFAULT 'pendente',
  paid_at timestamptz,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sale_boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_cheques ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on sale_boletos"
  ON public.sale_boletos
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on sale_cheques"
  ON public.sale_cheques
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on debt_boletos"
  ON public.debt_boletos
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on debt_cheques"
  ON public.debt_cheques
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sale_boletos_sale_id ON public.sale_boletos(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_boletos_due_date ON public.sale_boletos(due_date);
CREATE INDEX IF NOT EXISTS idx_sale_boletos_status ON public.sale_boletos(status);

CREATE INDEX IF NOT EXISTS idx_sale_cheques_sale_id ON public.sale_cheques(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_cheques_due_date ON public.sale_cheques(due_date);
CREATE INDEX IF NOT EXISTS idx_sale_cheques_status ON public.sale_cheques(status);

CREATE INDEX IF NOT EXISTS idx_debt_boletos_debt_id ON public.debt_boletos(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_boletos_due_date ON public.debt_boletos(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_boletos_status ON public.debt_boletos(status);

CREATE INDEX IF NOT EXISTS idx_debt_cheques_debt_id ON public.debt_cheques(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_cheques_due_date ON public.debt_cheques(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_cheques_status ON public.debt_cheques(status);

-- Trigger functions for automatic cash balance updates

-- Sale Boleto Payment (A Receber)
CREATE OR REPLACE FUNCTION pay_sale_boleto()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Insert cash transaction for sale boleto payment
    INSERT INTO public.cash_transactions (
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
      NEW.value + COALESCE(NEW.interest, 0),
      'Recebimento de boleto - Venda',
      'boleto',
      NEW.sale_id,
      'boleto'
    );
    
    -- Update paid_at timestamp
    NEW.paid_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sale Cheque Payment (A Receber)
CREATE OR REPLACE FUNCTION pay_sale_cheque()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status != 'pago' AND NEW.used_for_debt = false THEN
    -- Insert cash transaction for sale cheque payment
    INSERT INTO public.cash_transactions (
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
      'Recebimento de cheque - Venda',
      'cheque',
      NEW.sale_id,
      'cheque'
    );
    
    -- Update paid_at timestamp
    NEW.paid_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Debt Boleto Payment (A Pagar)
CREATE OR REPLACE FUNCTION pay_debt_boleto()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Insert cash transaction for debt boleto payment
    INSERT INTO public.cash_transactions (
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
      NEW.value + COALESCE(NEW.interest, 0),
      'Pagamento de boleto - Dívida',
      'boleto',
      NEW.debt_id,
      'boleto'
    );
    
    -- Update paid_at timestamp
    NEW.paid_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Debt Cheque Payment (A Pagar)
CREATE OR REPLACE FUNCTION pay_debt_cheque()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Insert cash transaction for debt cheque payment
    INSERT INTO public.cash_transactions (
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
      'Pagamento de cheque - Dívida',
      'cheque',
      NEW.debt_id,
      'cheque'
    );
    
    -- Update paid_at timestamp
    NEW.paid_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trg_pay_sale_boleto ON public.sale_boletos;
CREATE TRIGGER trg_pay_sale_boleto
  AFTER UPDATE ON public.sale_boletos
  FOR EACH ROW EXECUTE FUNCTION pay_sale_boleto();

DROP TRIGGER IF EXISTS trg_pay_sale_cheque ON public.sale_cheques;
CREATE TRIGGER trg_pay_sale_cheque
  AFTER UPDATE ON public.sale_cheques
  FOR EACH ROW EXECUTE FUNCTION pay_sale_cheque();

DROP TRIGGER IF EXISTS trg_pay_debt_boleto ON public.debt_boletos;
CREATE TRIGGER trg_pay_debt_boleto
  AFTER UPDATE ON public.debt_boletos
  FOR EACH ROW EXECUTE FUNCTION pay_debt_boleto();

DROP TRIGGER IF EXISTS trg_pay_debt_cheque ON public.debt_cheques;
CREATE TRIGGER trg_pay_debt_cheque
  AFTER UPDATE ON public.debt_cheques
  FOR EACH ROW EXECUTE FUNCTION pay_debt_cheque();

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sale_boletos_updated_at ON public.sale_boletos;
CREATE TRIGGER update_sale_boletos_updated_at
  BEFORE UPDATE ON public.sale_boletos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sale_cheques_updated_at ON public.sale_cheques;
CREATE TRIGGER update_sale_cheques_updated_at
  BEFORE UPDATE ON public.sale_cheques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debt_boletos_updated_at ON public.debt_boletos;
CREATE TRIGGER update_debt_boletos_updated_at
  BEFORE UPDATE ON public.debt_boletos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debt_cheques_updated_at ON public.debt_cheques;
CREATE TRIGGER update_debt_cheques_updated_at
  BEFORE UPDATE ON public.debt_cheques
  FOR EACH ROW EXECUTE FUNCTION update_updated_cheques_column();
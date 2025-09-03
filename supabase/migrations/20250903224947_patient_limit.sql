/*
  # Complete Sales System Fix with RPC and Cash Flow

  1. Schema Normalization
    - Fix UUID type issues in sales table
    - Create sale_boletos and sale_cheques tables
    - Ensure cash_balances and cash_transactions are properly structured

  2. Transactional RPCs
    - create_sale: Creates sale with automatic boleto/check generation
    - mark_sale_boleto_paid: Marks boleto as paid and creates cash entry
    - mark_sale_cheque_paid: Marks check as paid and creates cash entry

  3. Views for Reports
    - v_boletos_receber: Pending boletos to receive
    - v_cheques_receber: Pending checks to receive
    - v_a_receber: Summary of amounts to receive

  4. Triggers
    - Automatic cash balance updates via cash_transactions
    - Proper UUID casting and validation
*/

-- Extensions
create extension if not exists pgcrypto;

-- SALES: ensure correct types
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  delivery_date date,
  client text not null,                -- Keep as text for client names
  seller_id uuid,                      -- UUID for employee reference
  custom_commission_rate numeric(5,2) default 5.00,
  products jsonb default '[]'::jsonb,
  observations text,
  total_value numeric(14,2) not null default 0,
  payment_methods jsonb default '[]'::jsonb,
  payment_description text,
  payment_observations text,
  received_amount numeric(14,2) not null default 0,
  pending_amount numeric(14,2) not null default 0,
  status text not null default 'pendente' check (status in ('pago', 'pendente', 'parcial')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fix seller_id type if it exists with wrong type
do $$
begin
  if exists(select 1 from information_schema.columns 
            where table_name='sales' and column_name='seller_id' and data_type <> 'uuid') then
    alter table public.sales alter column seller_id type uuid using 
      case when seller_id is null or seller_id = '' then null else seller_id::uuid end;
  end if;
end$$;

-- Indexes
create index if not exists idx_sales_client on public.sales(client);
create index if not exists idx_sales_seller on public.sales(seller_id);
create index if not exists idx_sales_date on public.sales(date);
create index if not exists idx_sales_status on public.sales(status);

-- Sale Boletos table (A Receber)
create table if not exists public.sale_boletos (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  number text not null,
  due_date date not null,
  value numeric(14,2) not null check (value > 0),
  status text not null check (status in ('pendente','pago','cancelado')) default 'pendente',
  interest numeric(14,2) default 0,
  paid_at timestamptz,
  observations text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sale_boletos_sale on public.sale_boletos(sale_id);
create index if not exists idx_sale_boletos_status on public.sale_boletos(status);
create index if not exists idx_sale_boletos_due_date on public.sale_boletos(due_date);

-- Sale Cheques table (A Receber)
create table if not exists public.sale_cheques (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  bank text,
  number text,
  due_date date not null,
  value numeric(14,2) not null check (value > 0),
  used_for_debt boolean default false,
  status text not null check (status in ('pendente','pago','usado','cancelado')) default 'pendente',
  paid_at timestamptz,
  observations text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sale_cheques_sale on public.sale_cheques(sale_id);
create index if not exists idx_sale_cheques_status on public.sale_cheques(status);
create index if not exists idx_sale_cheques_due_date on public.sale_cheques(due_date);

-- Ensure cash tables exist with correct structure
create table if not exists public.cash_balances (
  id uuid primary key default gen_random_uuid(),
  current_balance numeric(15,2) not null default 0,
  initial_balance numeric(15,2) not null default 0,
  initial_date date not null default current_date,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  type text not null check (type in ('entrada','saida')),
  amount numeric(15,2) not null check (amount >= 0),
  description text not null,
  category text not null check (category in ('venda','divida','adiantamento','salario','comissao','cheque','boleto','outro')),
  related_id uuid,
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cash_transactions_date on public.cash_transactions(date);
create index if not exists idx_cash_transactions_type on public.cash_transactions(type);
create index if not exists idx_cash_transactions_category on public.cash_transactions(category);
create index if not exists idx_cash_transactions_related_id on public.cash_transactions(related_id);

-- Enable RLS
alter table public.sales enable row level security;
alter table public.sale_boletos enable row level security;
alter table public.sale_cheques enable row level security;
alter table public.cash_balances enable row level security;
alter table public.cash_transactions enable row level security;

-- Permissive policies for development
do $$
begin
  if not exists (select 1 from pg_policies where tablename='sales' and policyname='sales_all') then
    create policy sales_all on public.sales for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='sale_boletos' and policyname='sale_boletos_all') then
    create policy sale_boletos_all on public.sale_boletos for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='sale_cheques' and policyname='sale_cheques_all') then
    create policy sale_cheques_all on public.sale_cheques for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='cash_balances' and policyname='cash_balances_all') then
    create policy cash_balances_all on public.cash_balances for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='cash_transactions' and policyname='cash_transactions_all') then
    create policy cash_transactions_all on public.cash_transactions for all to anon, authenticated using (true) with check (true);
  end if;
end$$;

-- Utility function: validate/cast UUID with clear error
create or replace function public.cast_uuid_str(s text)
returns uuid
language plpgsql as $$
begin
  if s is null or length(trim(s)) = 0 then
    return null;
  end if;
  return s::uuid;
exception when others then
  raise exception 'UUID inválido: %', s using errcode = '22P02';
end;
$$;

-- Cash balance update function and trigger
create or replace function public.update_cash_balance()
returns trigger language plpgsql as $$
declare 
  bal record; 
  novo numeric(15,2);
begin
  -- Ensure at least one balance record exists
  if not exists (select 1 from public.cash_balances) then
    insert into public.cash_balances (current_balance, initial_balance, initial_date, last_updated)
    values (0, 0, current_date, now());
  end if;

  select * into bal from public.cash_balances order by created_at asc limit 1;

  if tg_op = 'INSERT' then
    if new.type = 'entrada' then 
      novo := bal.current_balance + new.amount; 
    else 
      novo := bal.current_balance - new.amount; 
    end if;
  elsif tg_op = 'DELETE' then
    if old.type = 'entrada' then 
      novo := bal.current_balance - old.amount; 
    else 
      novo := bal.current_balance + old.amount; 
    end if;
  elsif tg_op = 'UPDATE' then
    -- Remove old transaction effect
    if old.type = 'entrada' then 
      novo := bal.current_balance - old.amount; 
    else 
      novo := bal.current_balance + old.amount; 
    end if;
    -- Add new transaction effect
    if new.type = 'entrada' then 
      novo := novo + new.amount; 
    else 
      novo := novo - new.amount; 
    end if;
  end if;

  update public.cash_balances 
  set current_balance = novo, last_updated = now(), updated_at = now() 
  where id = bal.id;
  
  return coalesce(new, old);
end; 
$$;

drop trigger if exists trg_cash_tx on public.cash_transactions;
create trigger trg_cash_tx 
  after insert or update or delete on public.cash_transactions
  for each row execute function public.update_cash_balance();

-- RPC: Create sale transactionally with automatic boleto/check generation
create or replace function public.create_sale(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_seller uuid := cast_uuid_str(payload->>'seller_id');
  v_total numeric := coalesce((payload->>'total_value')::numeric, 0);
  v_received numeric := coalesce((payload->>'received_amount')::numeric, 0);
  v_pending numeric := coalesce((payload->>'pending_amount')::numeric, 0);
  r_bol record;
  r_chq record;
begin
  -- Validate required fields
  if payload->>'client' is null or trim(payload->>'client') = '' then
    raise exception 'Cliente é obrigatório' using errcode = '23502';
  end if;

  if v_total <= 0 then
    raise exception 'Valor total deve ser maior que zero' using errcode = '23514';
  end if;

  -- Insert sale
  insert into public.sales(
    date, delivery_date, client, seller_id, custom_commission_rate,
    products, observations, total_value, payment_methods,
    payment_description, payment_observations, received_amount, pending_amount, status
  ) values (
    coalesce((payload->>'date')::date, current_date),
    nullif(payload->>'delivery_date', '')::date,
    payload->>'client',
    v_seller,
    coalesce((payload->>'custom_commission_rate')::numeric, 5.00),
    coalesce(payload->'products', '[]'::jsonb),
    nullif(payload->>'observations', ''),
    v_total,
    coalesce(payload->'payment_methods', '[]'::jsonb),
    nullif(payload->>'payment_description', ''),
    nullif(payload->>'payment_observations', ''),
    v_received,
    v_pending,
    coalesce(nullif(payload->>'status', ''), 'pendente')
  ) returning id into v_sale_id;

  -- Generate boletos if provided: [{number, due_date, value, observations?}]
  for r_bol in
    select * from jsonb_to_recordset(coalesce(payload->'boletos', '[]'::jsonb))
      as x(number text, due_date date, value numeric, observations text)
  loop
    insert into public.sale_boletos(sale_id, number, due_date, value, observations)
    values (v_sale_id, r_bol.number, r_bol.due_date, r_bol.value, r_bol.observations);
  end loop;

  -- Generate cheques if provided: [{bank?, number?, due_date, value, used_for_debt?, observations?}]
  for r_chq in
    select * from jsonb_to_recordset(coalesce(payload->'cheques', '[]'::jsonb))
      as x(bank text, number text, due_date date, value numeric, used_for_debt boolean, observations text)
  loop
    insert into public.sale_cheques(sale_id, bank, number, due_date, value, used_for_debt, observations)
    values (v_sale_id, r_chq.bank, r_chq.number, r_chq.due_date, r_chq.value, 
            coalesce(r_chq.used_for_debt, false), r_chq.observations);
  end loop;

  -- Create immediate cash transaction if received_amount > 0
  if v_received > 0 then
    insert into public.cash_transactions(date, type, amount, description, category, related_id, payment_method)
    values (
      coalesce((payload->>'date')::date, current_date), 
      'entrada', 
      v_received,
      'Recebimento imediato da venda - ' || (payload->>'client'), 
      'venda', 
      v_sale_id, 
      'avista'
    );
  end if;

  return v_sale_id;
exception when others then
  raise exception 'Falha ao criar venda: %', sqlerrm using errcode = sqlstate, 
    hint = 'Verifique os dados fornecidos, especialmente UUIDs de vendedor e valores numéricos.';
end;
$$;

grant execute on function public.create_sale(jsonb) to anon, authenticated;

-- RPC: Mark sale boleto as paid → creates cash_transactions (entrada)
create or replace function public.mark_sale_boleto_paid(
  p_boleto_id uuid, 
  p_paid_at timestamptz default now(), 
  p_interest numeric default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare 
  v record;
  v_total_received numeric;
begin
  select b.*, s.client as sale_client into v
  from public.sale_boletos b
  join public.sales s on s.id = b.sale_id
  where b.id = p_boleto_id;

  if not found then
    raise exception 'Boleto de venda não encontrado';
  end if;

  if v.status = 'pago' then
    return; -- idempotent
  end if;

  -- Calculate total amount received (original value + interest)
  v_total_received := v.value + coalesce(p_interest, 0);

  -- Update boleto status
  update public.sale_boletos
  set status = 'pago', 
      paid_at = p_paid_at, 
      interest = coalesce(p_interest, 0),
      updated_at = now()
  where id = p_boleto_id;

  -- Create cash transaction (entrada)
  insert into public.cash_transactions(
    date, type, amount, description, category, related_id, payment_method
  ) values (
    coalesce(p_paid_at::date, current_date), 
    'entrada', 
    v_total_received,
    'Boleto pago - ' || v.sale_client || ' nº ' || v.number, 
    'boleto', 
    p_boleto_id, 
    'boleto'
  );
end;
$$;

grant execute on function public.mark_sale_boleto_paid(uuid, timestamptz, numeric) to anon, authenticated;

-- RPC: Mark sale cheque as paid → creates cash_transactions (entrada) if not used for debt
create or replace function public.mark_sale_cheque_paid(
  p_cheque_id uuid, 
  p_paid_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare 
  v record;
begin
  select c.*, s.client as sale_client into v
  from public.sale_cheques c
  join public.sales s on s.id = c.sale_id
  where c.id = p_cheque_id;

  if not found then 
    raise exception 'Cheque de venda não encontrado'; 
  end if;

  if v.status = 'pago' then 
    return; -- idempotent
  end if;

  -- Update cheque status
  update public.sale_cheques 
  set status = 'pago', 
      paid_at = p_paid_at,
      updated_at = now()
  where id = p_cheque_id;

  -- Create cash transaction only if not used for debt payment
  if coalesce(v.used_for_debt, false) = false then
    insert into public.cash_transactions(
      date, type, amount, description, category, related_id, payment_method
    ) values (
      coalesce(p_paid_at::date, current_date), 
      'entrada', 
      v.value,
      'Cheque compensado - ' || v.sale_client || ' nº ' || coalesce(v.number, '—'), 
      'cheque', 
      p_cheque_id, 
      'cheque'
    );
  end if;
end;
$$;

grant execute on function public.mark_sale_cheque_paid(uuid, timestamptz) to anon, authenticated;

-- Views for reports and tabs
create or replace view public.v_boletos_receber as
  select 
    b.id, 
    b.sale_id, 
    b.number, 
    b.due_date, 
    b.value, 
    b.status, 
    b.paid_at, 
    b.interest,
    b.observations,
    s.client as sale_client,
    s.date as sale_date
  from public.sale_boletos b
  join public.sales s on s.id = b.sale_id
  where b.status = 'pendente'
  order by b.due_date asc;

create or replace view public.v_cheques_receber as
  select 
    c.id, 
    c.sale_id, 
    c.bank, 
    c.number, 
    c.due_date, 
    c.value, 
    c.status, 
    c.paid_at, 
    c.used_for_debt,
    c.observations,
    s.client as sale_client,
    s.date as sale_date
  from public.sale_cheques c
  join public.sales s on s.id = c.sale_id
  where c.status = 'pendente'
  order by c.due_date asc;

-- Summary view for amounts to receive
create or replace view public.v_a_receber as
  select 
    'boletos' as tipo, 
    coalesce(sum(value + coalesce(interest, 0)), 0) as total,
    count(*) as quantidade
  from public.sale_boletos 
  where status = 'pendente'
  union all
  select 
    'cheques' as tipo, 
    coalesce(sum(value), 0) as total,
    count(*) as quantidade
  from public.sale_cheques 
  where status = 'pendente' and used_for_debt = false;

-- Update triggers for timestamps
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_sales_updated_at on public.sales;
create trigger update_sales_updated_at 
  before update on public.sales
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_sale_boletos_updated_at on public.sale_boletos;
create trigger update_sale_boletos_updated_at 
  before update on public.sale_boletos
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_sale_cheques_updated_at on public.sale_cheques;
create trigger update_sale_cheques_updated_at 
  before update on public.sale_cheques
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_cash_balances_updated_at on public.cash_balances;
create trigger update_cash_balances_updated_at 
  before update on public.cash_balances
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_cash_transactions_updated_at on public.cash_transactions;
create trigger update_cash_transactions_updated_at 
  before update on public.cash_transactions
  for each row execute function public.update_updated_at_column();
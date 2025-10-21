/*
  # Fix Security Issues

  1. Index Changes
    - Add missing index for `checks_used_in_debt_fkey` foreign key
    - Remove 48 unused indexes to improve write performance and reduce storage

  2. Function Security
    - Fix search_path for 22 functions to prevent search_path manipulation attacks
    - Set explicit schema-qualified search_path for all functions

  ## Details

  ### Missing Index
  - `idx_checks_used_in_debt` on checks(used_in_debt) - covers the foreign key

  ### Removed Unused Indexes
  All indexes that are not being used by queries have been dropped to:
  - Improve INSERT/UPDATE/DELETE performance
  - Reduce storage usage
  - Simplify maintenance

  ### Function Search Path Fix
  All functions now have `SET search_path = public, pg_temp` to prevent
  search_path manipulation attacks where malicious users could create
  objects in other schemas to intercept function calls.
*/

-- Add missing index for foreign key
CREATE INDEX IF NOT EXISTS idx_checks_used_in_debt ON public.checks(used_in_debt);

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_permutas_client_name;
DROP INDEX IF EXISTS public.idx_permutas_status;
DROP INDEX IF EXISTS public.idx_permutas_vehicle_plate;
DROP INDEX IF EXISTS public.idx_permutas_registration_date;
DROP INDEX IF EXISTS public.idx_cash_transactions_date;
DROP INDEX IF EXISTS public.idx_cash_transactions_type;
DROP INDEX IF EXISTS public.idx_cash_transactions_category;
DROP INDEX IF EXISTS public.idx_cash_transactions_related_id;
DROP INDEX IF EXISTS public.idx_employees_name;
DROP INDEX IF EXISTS public.idx_employees_is_active;
DROP INDEX IF EXISTS public.idx_employees_is_seller;
DROP INDEX IF EXISTS public.idx_sales_date;
DROP INDEX IF EXISTS public.idx_sales_client;
DROP INDEX IF EXISTS public.idx_sales_seller_id;
DROP INDEX IF EXISTS public.idx_sales_status;
DROP INDEX IF EXISTS public.idx_debts_date;
DROP INDEX IF EXISTS public.idx_debts_company;
DROP INDEX IF EXISTS public.idx_debts_is_paid;
DROP INDEX IF EXISTS public.idx_boletos_due_date;
DROP INDEX IF EXISTS public.idx_boletos_status;
DROP INDEX IF EXISTS public.idx_boletos_sale_id;
DROP INDEX IF EXISTS public.idx_boletos_debt_id;
DROP INDEX IF EXISTS public.idx_employee_payments_employee_id;
DROP INDEX IF EXISTS public.idx_employee_payments_payment_date;
DROP INDEX IF EXISTS public.idx_employee_advances_employee_id;
DROP INDEX IF EXISTS public.idx_employee_advances_status;
DROP INDEX IF EXISTS public.idx_employee_overtimes_employee_id;
DROP INDEX IF EXISTS public.idx_employee_overtimes_status;
DROP INDEX IF EXISTS public.idx_employee_commissions_employee_id;
DROP INDEX IF EXISTS public.idx_employee_commissions_sale_id;
DROP INDEX IF EXISTS public.idx_employee_commissions_status;
DROP INDEX IF EXISTS public.idx_pix_fees_date;
DROP INDEX IF EXISTS public.idx_pix_fees_bank;
DROP INDEX IF EXISTS public.idx_pix_fees_transaction_type;
DROP INDEX IF EXISTS public.idx_taxes_date;
DROP INDEX IF EXISTS public.idx_taxes_tax_type;
DROP INDEX IF EXISTS public.idx_taxes_due_date;
DROP INDEX IF EXISTS public.idx_agenda_events_date;
DROP INDEX IF EXISTS public.idx_agenda_events_type;
DROP INDEX IF EXISTS public.idx_agenda_events_status;
DROP INDEX IF EXISTS public.idx_acertos_client_name;
DROP INDEX IF EXISTS public.idx_acertos_status;
DROP INDEX IF EXISTS public.idx_acertos_payment_date;
DROP INDEX IF EXISTS public.idx_acertos_company_name;
DROP INDEX IF EXISTS public.idx_acertos_type;
DROP INDEX IF EXISTS public.idx_acertos_type_client;
DROP INDEX IF EXISTS public.idx_acertos_type_company;
DROP INDEX IF EXISTS public.idx_checks_due_date;
DROP INDEX IF EXISTS public.idx_checks_status;
DROP INDEX IF EXISTS public.idx_checks_sale_id;
DROP INDEX IF EXISTS public.idx_checks_debt_id;

-- Fix search_path for all functions
ALTER FUNCTION public.process_permuta_sale SET search_path = public, pg_temp;
ALTER FUNCTION public.update_permuta_values SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_pix_fee SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_employee_advance SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_tax_payment SET search_path = public, pg_temp;
ALTER FUNCTION public.recalculate_cash_balance SET search_path = public, pg_temp;
ALTER FUNCTION public.initialize_cash_balance SET search_path = public, pg_temp;
ALTER FUNCTION public.get_current_cash_balance SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_boleto_payment SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column SET search_path = public, pg_temp;
ALTER FUNCTION public.ensure_cash_balance SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_check_payment SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_debt_payment SET search_path = public, pg_temp;
ALTER FUNCTION public.update_cash_balance SET search_path = public, pg_temp;
ALTER FUNCTION public.create_commission_for_sale SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_sale_cash_transaction SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_employee_payment SET search_path = public, pg_temp;
ALTER FUNCTION public.update_acerto_related_debts SET search_path = public, pg_temp;
ALTER FUNCTION public.create_acerto_from_debt SET search_path = public, pg_temp;
ALTER FUNCTION public.get_create_sale_errors SET search_path = public, pg_temp;
ALTER FUNCTION public.clear_old_create_sale_errors SET search_path = public, pg_temp;
ALTER FUNCTION public.create_sale SET search_path = public, pg_temp;
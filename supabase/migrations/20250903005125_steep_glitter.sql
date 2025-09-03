/*
  # Remove old cash initialization function

  1. Database Changes
    - Remove the old `initialize_cash_balance` function that only runs once
    - This function was causing issues when trying to initialize cash multiple times
  
  2. Impact
    - Frontend will now use `ensure_cash_balance()` + `recalculate_cash_balance()` instead
    - More robust initialization flow that handles existing cash balances gracefully
*/

-- Remove old initialization function (if it exists)
DROP FUNCTION IF EXISTS public.initialize_cash_balance CASCADE;
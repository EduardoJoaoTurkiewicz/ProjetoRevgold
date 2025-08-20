/*
  # Add custom commission rate column to sales table

  1. Schema Changes
    - Add `custom_commission_rate` column to `sales` table
      - Type: numeric(5,2) to store percentage values with 2 decimal places
      - Default: 5.00 (5% commission rate)
      - Not null constraint with default value

  2. Purpose
    - Allows storing custom commission rates per sale
    - Enables flexible commission calculations for different sales
    - Maintains backward compatibility with existing sales
*/

-- Add custom_commission_rate column to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'custom_commission_rate'
  ) THEN
    ALTER TABLE sales ADD COLUMN custom_commission_rate numeric(5,2) DEFAULT 5.00 NOT NULL;
  END IF;
END $$;
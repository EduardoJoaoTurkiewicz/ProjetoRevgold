/*
  # Add missing columns to checks table

  1. New Columns
    - `is_third_party_check` (boolean, default false) - Indicates if check is from third party
    - `third_party_details` (jsonb, default null) - Stores third party check details

  2. Security
    - No RLS changes needed as table already has policies
*/

DO $$
BEGIN
  -- Add is_third_party_check column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'is_third_party_check'
  ) THEN
    ALTER TABLE checks ADD COLUMN is_third_party_check boolean DEFAULT false;
  END IF;

  -- Add third_party_details column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'third_party_details'
  ) THEN
    ALTER TABLE checks ADD COLUMN third_party_details jsonb DEFAULT null;
  END IF;
END $$;
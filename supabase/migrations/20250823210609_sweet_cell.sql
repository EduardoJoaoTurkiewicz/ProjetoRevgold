/*
  # Create PIX fees table

  1. New Tables
    - `pix_fees`
      - `id` (uuid, primary key)
      - `date` (date, required)
      - `amount` (numeric, required, default 0)
      - `description` (text, required)
      - `bank` (text, required)
      - `transaction_type` (text, required, enum values)
      - `related_transaction_id` (uuid, optional)
      - `created_at` (timestamp, auto-generated)
      - `updated_at` (timestamp, auto-generated)

  2. Security
    - Enable RLS on `pix_fees` table
    - Add policy for all operations for authenticated and anonymous users

  3. Constraints
    - Check constraint for transaction_type enum values
    - Non-negative amount constraint

  4. Indexes
    - Index on date for performance
    - Index on transaction_type for filtering
*/

CREATE TABLE IF NOT EXISTS pix_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text NOT NULL,
  bank text NOT NULL,
  transaction_type text NOT NULL,
  related_transaction_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE pix_fees 
ADD CONSTRAINT pix_fees_amount_check 
CHECK (amount >= 0);

ALTER TABLE pix_fees 
ADD CONSTRAINT pix_fees_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY['pix_out'::text, 'pix_in'::text, 'ted'::text, 'doc'::text, 'other'::text]));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pix_fees_date ON pix_fees USING btree (date);
CREATE INDEX IF NOT EXISTS idx_pix_fees_transaction_type ON pix_fees USING btree (transaction_type);

-- Enable RLS
ALTER TABLE pix_fees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on pix_fees"
  ON pix_fees
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_pix_fees_updated_at
  BEFORE UPDATE ON pix_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
/*
  # Create employee_overtimes table

  1. New Tables
    - `employee_overtimes`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `hours` (numeric, overtime hours worked)
      - `hourly_rate` (numeric, rate per hour)
      - `total_amount` (numeric, calculated total)
      - `date` (date, when overtime was worked)
      - `description` (text, description of overtime work)
      - `status` (text, payment status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `employee_overtimes` table
    - Add policy for authenticated users to manage all data

  3. Indexes
    - Index on employee_id for faster queries
*/

CREATE TABLE IF NOT EXISTS employee_overtimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  hours numeric(5,2) NOT NULL DEFAULT 0,
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT employee_overtimes_status_check 
    CHECK (status = ANY (ARRAY['pendente'::text, 'pago'::text])),
  CONSTRAINT employee_overtimes_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE employee_overtimes ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all for authenticated users"
  ON employee_overtimes
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_overtimes_employee_id 
  ON employee_overtimes(employee_id);
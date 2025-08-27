/*
  # Create agenda_events table

  1. New Tables
    - `agenda_events`
      - `id` (uuid, primary key)
      - `title` (text, required) - Event title
      - `description` (text, optional) - Event description
      - `date` (date, required) - Event date
      - `time` (text, optional) - Event time
      - `type` (text, required) - Event type with constraints
      - `priority` (text, required) - Event priority with constraints
      - `status` (text, required) - Event status with constraints
      - `reminder_date` (date, optional) - Reminder date
      - `observations` (text, optional) - Additional observations
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `agenda_events` table
    - Add policy for authenticated and anonymous users to perform all operations

  3. Triggers
    - Add trigger to automatically update `updated_at` timestamp
    - Add trigger to fix date storage format
*/

CREATE TABLE IF NOT EXISTS agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time text,
  type text NOT NULL DEFAULT 'evento',
  priority text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'pendente',
  reminder_date date,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints for type field
ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_type_check 
CHECK (type IN ('evento', 'reuniao', 'pagamento', 'cobranca', 'entrega', 'outros'));

-- Add constraints for priority field
ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_priority_check 
CHECK (priority IN ('baixa', 'media', 'alta', 'urgente'));

-- Add constraints for status field
ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_status_check 
CHECK (status IN ('pendente', 'concluido', 'cancelado', 'adiado'));

-- Enable Row Level Security
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (authenticated and anonymous users)
CREATE POLICY "Allow all operations on agenda_events"
  ON agenda_events
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agenda_events_date ON agenda_events(date);
CREATE INDEX IF NOT EXISTS idx_agenda_events_type ON agenda_events(type);
CREATE INDEX IF NOT EXISTS idx_agenda_events_status ON agenda_events(status);
CREATE INDEX IF NOT EXISTS idx_agenda_events_priority ON agenda_events(priority);

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_agenda_events_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to fix date storage format
CREATE TRIGGER fix_dates_agenda_events
  BEFORE INSERT OR UPDATE ON agenda_events
  FOR EACH ROW
  EXECUTE FUNCTION fix_date_storage();
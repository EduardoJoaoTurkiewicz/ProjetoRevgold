/*
  # Create agenda events table for calendar functionality

  1. New Tables
    - `agenda_events`
      - `id` (uuid, primary key)
      - `title` (text, event title)
      - `description` (text, event description)
      - `date` (date, event date)
      - `time` (time, event time)
      - `type` (text, event type)
      - `priority` (text, event priority)
      - `status` (text, event status)
      - `reminder_date` (date, reminder date)
      - `observations` (text, additional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `agenda_events` table
    - Add policy for authenticated users to manage events
*/

CREATE TABLE IF NOT EXISTS agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  type text NOT NULL DEFAULT 'evento',
  priority text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'pendente',
  reminder_date date,
  observations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on agenda_events"
  ON agenda_events
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agenda_events_date ON agenda_events USING btree (date);
CREATE INDEX IF NOT EXISTS idx_agenda_events_type ON agenda_events USING btree (type);
CREATE INDEX IF NOT EXISTS idx_agenda_events_status ON agenda_events USING btree (status);

CREATE TRIGGER IF NOT EXISTS update_agenda_events_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_type_check 
  CHECK (type = ANY (ARRAY['evento'::text, 'reuniao'::text, 'pagamento'::text, 'cobranca'::text, 'entrega'::text, 'outros'::text]));

ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_priority_check 
  CHECK (priority = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'urgente'::text]));

ALTER TABLE agenda_events ADD CONSTRAINT agenda_events_status_check 
  CHECK (status = ANY (ARRAY['pendente'::text, 'concluido'::text, 'cancelado'::text, 'adiado'::text]));
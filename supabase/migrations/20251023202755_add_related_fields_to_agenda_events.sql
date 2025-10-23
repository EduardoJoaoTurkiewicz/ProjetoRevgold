/*
  # Add related fields to agenda_events

  1. Changes
    - Add related_type and related_id fields to agenda_events table if they don't exist
    - This allows linking agenda events to specific records (sales, debts, checks, etc.)

  2. Security
    - No RLS changes needed as these are just additional metadata fields
*/

-- Add related_type and related_id columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agenda_events' AND column_name = 'related_type'
  ) THEN
    ALTER TABLE agenda_events ADD COLUMN related_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agenda_events' AND column_name = 'related_id'
  ) THEN
    ALTER TABLE agenda_events ADD COLUMN related_id text;
  END IF;
END $$;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_agenda_events_related ON agenda_events(related_type, related_id);

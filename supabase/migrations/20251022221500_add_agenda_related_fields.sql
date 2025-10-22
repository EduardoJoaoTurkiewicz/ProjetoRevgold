/*
  # Add Related Fields to Agenda Events

  1. New Columns
    - `related_type` (text) - Type of related entity (boleto, cheque, venda, divida, cartao, acerto, imposto)
    - `related_id` (uuid) - ID of the related entity
  
  2. Changes
    - Adds new columns to store relationships between agenda events and other entities
    - Allows tracking which entity triggered the agenda event
    - Creates index for better query performance
  
  3. Notes
    - These columns are nullable to support manual events without related entities
    - The related_id is indexed for fast lookups
*/

-- Add related fields to agenda_events table
ALTER TABLE agenda_events 
ADD COLUMN IF NOT EXISTS related_type TEXT,
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_agenda_events_related ON agenda_events(related_type, related_id);

-- Add comment for documentation
COMMENT ON COLUMN agenda_events.related_type IS 'Type of related entity: boleto, cheque, venda, divida, cartao, acerto, imposto';
COMMENT ON COLUMN agenda_events.related_id IS 'UUID of the related entity that triggered this event';
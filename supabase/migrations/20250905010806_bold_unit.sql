/*
  # Fix delivery_date column issue

  1. Database Schema
    - Ensure `delivery_date` column exists in sales table
    
  2. Notes
    - This migration ensures the delivery_date column exists
    - The column should already exist based on the schema, but this ensures compatibility
*/

-- Ensure delivery_date column exists in sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS delivery_date date;
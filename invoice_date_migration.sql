-- Migration to add invoice_date column to orders table

-- Add invoice_date column to orders table
ALTER TABLE orders 
ADD COLUMN invoice_date DATETIME;

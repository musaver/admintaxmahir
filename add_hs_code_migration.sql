-- Add HS Code field to products table
-- This migration adds the hsCode column to store Harmonized System Codes

-- Add hsCode column to products table
ALTER TABLE products 
ADD COLUMN hs_code VARCHAR(20) NULL
COMMENT 'Harmonized System Code for customs and tax classification';

-- Add index on hs_code for better query performance (optional)
CREATE INDEX idx_products_hs_code ON products(hs_code);

-- Verification query (run this after the migration to check):
-- SELECT COUNT(*) as total_products, 
--        COUNT(hs_code) as products_with_hs_code,
--        COUNT(hs_code) / COUNT(*) * 100 as percentage_with_hs_code
-- FROM products;

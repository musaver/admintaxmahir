-- Migration to add tax and discount fields to products and order_items tables

-- Add tax and discount columns to products table
ALTER TABLE products 
ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN price_including_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN price_excluding_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN extra_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN further_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN fed_payable_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;

-- Add tax and discount columns to order_items table
ALTER TABLE order_items 
ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN price_including_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN price_excluding_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN extra_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN further_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN fed_payable_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;
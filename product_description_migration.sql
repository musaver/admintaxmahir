-- Migration to add product_description column to order_items table

-- Add product_description column to order_items table
ALTER TABLE order_items 
ADD COLUMN product_description TEXT;

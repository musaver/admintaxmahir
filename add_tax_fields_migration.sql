-- Add new tax fields to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fixed_notified_value_or_retail_price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sale_type VARCHAR(100) DEFAULT 'Goods at standard rate';

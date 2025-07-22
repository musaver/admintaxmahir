-- Migration: Add cost tracking fields to order_items table
-- This enables profit/loss calculation for each order item

-- Add cost price and total cost columns to order_items table
ALTER TABLE order_items 
ADD COLUMN cost_price DECIMAL(10,2) NULL COMMENT 'Cost price at time of sale',
ADD COLUMN total_cost DECIMAL(10,2) NULL COMMENT 'Total cost (cost_price * quantity/weight)';

-- Create indexes for performance on profit calculations
CREATE INDEX idx_order_items_cost_price ON order_items(cost_price);
CREATE INDEX idx_order_items_total_cost ON order_items(total_cost);
CREATE INDEX idx_order_items_profit ON order_items(total_price, total_cost);

-- Update existing records to set cost prices from current product/variant data
-- This is optional - you may want to run this separately or skip if you prefer clean data

-- For simple products (no variant)
UPDATE order_items oi
INNER JOIN products p ON oi.product_id = p.id
SET oi.cost_price = CAST(p.cost_price AS DECIMAL(10,2))
WHERE oi.variant_id IS NULL 
  AND p.cost_price IS NOT NULL 
  AND oi.cost_price IS NULL;

-- For variant products
UPDATE order_items oi
INNER JOIN product_variants pv ON oi.variant_id = pv.id
SET oi.cost_price = CAST(pv.cost_price AS DECIMAL(10,2))
WHERE oi.variant_id IS NOT NULL 
  AND pv.cost_price IS NOT NULL 
  AND oi.cost_price IS NULL;

-- Calculate total_cost for updated records
UPDATE order_items 
SET total_cost = cost_price * quantity
WHERE cost_price IS NOT NULL 
  AND total_cost IS NULL 
  AND (weight_quantity IS NULL OR weight_quantity = 0);

-- For weight-based products, calculate based on weight
UPDATE order_items 
SET total_cost = cost_price * (weight_quantity / 1000) -- Assuming cost_price is per kg and weight_quantity is in grams
WHERE cost_price IS NOT NULL 
  AND total_cost IS NULL 
  AND weight_quantity IS NOT NULL 
  AND weight_quantity > 0;

-- Verification queries (uncomment to run)
-- SELECT COUNT(*) as total_items, 
--        COUNT(cost_price) as items_with_cost_price,
--        COUNT(total_cost) as items_with_total_cost
-- FROM order_items;

-- SELECT oi.product_name, oi.cost_price, oi.total_cost, oi.total_price,
--        (oi.total_price - COALESCE(oi.total_cost, 0)) as profit
-- FROM order_items oi 
-- WHERE oi.cost_price IS NOT NULL 
-- LIMIT 10; 
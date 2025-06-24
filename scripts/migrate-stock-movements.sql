-- Migration to add stock_movements table for inventory audit trail
-- Run this SQL script against your database to add the stock movements table

-- Create stock_movements table for audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(255) PRIMARY KEY,
  inventory_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  variant_id VARCHAR(255),
  movement_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INT NOT NULL,
  previous_quantity INT NOT NULL DEFAULT 0,
  new_quantity INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  reference VARCHAR(255), -- PO number, invoice, etc.
  notes TEXT,
  cost_price DECIMAL(10, 2),
  supplier VARCHAR(255),
  processed_by VARCHAR(255), -- Admin user who made the change
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Add foreign key constraints (optional - depends on your DB setup)
-- ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_inventory 
--   FOREIGN KEY (inventory_id) REFERENCES product_inventory(id) ON DELETE CASCADE;
-- ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_product 
--   FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
-- ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_variant 
--   FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;

-- Note: Make sure to backup your database before running this migration! 
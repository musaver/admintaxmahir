-- Suppliers Module Migration Script
-- Run this script to add suppliers functionality to your database

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  fax VARCHAR(20),
  website VARCHAR(500),
  tax_id VARCHAR(100),
  
  -- Primary Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(20),
  primary_contact_mobile VARCHAR(20),
  
  -- Secondary Contact
  secondary_contact_name VARCHAR(255),
  secondary_contact_email VARCHAR(255),
  secondary_contact_phone VARCHAR(20),
  secondary_contact_mobile VARCHAR(20),
  
  -- Address Information
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business Information
  payment_terms VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add supplier reference to products table
ALTER TABLE products 
ADD COLUMN supplier_id VARCHAR(255) AFTER subcategory_id,
ADD INDEX idx_supplier_id (supplier_id);

-- Add supplier reference to product_inventory table
ALTER TABLE product_inventory 
ADD COLUMN supplier_id VARCHAR(255) AFTER location,
ADD INDEX idx_supplier_id (supplier_id);

-- Add supplier reference to stock_movements table  
ALTER TABLE stock_movements 
ADD COLUMN supplier_id VARCHAR(255) AFTER supplier,
ADD INDEX idx_supplier_id (supplier_id);

-- Add purchase order fields to orders table
ALTER TABLE orders 
ADD COLUMN order_type VARCHAR(20) DEFAULT 'customer' AFTER currency,
ADD COLUMN supplier_id VARCHAR(255) AFTER order_type,
ADD COLUMN purchase_order_number VARCHAR(100) AFTER supplier_id,
ADD COLUMN expected_delivery_date DATETIME AFTER purchase_order_number,
ADD INDEX idx_order_type (order_type),
ADD INDEX idx_supplier_id (supplier_id);

-- Add foreign key constraints (optional - uncomment if you want strict referential integrity)
-- ALTER TABLE products ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
-- ALTER TABLE product_inventory ADD CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
-- ALTER TABLE stock_movements ADD CONSTRAINT fk_movements_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
-- ALTER TABLE orders ADD CONSTRAINT fk_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Insert sample supplier data (optional)
INSERT INTO suppliers (
  id, 
  name, 
  company_name, 
  email, 
  phone, 
  primary_contact_name, 
  primary_contact_email,
  address,
  city,
  state,
  country,
  payment_terms,
  currency,
  is_active
) VALUES 
(
  UUID(),
  'ABC Wholesale',
  'ABC Wholesale Distribution Inc.',
  'orders@abcwholesale.com',
  '+1-555-0123',
  'John Smith',
  'john.smith@abcwholesale.com',
  '123 Industrial Blvd',
  'Los Angeles',
  'CA',
  'USA',
  'Net 30',
  'USD',
  TRUE
),
(
  UUID(),
  'Global Suppliers Ltd',
  'Global Suppliers Limited',
  'procurement@globalsuppliers.com',
  '+1-555-0456',
  'Sarah Johnson',
  'sarah.johnson@globalsuppliers.com',
  '456 Commerce Street',
  'New York',
  'NY',
  'USA',
  'Net 60',
  'USD',
  TRUE
);

-- Verification queries (run these to check the migration)
-- SELECT COUNT(*) as supplier_count FROM suppliers;
-- DESCRIBE product_inventory;
-- DESCRIBE stock_movements;
-- DESCRIBE orders;
-- SHOW INDEXES FROM product_inventory WHERE Key_name LIKE '%supplier%';
-- SHOW INDEXES FROM stock_movements WHERE Key_name LIKE '%supplier%';
-- SHOW INDEXES FROM orders WHERE Key_name LIKE '%supplier%' OR Key_name LIKE '%order_type%';

COMMIT;

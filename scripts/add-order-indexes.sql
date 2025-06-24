-- Add indexes for better performance on order management queries
-- These indexes will improve the performance of the order listing, filtering, and management operations

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(total_amount);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items(sku);

-- Product inventory table indexes (for stock management during orders)
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON product_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_variant_id ON product_inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_variant ON product_inventory(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_quantity ON product_inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_product_inventory_available_quantity ON product_inventory(available_quantity);
CREATE INDEX IF NOT EXISTS idx_product_inventory_reserved_quantity ON product_inventory(reserved_quantity);

-- Stock movements table indexes (for audit trail)
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_id ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- Products table indexes (for order product selection)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Product variants table indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- Users table indexes (for customer information)
CREATE INDEX IF NOT EXISTS idx_users_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON user(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON user(created_at);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Returns table indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at);

-- Return items table indexes
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_order_item_id ON return_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product_id ON return_items(product_id);

-- Refunds table indexes
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_return_id ON refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at);

-- Shipping labels table indexes
CREATE INDEX IF NOT EXISTS idx_shipping_labels_order_id ON shipping_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_tracking_number ON shipping_labels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_status ON shipping_labels(status);

-- Admin tables indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(roleId);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(adminId);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(createdAt);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON orders(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_inventory_product_available ON product_inventory(product_id, available_quantity);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_product_order ON order_items(product_id, order_id); 
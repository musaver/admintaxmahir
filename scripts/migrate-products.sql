-- Migration to add variable product support to products table
-- Run this SQL script against your database to add the new columns

-- Add productType column (defaults to 'simple' for existing products)
ALTER TABLE products 
ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' AFTER meta_description;

-- Add variationAttributes column for storing attribute definitions
ALTER TABLE products 
ADD COLUMN variation_attributes JSON AFTER product_type;

-- Update existing products to have explicit productType
UPDATE products SET product_type = 'simple' WHERE product_type IS NULL;

-- Add index for better performance on product type queries
CREATE INDEX idx_products_product_type ON products(product_type);

-- Note: Make sure to backup your database before running this migration!

-- Migration script for Product Management System
-- Run this script to update your database schema

-- Add productType and variationAttributes columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS variation_attributes JSON;

-- Update existing products to have product_type = 'simple' if NULL
UPDATE products SET product_type = 'simple' WHERE product_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- Create variation_attributes table
CREATE TABLE IF NOT EXISTS variation_attributes (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(50) DEFAULT 'select',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create variation_attribute_values table
CREATE TABLE IF NOT EXISTS variation_attribute_values (
  id VARCHAR(255) PRIMARY KEY,
  attribute_id VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  color_code VARCHAR(7),
  image VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (attribute_id) REFERENCES variation_attributes(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_variation_attributes_active ON variation_attributes(is_active);
CREATE INDEX IF NOT EXISTS idx_variation_attributes_sort ON variation_attributes(sort_order);
CREATE INDEX IF NOT EXISTS idx_variation_attribute_values_attribute ON variation_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_variation_attribute_values_active ON variation_attribute_values(is_active);
CREATE INDEX IF NOT EXISTS idx_variation_attribute_values_sort ON variation_attribute_values(sort_order);

-- Insert some default variation attributes
INSERT IGNORE INTO variation_attributes (id, name, slug, description, type, sort_order) VALUES 
('attr_color', 'Color', 'color', 'Product color variations', 'color', 1),
('attr_size', 'Size', 'size', 'Product size variations', 'select', 2),
('attr_material', 'Material', 'material', 'Product material variations', 'select', 3),
('attr_style', 'Style', 'style', 'Product style variations', 'select', 4);

-- Insert some default color values
INSERT IGNORE INTO variation_attribute_values (id, attribute_id, value, slug, color_code, sort_order) VALUES 
('val_red', 'attr_color', 'Red', 'red', '#FF0000', 1),
('val_blue', 'attr_color', 'Blue', 'blue', '#0000FF', 2),
('val_green', 'attr_color', 'Green', 'green', '#008000', 3),
('val_black', 'attr_color', 'Black', 'black', '#000000', 4),
('val_white', 'attr_color', 'White', 'white', '#FFFFFF', 5),
('val_yellow', 'attr_color', 'Yellow', 'yellow', '#FFFF00', 6),
('val_purple', 'attr_color', 'Purple', 'purple', '#800080', 7),
('val_orange', 'attr_color', 'Orange', 'orange', '#FFA500', 8);

-- Insert some default size values
INSERT IGNORE INTO variation_attribute_values (id, attribute_id, value, slug, sort_order) VALUES 
('val_xs', 'attr_size', 'XS', 'xs', 1),
('val_s', 'attr_size', 'S', 's', 2),
('val_m', 'attr_size', 'M', 'm', 3),
('val_l', 'attr_size', 'L', 'l', 4),
('val_xl', 'attr_size', 'XL', 'xl', 5),
('val_xxl', 'attr_size', 'XXL', 'xxl', 6);

-- Insert some default material values
INSERT IGNORE INTO variation_attribute_values (id, attribute_id, value, slug, sort_order) VALUES 
('val_cotton', 'attr_material', 'Cotton', 'cotton', 1),
('val_polyester', 'attr_material', 'Polyester', 'polyester', 2),
('val_silk', 'attr_material', 'Silk', 'silk', 3),
('val_wool', 'attr_material', 'Wool', 'wool', 4),
('val_leather', 'attr_material', 'Leather', 'leather', 5),
('val_denim', 'attr_material', 'Denim', 'denim', 6);

-- Insert some default style values
INSERT IGNORE INTO variation_attribute_values (id, attribute_id, value, slug, sort_order) VALUES 
('val_casual', 'attr_style', 'Casual', 'casual', 1),
('val_formal', 'attr_style', 'Formal', 'formal', 2),
('val_sports', 'attr_style', 'Sports', 'sports', 3),
('val_vintage', 'attr_style', 'Vintage', 'vintage', 4),
('val_modern', 'attr_style', 'Modern', 'modern', 5); 
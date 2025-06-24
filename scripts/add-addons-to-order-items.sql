-- Add addons column to order_items table for storing selected addons as JSON
ALTER TABLE `order_items` 
ADD COLUMN `addons` JSON AFTER `product_image`;

-- Update the column comment for clarity
ALTER TABLE `order_items` 
MODIFY COLUMN `addons` JSON COMMENT 'Selected addons for group products stored as JSON array'; 
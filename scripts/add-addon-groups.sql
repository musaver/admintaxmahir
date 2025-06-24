-- Migration: Add Addon Groups functionality
-- This script adds addon groups to organize addons with headings

-- Create addon_groups table
CREATE TABLE IF NOT EXISTS `addon_groups` (
  `id` VARCHAR(255) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `sort_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add groupId column to addons table
ALTER TABLE `addons` 
ADD COLUMN `group_id` VARCHAR(255) AFTER `image`;

-- Add foreign key constraint (optional, for data integrity)
ALTER TABLE `addons` 
ADD CONSTRAINT `fk_addons_group_id` 
FOREIGN KEY (`group_id`) REFERENCES `addon_groups`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert some default addon groups (optional)
INSERT INTO `addon_groups` (`id`, `title`, `description`, `sort_order`, `is_active`) VALUES
('default-group-1', 'Essential Add-ons', 'Must-have additions to enhance your product', 0, TRUE),
('default-group-2', 'Premium Options', 'Luxury upgrades and premium features', 1, TRUE),
('default-group-3', 'Accessories', 'Additional accessories and components', 2, TRUE);

-- Update existing addons to use default group (optional)
-- UPDATE `addons` SET `group_id` = 'default-group-1' WHERE `group_id` IS NULL;

-- Add indexes for better performance
CREATE INDEX `idx_addon_groups_sort_order` ON `addon_groups` (`sort_order`);
CREATE INDEX `idx_addon_groups_is_active` ON `addon_groups` (`is_active`);
CREATE INDEX `idx_addons_group_id` ON `addons` (`group_id`);
CREATE INDEX `idx_addons_group_sort` ON `addons` (`group_id`, `sort_order`); 
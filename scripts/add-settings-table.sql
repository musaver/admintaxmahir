-- Add settings table for application configuration
CREATE TABLE IF NOT EXISTS `settings` (
  `id` varchar(255) NOT NULL,
  `key` varchar(255) NOT NULL UNIQUE,
  `value` text NOT NULL,
  `type` varchar(50) DEFAULT 'string',
  `description` text,
  `is_active` boolean DEFAULT true,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key`)
);

-- Insert default stock management setting
INSERT INTO `settings` (`id`, `key`, `value`, `type`, `description`, `is_active`) 
VALUES (
  UUID(), 
  'stock_management_enabled', 
  'true', 
  'boolean', 
  'Enable or disable stock management system', 
  true
) ON DUPLICATE KEY UPDATE 
  `updated_at` = CURRENT_TIMESTAMP; 
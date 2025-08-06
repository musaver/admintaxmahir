-- SQL commands to make driver fields optional
-- Run these commands in your MySQL database to update the schema

-- Make license_number optional (remove NOT NULL constraint)
ALTER TABLE drivers MODIFY COLUMN license_number VARCHAR(100) NULL;

-- Make vehicle_type optional (remove NOT NULL constraint)
ALTER TABLE drivers MODIFY COLUMN vehicle_type VARCHAR(100) NULL;

-- Make vehicle_plate_number optional (remove NOT NULL constraint)  
ALTER TABLE drivers MODIFY COLUMN vehicle_plate_number VARCHAR(50) NULL;

-- Make base_location optional (remove NOT NULL constraint)
ALTER TABLE drivers MODIFY COLUMN base_location VARCHAR(255) NULL;

-- Verify the changes
DESCRIBE drivers;
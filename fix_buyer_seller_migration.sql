-- Fix buyer/seller field names in orders table
-- The selected customer is the buyer, not the seller

-- If you have existing data, you may want to migrate it first:
-- UPDATE orders SET 
--   buyer_ntn_cnic = seller_ntn_cnic,
--   buyer_business_name = seller_business_name,
--   buyer_province = seller_province,
--   buyer_address = seller_address,
--   buyer_registration_type = seller_registration_type
-- WHERE seller_ntn_cnic IS NOT NULL OR seller_business_name IS NOT NULL;

-- Drop old seller columns (if they exist)
-- ALTER TABLE orders DROP COLUMN IF EXISTS seller_ntn_cnic;
-- ALTER TABLE orders DROP COLUMN IF EXISTS seller_business_name;
-- ALTER TABLE orders DROP COLUMN IF EXISTS seller_province;
-- ALTER TABLE orders DROP COLUMN IF EXISTS seller_address;
-- ALTER TABLE orders DROP COLUMN IF EXISTS seller_registration_type;

-- Add correct buyer columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_ntn_cnic VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_business_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_province VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_address VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_registration_type VARCHAR(50);

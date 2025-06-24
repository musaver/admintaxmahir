# Stock Management System Toggle

This feature allows administrators to enable or disable the stock inventory management system for the entire application.

## Overview

The stock management toggle affects how orders are processed and whether inventory levels are checked and updated automatically. **The setting is stored in the database** for persistence across server restarts.

## Database Storage

The stock management setting is stored in the `settings` table:
- **Table**: `settings`
- **Key**: `stock_management_enabled`
- **Value**: `'true'` or `'false'` (stored as string)
- **Type**: `boolean`

### Settings Table Schema
```sql
CREATE TABLE `settings` (
  `id` varchar(255) NOT NULL,
  `key` varchar(255) NOT NULL UNIQUE,
  `value` text NOT NULL,
  `type` varchar(50) DEFAULT 'string',
  `description` text,
  `is_active` boolean DEFAULT true,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key`)
);
```

## Features

### When Stock Management is ENABLED (Default)
- ✅ Orders **require** inventory records for all products before creation
- ✅ Orders check inventory availability and prevent creation if insufficient stock
- ✅ Order confirmation validates stock availability before reserving inventory
- ✅ Payment processing validates stock availability before reserving inventory
- ✅ Inventory is automatically reserved when orders are confirmed or paid
- ✅ Stock movements are tracked for all order status changes
- ✅ Inventory is restored when orders are cancelled or deleted
- ✅ Product variants show stock levels during order creation
- ✅ Clear error messages when stock validation fails

### When Stock Management is DISABLED
- ❌ Orders can be created without inventory records or stock limitations
- ❌ No inventory checks during order creation or editing
- ❌ No automatic inventory reservations or updates
- ❌ No stock movement tracking for orders
- ❌ Products show "No stock limit" indicator

## How to Use

### Toggle Stock Management
1. Go to **Inventory** page (`/inventory`)
2. Click the **"Enable/Disable Stock Management"** button in the top-right toolbar
3. Confirm the action when prompted

### Visual Indicators
- **Green status bar**: Stock management is enabled
- **Orange status bar**: Stock management is disabled
- Status is shown on both Inventory and Order pages

### Order Creation Impact
- **Add Order page**: Shows notice when stock management is disabled
- **Edit Order page**: Shows notice that status changes won't affect inventory
- **Products**: Display "(No stock limit)" when stock management is disabled

## API Endpoints

### Get Stock Management Setting
```http
GET /api/settings/stock-management
```
Response:
```json
{
  "stockManagementEnabled": true
}
```

### Update Stock Management Setting
```http
POST /api/settings/stock-management
Content-Type: application/json

{
  "enabled": false
}
```
Response:
```json
{
  "stockManagementEnabled": false,
  "message": "Stock management disabled successfully"
}
```

## Technical Implementation

### Database Migration
Run the migration script to add the settings table:
```bash
mysql -u your_username -p your_database < scripts/add-settings-table.sql
```

### Files Modified
- `lib/schema.ts` - Added settings table schema
- `app/api/settings/stock-management/route.ts` - Database-backed API endpoints
- `app/inventory/page.tsx` - Toggle button and status display
- `app/api/orders/route.ts` - Conditional stock checking
- `app/api/orders/[id]/route.ts` - Conditional inventory updates
- `app/orders/add/page.tsx` - Stock management notices
- `app/orders/edit/[id]/page.tsx` - Stock management notices
- `lib/stockManagement.ts` - Utility functions with database support
- `scripts/add-settings-table.sql` - Database migration script

### Key Changes
1. **Database Storage**: Setting is now persisted in the `settings` table
2. **Order Creation**: Stock validation is skipped when disabled
3. **Order Updates**: Inventory changes are skipped when disabled
4. **Order Deletion**: Inventory restoration is skipped when disabled
5. **UI Indicators**: Visual feedback on all relevant pages
6. **Server-side Access**: Direct database access for API routes

## Utility Functions

### Client-side (Frontend)
```typescript
import { getStockManagementSetting, updateStockManagementSetting } from '@/lib/stockManagement';

// Get current setting
const isEnabled = await getStockManagementSetting();

// Update setting
await updateStockManagementSetting(false);
```

### Server-side (API Routes)
```typescript
import { getStockManagementSettingDirect } from '@/lib/stockManagement';

// Direct database access (faster for API routes)
const isEnabled = await getStockManagementSettingDirect();
```

## Notes

- Setting defaults to **enabled** for safety
- Setting is stored in database for persistence across restarts
- All API routes gracefully fallback to enabled if setting cannot be fetched
- No existing orders or inventory records are affected by toggling the setting
- The settings table can be extended for other application configurations

## Use Cases

### When to Disable Stock Management
- **Digital products only**: No physical inventory to track
- **Service-based business**: Appointments/services don't deplete stock
- **Testing/development**: Create orders without stock constraints
- **Migration period**: Temporarily disable while setting up inventory

### When to Keep Enabled
- **Physical products**: Need accurate inventory tracking
- **Limited quantity items**: Prevent overselling
- **Multi-channel selling**: Centralized inventory management
- **Compliance requirements**: Audit trail for stock movements

## Error Handling and Validation

### When Stock Management is Enabled

The system provides detailed error messages for various stock-related scenarios:

#### Order Creation Errors
- **Missing Inventory Record**: "No inventory record found for [Product Name]. Please create an inventory record first or disable stock management."
- **Insufficient Stock**: "Insufficient stock for [Product Name]. Available: X, Requested: Y"
- **Out of Stock**: "[Product Name] is out of stock. Total quantity: 0"

#### Order Status Change Errors
- **Confirmation Failure**: "Cannot confirm order: Insufficient stock for [Product Name]. Available: X, Required: Y"
- **Payment Processing Failure**: "Cannot process payment: Insufficient stock for [Product Name]. Available: X, Required: Y"

#### Frontend Warnings
- **Stock Warning**: Warning dialog when adding products with insufficient stock to orders
- **Visual Indicators**: Stock levels displayed in product and variant selection dropdowns
- **Status Change Warnings**: Clear information about what happens when changing order status

### Best Practices

1. **Create Inventory Records**: Ensure all products have inventory records before enabling stock management
2. **Monitor Stock Levels**: Regularly check inventory levels and restock as needed
3. **Handle Errors Gracefully**: The system will prevent invalid operations and provide clear error messages
4. **Use Status Warnings**: Pay attention to status change warnings in the order edit interface 
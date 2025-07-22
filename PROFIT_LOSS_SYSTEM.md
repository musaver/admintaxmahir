# 📈 Profit & Loss Tracking System

## Overview

A comprehensive profit and loss tracking system that provides real-time profitability analysis for both quantity-based and weight-based products. The system captures cost prices at the time of sale and provides detailed reporting and analytics.

## ✅ Features Implemented

### 🗄️ Database Schema Enhancements

#### Order Items Cost Tracking
- **`costPrice`** - Cost price captured at time of sale
- **`totalCost`** - Calculated total cost (costPrice × quantity/weight)
- **Indexes** - Performance optimized for profit calculations

#### Cost Price Storage
- **Products** - `costPrice` field for simple products
- **Product Variants** - `costPrice` field for variable products
- **Weight-based** - Cost price stored per unit weight (grams/kg)

### 🔄 Automatic Cost Capture

#### Order Creation Process
1. **Cost Price Lookup** - Retrieves current cost from product/variant
2. **Weight-based Calculation** - For weight-based products: `costPrice × (weightInGrams / 1000)`
3. **Quantity-based Calculation** - For quantity-based products: `costPrice × quantity`
4. **Database Storage** - Stores both unit cost and total cost in order items

### 📊 Profit Calculation Utilities

#### Core Functions (`utils/profitUtils.ts`)
- **`calculateItemProfit()`** - Calculate profit for individual items
- **`calculateOrderProfitSummary()`** - Calculate profit for entire orders
- **`formatProfitDisplay()`** - Format profit data for display
- **`getProfitStatus()`** - Get profit status indicators
- **`getProfitMarginTier()`** - Categorize profit margins

#### Profit Metrics
- **Revenue** = Order item price × quantity
- **Cost** = Cost price × quantity/weight
- **Profit** = Revenue - Cost
- **Margin** = (Profit / Revenue) × 100

### 📈 Reports & Analytics

#### 1. Profit & Loss Report (`/reports/profits`)
**Features:**
- Order-level profit analysis
- Item-level profit breakdown
- Date range filtering
- Product filtering
- CSV export
- Expandable order details
- Profit status indicators

**Key Metrics:**
- Total Revenue
- Total Cost
- Total Profit
- Average Margin
- Profitable vs Loss Items

#### 2. Sales Report (`/reports/sales`)
**Features:**
- Comprehensive sales analytics
- Top products by revenue
- Sales by status/payment status
- Daily/monthly trends
- CSV export
- Customer analytics

**Key Metrics:**
- Total Orders
- Total Revenue
- Average Order Value
- Sales Distribution

#### 3. Reports Hub (`/reports`)
**Features:**
- Centralized report navigation
- Quick action buttons
- Report categories
- Feature overview

### 🖥️ User Interface Enhancements

#### 1. Enhanced Dashboard
**New Widgets:**
- **Revenue Widget** - Total revenue with trend
- **Profit/Loss Widget** - Net profit with status indicator
- **Margin Widget** - Profit margin percentage
- **Average Order Value** - AOV tracking

#### 2. Orders Listing Page
**New Columns:**
- **Profit/Loss Column** - Shows profit/loss per order with status icons
- **Margin Column** - Profit margin percentage with color coding
- **Enhanced Summary Cards** - Added total cost and profit cards

#### 3. Navigation Updates
- Added **Reports** menu item
- Quick access to profit reports
- Integrated with existing navigation

### 🎯 Weight-Based Product Support

#### Cost Calculation
- **Storage** - Cost price per unit weight (per gram/kg)
- **Calculation** - `costPrice × (weightInGrams / 1000)`
- **Display** - Proper weight unit formatting

#### Order Processing
- Automatic weight-based cost calculation
- Weight quantity tracking
- Unit conversion handling

## 🚀 Usage Guide

### 1. Setting Up Cost Prices

#### For Simple Products
1. Go to **Products** → **Edit Product**
2. Set **Cost Price** in the pricing section
3. Save the product

#### For Variable Products
1. Go to **Products** → **Edit Product**
2. In the **Variants** section, set **Cost Price** for each variant
3. Save the product

#### For Weight-Based Products
1. Set **Cost Price** as price per unit weight
2. System automatically calculates based on ordered weight
3. Supports both grams and kg units

### 2. Viewing Profit Reports

#### Profit & Loss Report
1. Navigate to **Reports** → **Profit & Loss Report**
2. Use date filters to select time period
3. Filter by specific products if needed
4. Click on orders to expand item details
5. Export data using **Export CSV** button

#### Sales Report
1. Navigate to **Reports** → **Sales Report**
2. Apply filters for date range and status
3. View top products and sales analytics
4. Export data for further analysis

#### Dashboard Overview
1. View financial widgets on main dashboard
2. Click widgets to navigate to detailed reports
3. Monitor real-time profit/loss trends

### 3. Order Management

#### Creating Orders
- Cost prices are automatically captured from current product data
- System calculates profit in real-time
- Supports both quantity and weight-based products

#### Viewing Order Profits
- **Orders Listing** - See profit/loss for each order
- **Order Details** - View item-level profit breakdown
- **Color Coding** - Green for profit, red for loss

## 📊 Profit Analysis Features

### Profit Status Indicators
- **📈 Profit** - Green indicators for profitable items/orders
- **📉 Loss** - Red indicators for loss-making items/orders
- **➖ Break-even** - Gray indicators for zero profit

### Margin Tiers
- **Excellent** - 50%+ margin (Green)
- **Good** - 30-49% margin (Light Green)
- **Average** - 15-29% margin (Yellow)
- **Low** - 0-14% margin (Orange)
- **Loss** - Negative margin (Red)

### Export Capabilities
- **CSV Export** - All reports support CSV export
- **Detailed Data** - Includes all profit metrics
- **Date Stamped** - Files include generation date

## 🔧 Technical Implementation

### Database Migration
```sql
-- Run the migration script
mysql your_database < scripts/add-cost-tracking-to-orders.sql
```

### API Endpoints

#### `/api/reports/profits`
- **GET** - Fetch profit/loss data with filtering
- **Query Parameters** - startDate, endDate, productId, export
- **Export** - Add `?export=csv` for CSV download

#### `/api/reports/sales`
- **GET** - Fetch sales analytics data
- **Query Parameters** - startDate, endDate, status, export
- **Export** - Add `?export=csv` for CSV download

#### `/api/dashboard/stats`
- **Enhanced** - Now includes profit metrics
- **Returns** - totalRevenue, totalCost, totalProfit, profitMargin

### React Components
- **ProfitUtils** - Utility functions for calculations
- **Reports Pages** - Dedicated pages for each report type
- **Dashboard Widgets** - Enhanced financial widgets

## 📋 Best Practices

### 1. Cost Price Management
- **Regular Updates** - Keep cost prices current
- **Variant-Specific** - Set costs for each variant
- **Weight Accuracy** - Ensure accurate weight-based pricing

### 2. Profit Monitoring
- **Daily Review** - Check dashboard widgets daily
- **Weekly Reports** - Run detailed profit reports weekly
- **Trend Analysis** - Monitor profit trends over time

### 3. Data Quality
- **Cost Validation** - Verify cost prices are set
- **Regular Audits** - Review profit calculations periodically
- **Export Backups** - Regular data exports for analysis

## 🔮 Future Enhancements

### Planned Features
- **PDF Reports** - Professional PDF export
- **Profit Alerts** - Notifications for low margins
- **Forecasting** - Profit trend predictions
- **Cost Analysis** - Supplier cost tracking
- **Advanced Charts** - Interactive profit charts

### Integration Opportunities
- **Accounting Software** - QuickBooks, Xero integration
- **BI Tools** - Power BI, Tableau connectors
- **Inventory Management** - Advanced cost tracking
- **Email Reports** - Automated report delivery

## 📞 Support

### Troubleshooting
1. **Missing Profit Data** - Ensure cost prices are set on products
2. **Incorrect Calculations** - Verify weight units and conversions
3. **Export Issues** - Check date filters and data availability

### Performance
- **Database Indexes** - Optimized for profit queries
- **Caching** - Report data cached for performance
- **Pagination** - Large datasets handled efficiently

---

*This profit & loss system provides comprehensive financial insights to help optimize business profitability and make data-driven decisions.* 🎯 
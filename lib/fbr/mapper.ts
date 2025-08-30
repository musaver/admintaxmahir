/**
 * FBR Invoice Mapper
 * 
 * Converts our internal order structure to FBR's required JSON format.
 * Handles field renaming, tax calculations, and scenario-specific logic.
 */

import type { Order, OrderItem, FbrInvoice, FbrItem, ScenarioId, RateLabel, SellerInfo } from './types';
import {
  getSaleTypeForScenario,
  getDefaultRateForScenario,
  requiresWithholdingTax,
  isExemptOrZeroRated,
  supportsThirdSchedule,
  requiresFedPayable,
} from './saleTypes';
import { getSaleTypeToRate } from './client';

/**
 * Convert percentage rate label to decimal
 * @param rateLabel Rate label like "18%", "0%", "Exempt", "1%"
 * @returns Decimal representation (e.g., 0.18 for "18%")
 */
export function parseRate(rateLabel: string): number {
  if (!rateLabel) return 0;
  
  const normalized = rateLabel.trim().toLowerCase();
  
  if (normalized === 'exempt' || normalized === '0%') {
    return 0;
  }
  
  // Extract percentage
  const match = normalized.match(/(\d+(?:\.\d+)?)%?/);
  if (match) {
    return parseFloat(match[1]) / 100;
  }
  
  return 0;
}

/**
 * Format decimal as rate label
 * @param decimal Decimal rate (e.g., 0.18)
 * @returns Rate label (e.g., "18%")
 */
export function formatRate(decimal: number): string {
  if (decimal === 0) return '0%';
  return `${Math.round(decimal * 100)}%`;
}

/**
 * Round number to FBR decimal requirements
 * FBR requires max 2 decimal places for most values, 4 for quantity
 * 
 * @param value The number to round
 * @param isQuantity Whether this is a quantity field (allows 4 decimal places)
 * @returns Properly rounded number
 */
function roundToFbrPrecision(value: number, isQuantity: boolean = false): number {
  const decimals = isQuantity ? 4 : 2;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Ensure all numeric values in FBR item meet decimal precision requirements
 * 
 * @param fbrItem The FBR item to sanitize
 * @returns FBR item with properly rounded numeric values
 */
function sanitizeFbrItemPrecision(fbrItem: FbrItem): FbrItem {
  return {
    ...fbrItem,
    quantity: roundToFbrPrecision(fbrItem.quantity, true), // 4 decimal places for quantity
    valueSalesExcludingST: roundToFbrPrecision(fbrItem.valueSalesExcludingST),
    totalValues: roundToFbrPrecision(fbrItem.totalValues),
    salesTaxApplicable: roundToFbrPrecision(fbrItem.salesTaxApplicable),
    fixedNotifiedValueOrRetailPrice: roundToFbrPrecision(fbrItem.fixedNotifiedValueOrRetailPrice || 0),
    salesTaxWithheldAtSource: roundToFbrPrecision(fbrItem.salesTaxWithheldAtSource || 0),
    furtherTax: roundToFbrPrecision(fbrItem.furtherTax || 0),
    fedPayable: roundToFbrPrecision(fbrItem.fedPayable || 0),
    extraTax: roundToFbrPrecision(fbrItem.extraTax || 0),
    discount: roundToFbrPrecision(fbrItem.discount || 0),
  };
}

/**
 * Get seller information from environment variables or configuration
 * This should be configured in your environment or settings
 */
function getSellerInfo(): SellerInfo {
  return {
    ntncnic: process.env.FBR_SELLER_NTNCNIC || '1234567890123',
    businessName: process.env.FBR_SELLER_BUSINESS_NAME || 'Your Business Name',
    province: process.env.FBR_SELLER_PROVINCE || 'Punjab',
    address: process.env.FBR_SELLER_ADDRESS || 'Your Business Address',
  };
}

/**
 * Calculate tax amounts for an order item based on scenario
 * @param item Order item
 * @param scenarioId FBR scenario ID
 * @returns Calculated tax amounts
 */
function calculateItemTax(item: OrderItem, scenarioId: ScenarioId) {
  const baseAmount = item.totalPrice || (item.price * item.quantity);
  const taxRate = item.taxPercentage ? item.taxPercentage / 100 : parseRate(getDefaultRateForScenario(scenarioId));
  
  let salesTaxApplicable = 0;
  let salesTaxWithheldAtSource = 0;
  let fedPayable = 0;
  
  // Calculate sales tax
  if (!isExemptOrZeroRated(scenarioId)) {
    salesTaxApplicable = baseAmount * taxRate;
  }
  
  // Calculate withholding tax for SN002 etc.
  if (requiresWithholdingTax(scenarioId)) {
    // Typically 2% withholding tax on the base amount
    salesTaxWithheldAtSource = baseAmount * 0.02;
  }
  
  // Calculate FED payable for FED-in-ST scenarios
  if (requiresFedPayable(scenarioId)) {
    // FED calculation - this may vary by product type
    fedPayable = item.fedPayableTax || 0;
  }
  
  return {
    salesTaxApplicable,
    salesTaxWithheldAtSource,
    fedPayable,
  };
}

/**
 * Map an order item to FBR item format
 * @param item Order item
 * @param scenarioId FBR scenario ID
 * @param saleType Sale type for the scenario
 * @returns FBR item
 */
function mapOrderItemToFbrItem(item: OrderItem, scenarioId: ScenarioId, saleType: string): FbrItem {
  const baseAmount = item.totalPrice || (item.price * item.quantity);
  const taxCalc = calculateItemTax(item, scenarioId);
  
  // Get rate label
  let rateLabel = getDefaultRateForScenario(scenarioId);
  if (item.taxPercentage !== undefined) {
    rateLabel = formatRate(item.taxPercentage / 100);
  }
  
  // Build FBR item with exact field names (based on working format)
  const fbrItem: FbrItem = {
    hsCode: item.hsCode || '2710.1991', // Default HS code that works
    productDescription: item.productDescription || item.productName,
    rate: rateLabel,
    uoM: item.uom || 'PCS', // Unit of Measurement
    quantity: item.quantity,
    valueSalesExcludingST: baseAmount,
    totalValues: baseAmount + taxCalc.salesTaxApplicable,
    salesTaxApplicable: taxCalc.salesTaxApplicable,
    saleType,
    // Always include these numeric fields (FBR expects them)
    fixedNotifiedValueOrRetailPrice: 0,
    salesTaxWithheldAtSource: 0,
    furtherTax: 0,
    fedPayable: 0,
    extraTax: 0,
    discount: 0,
  };
  
  // Override with actual values if provided
  
  // Withholding tax (SN002 etc.)
  if (taxCalc.salesTaxWithheldAtSource > 0) {
    fbrItem.salesTaxWithheldAtSource = taxCalc.salesTaxWithheldAtSource;
  }
  
  // Extra tax
  if (item.extraTax && item.extraTax > 0) {
    fbrItem.extraTax = item.extraTax;
  }
  
  // Further tax
  if (item.furtherTax && item.furtherTax > 0) {
    fbrItem.furtherTax = item.furtherTax;
  }
  
  // FED payable (FED-in-ST scenarios)
  if (taxCalc.fedPayable > 0) {
    fbrItem.fedPayable = taxCalc.fedPayable;
  }
  
  // Discount
  if (item.discount && item.discount > 0) {
    fbrItem.discount = item.discount;
  }
  
  // 3rd Schedule (SN008) - override the default 0
  if (supportsThirdSchedule(scenarioId) && item.fixedNotifiedValueOrRetailPrice) {
    fbrItem.fixedNotifiedValueOrRetailPrice = item.fixedNotifiedValueOrRetailPrice;
  }
  
  // SRO Schedule Number (use empty string as per working example)
  fbrItem.sroScheduleNo = item.sroScheduleNumber || "";
  
  // SRO Item Serial Number (use empty string as per working example)
  fbrItem.sroItemSerialNo = item.itemSerialNumber || "";
  
  // Apply FBR decimal precision requirements
  return sanitizeFbrItemPrecision(fbrItem);
}

/**
 * Get sale type for scenario, optionally verified against FBR's SaleTypeToRate
 * @param scenarioId FBR scenario ID
 * @param date Invoice date (YYYY-MM-DD)
 * @returns Sale type string
 */
export async function getSaleTypeForScenarioWithFallback(
  scenarioId: ScenarioId,
  date?: string
): Promise<string> {
  // Start with our local mapping
  let saleType = getSaleTypeForScenario(scenarioId);
  
  // Optionally verify against FBR's current data
  if (date) {
    try {
      const saleTypeData = await getSaleTypeToRate(date);
      if (saleTypeData && Array.isArray(saleTypeData)) {
        // Look for matching scenario in FBR's data
        const fbrEntry = saleTypeData.find((entry: any) => 
          entry.scenarioId === scenarioId || entry.saleType === saleType
        );
        
        if (fbrEntry && fbrEntry.saleType) {
          saleType = fbrEntry.saleType;
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not verify saleType against FBR data: ${error}`);
      // Continue with local mapping
    }
  }
  
  return saleType;
}

/**
 * Map our order to FBR invoice format
 * @param order Our internal order object
 * @param sellerInfo Optional seller information (uses env vars if not provided)
 * @returns FBR invoice object
 */
export async function mapOrderToFbrInvoice(
  order: Order,
  sellerInfo?: SellerInfo
): Promise<FbrInvoice> {
  // Use seller info from order if available, otherwise fall back to sellerInfo param or env variables
  const seller = (order.sellerNTNCNIC || order.sellerBusinessName) ? {
    ntncnic: order.sellerNTNCNIC || '',
    businessName: order.sellerBusinessName || '',
    province: order.sellerProvince || '',
    address: order.sellerAddress || '',
  } : (sellerInfo || getSellerInfo());
  
  // Validate required fields
  if (!order.scenarioId) {
    throw new Error('Order must have a scenarioId for FBR integration');
  }
  
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have at least one item for FBR integration');
  }
  
  const scenarioId = order.scenarioId as ScenarioId;
  const invoiceDate = order.invoiceDate || new Date().toISOString().split('T')[0];
  
  // Get sale type (with optional FBR verification)
  const saleType = await getSaleTypeForScenarioWithFallback(scenarioId, invoiceDate);
  
  // Map items to FBR format
  const fbrItems: FbrItem[] = order.items.map(item => 
    mapOrderItemToFbrItem(item, scenarioId, saleType)
  );
  
  // Build FBR invoice with exact field names
  const fbrInvoice: FbrInvoice = {
    // Header fields using exact FBR labels
    invoiceType: (order.invoiceType as "Sale Invoice" | "Debit Note") || "Sale Invoice",
    invoiceDate,
    sellerNTNCNIC: seller.ntncnic,
    sellerBusinessName: seller.businessName,
    sellerProvince: seller.province,
    sellerAddress: seller.address,
    buyerRegistrationType: (order.buyerRegistrationType || "Unregistered") as "Registered" | "Unregistered",
    scenarioId,
    items: fbrItems,
  };
  
  // Add buyer information (include for both registered and unregistered as per working format)
  fbrInvoice.buyerNTNCNIC = order.buyerNTNCNIC || "1234567890123"; // Default for unregistered
  fbrInvoice.buyerBusinessName = order.buyerBusinessName || order.email || "Customer";
  fbrInvoice.buyerProvince = order.buyerProvince || order.shippingState || order.billingState || "Punjab";
  fbrInvoice.buyerAddress = order.buyerAddress || 
    `${order.shippingAddress1 || order.billingAddress1 || ''} ${order.shippingCity || order.billingCity || ''}`.trim() ||
    "Customer Address";
    
  // Add empty invoiceRefNo as per working format
  fbrInvoice.invoiceRefNo = order.invoiceRefNo || "";
  
  // Add invoice reference number if this is a Debit Note
  if (order.invoiceType === "Debit Note" && order.invoiceRefNo) {
    fbrInvoice.invoiceRefNo = order.invoiceRefNo;
  }
  
  return fbrInvoice;
}

/**
 * Validate order data before mapping to FBR format
 * @param order Order to validate
 * @returns Validation result
 */
export function validateOrderForFbr(order: Order): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!order.scenarioId) {
    errors.push('Order must have a scenarioId');
  }
  
  if (!order.items || order.items.length === 0) {
    errors.push('Order must have at least one item');
  }
  
  if (!order.email) {
    errors.push('Order must have buyer email');
  }
  
  // Validate items
  order.items?.forEach((item, index) => {
    if (!item.productName) {
      errors.push(`Item ${index + 1}: Product name is required`);
    }
    
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    
    if (!item.price || item.price <= 0) {
      errors.push(`Item ${index + 1}: Price must be greater than 0`);
    }
    
    // Validate HS code format (allow dots as per FBR examples)
    if (item.hsCode && !/^\d{4}\.\d{4}$|^\d{8,10}$/.test(item.hsCode)) {
      errors.push(`Item ${index + 1}: HS code must be 8-10 digits or DDDD.DDDD format`);
    }
  });
  
  // Scenario-specific validations
  const scenarioId = order.scenarioId as ScenarioId;
  
  if (order.invoiceType === "Debit Note" && !order.invoiceRefNo) {
    errors.push('Debit Note must have an invoice reference number');
  }
  
  if (order.buyerRegistrationType === "Registered" && !order.buyerNTNCNIC) {
    errors.push('Registered buyer must have NTN/CNIC');
  }
  
  // Check for withholding tax requirements
  if (requiresWithholdingTax(scenarioId)) {
    const hasWithholdingTax = order.items.some(item => 
      item.extraTax && item.extraTax > 0
    );
    if (!hasWithholdingTax) {
      console.warn(`⚠️  Scenario ${scenarioId} typically requires withholding tax at item level`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create a test FBR invoice for the specified scenario
 * Useful for testing and development
 * 
 * @param scenarioId The scenario to test
 * @param sellerInfo Optional seller information
 * @returns Test FBR invoice
 */
export async function createTestFbrInvoice(
  scenarioId: ScenarioId,
  sellerInfo?: SellerInfo
): Promise<FbrInvoice> {
  const testOrder: Order = {
    email: 'test@example.com',
    scenarioId,
    invoiceType: 'Sale Invoice',
    subtotal: 1000,
    totalAmount: 1180, // Including 18% tax
    buyerRegistrationType: 'Unregistered',
    items: [
      {
        productId: 'test-product-1',
        productName: 'Test Product',
        productDescription: 'Test product for FBR integration',
        hsCode: '1234567890',
        uom: 'PCS',
        quantity: 1,
        price: 1000,
        totalPrice: 1000,
        taxPercentage: 18,
      },
    ],
  };
  
  return await mapOrderToFbrInvoice(testOrder, sellerInfo);
}

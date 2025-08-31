'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CurrencySymbol from '../../components/CurrencySymbol';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Plus, UserPlus, PackagePlus } from "lucide-react";
import { 
  formatWeightAuto, 
  isWeightBasedProduct, 
  convertToGrams,
  parseWeightInput,
  calculateWeightBasedPrice,
  getWeightUnits
} from '@/utils/weightUtils';
import { useCurrency } from '@/app/contexts/CurrencyContext';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  productType: string;
  isActive: boolean;
  supplierId?: string;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  hsCode?: string; // Harmonized System Code
  // Weight-based fields
  stockManagementType?: string;
  pricePerUnit?: number;
  baseWeightUnit?: string;
  // Tax and discount fields
  taxAmount?: number;
  taxPercentage?: number;
  priceIncludingTax?: number;
  priceExcludingTax?: number;
  extraTax?: number;
  furtherTax?: number;
  fedPayableTax?: number;
  discount?: number;
}

interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  price: number;
  isActive: boolean;
  inventoryQuantity: number;
}

interface Addon {
  id: string;
  title: string;
  price: number;
  description?: string;
  image?: string;
  isActive: boolean;
}

interface ProductAddon {
  id: string;
  productId: string;
  addonId: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  addon: Addon;
}

interface SelectedAddon {
  addonId: string;
  addonTitle: string;
  price: number;
  quantity: number;
}

interface OrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  productDescription?: string; // Product description
  variantTitle?: string;
  sku?: string;
  hsCode?: string; // Harmonized System Code
  price: number;
  quantity: number;
  totalPrice: number;
  addons?: SelectedAddon[];
  // Weight-based fields
  weightQuantity?: number; // Weight in grams
  weightUnit?: string; // Display unit (grams, kg)
  isWeightBased?: boolean;
  // UOM for non-weight based products
  uom?: string;
  // Additional fields
  itemSerialNumber?: string; // Item serial number
  sroScheduleNumber?: string; // SRO / Schedule Number
  // Tax and discount fields
  taxAmount?: number;
  taxPercentage?: number;
  priceIncludingTax?: number;
  priceExcludingTax?: number;
  extraTax?: number;
  furtherTax?: number;
  fedPayableTax?: number;
  discount?: number;
  // Additional tax fields
  fixedNotifiedValueOrRetailPrice?: number;
  saleType?: string;
}

interface Customer {
  id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // Buyer fields
  buyerNTNCNIC?: string;
  buyerBusinessName?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
}

export default function AddOrder() {
  const router = useRouter();
  const { currentCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);
  
  // Sticky sidebar state
  const [isSticky, setIsSticky] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  
  // Loyalty points state
  const [loyaltySettings, setLoyaltySettings] = useState({
    enabled: false,
    earningRate: 1,
    earningBasis: 'subtotal',
    redemptionValue: 0.01,
    maxRedemptionPercent: 50,
    redemptionMinimum: 100,
    minimumOrder: 0
  });
  const [customerPoints, setCustomerPoints] = useState({
    availablePoints: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0
  });
  
  // Order form data
  // FBR scenario management
  const [isCustomScenario, setIsCustomScenario] = useState(false);
  
  // Seller information (auto-filled from env but editable)
  const [sellerInfo, setSellerInfo] = useState({
    sellerNTNCNIC: '',
    sellerBusinessName: '',
    sellerProvince: '',
    sellerAddress: '',
    fbrSandboxToken: '',
    fbrBaseUrl: ''
  });

  // Email and FBR submission control checkboxes
  const [skipCustomerEmail, setSkipCustomerEmail] = useState(false);
  const [skipSellerEmail, setSkipSellerEmail] = useState(false);
  const [skipFbrSubmission, setSkipFbrSubmission] = useState(false);
  
  const [orderData, setOrderData] = useState({
    customerId: '',
    email: '',
    phone: '',
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
    shippingAmount: 0,
    taxRate: 0, // 10%
    discountAmount: 0,
    discountType: 'amount', // 'amount' or 'percentage'
    currency: currentCurrency,
    // Driver assignment fields
    assignedDriverId: '',
    deliveryStatus: 'pending',
    assignmentType: 'manual',
    // Loyalty points fields
    pointsToRedeem: 0,
    pointsDiscountAmount: 0,
    useAllPoints: false,
    // Supplier field
    supplierId: '' as string,
    // Invoice and validation fields
    invoiceType: '',
    invoiceRefNo: '',
    scenarioId: '',
    invoiceNumber: '',
    invoiceDate: new Date() as Date | undefined,
    validationResponse: '',
    // Buyer fields (from selected user)
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: ''
  });

  // Customer/shipping information
  const [customerInfo, setCustomerInfo] = useState({
    isGuest: true,
    billingFirstName: '',
    billingLastName: '',
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'US',
    shippingFirstName: '',
    shippingLastName: '',
    shippingAddress1: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'US',
    sameAsBilling: true
  });

  // Product selection
  const [productSelection, setProductSelection] = useState({
    selectedProductId: '',
    selectedVariantId: '',
    quantity: 1,
    customPrice: '',
    // Weight-based fields
    weightInput: '',
    weightUnit: 'grams' as 'grams' | 'kg',
    // UOM field for non-weight based products
    uom: '',
    // Additional editable fields
    hsCode: '',
    itemSerialNumber: '',
    sroScheduleNumber: '',
    productName: '',
    productDescription: '',
    // Editable tax and price fields
    taxAmount: 0,
    taxPercentage: 0,
    priceIncludingTax: 0,
    priceExcludingTax: 0,
    extraTax: 0,
    furtherTax: 0,
    fedPayableTax: 0,
    discountAmount: 0,
    // Additional tax fields
    fixedNotifiedValueOrRetailPrice: 0,
    saleType: 'Goods at standard rate'
  });

  // Group product addon selection
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  // Driver selection
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);

  // Dialog states for adding new items
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  
  // Combobox states
  const [customerComboboxOpen, setCustomerComboboxOpen] = useState(false);
  const [productComboboxOpen, setProductComboboxOpen] = useState(false);
  
  // New user/product form data
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: ''
  });
  const [newProductData, setNewProductData] = useState({
    name: '',
    price: '',
    stockQuantity: ''
  });
  
  // Loading states for adding new items
  const [addingUser, setAddingUser] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Clear selected addons when product changes and populate editable fields
  useEffect(() => {
    setSelectedAddons([]);
    
    // Populate editable fields when product is selected
    if (productSelection.selectedProductId) {
      const product = products.find(p => p.id === productSelection.selectedProductId);
      if (product) {
        setProductSelection(prev => ({
          ...prev,
          // Populate additional fields from product
          hsCode: product.hsCode || '',
          productName: product.name || '',
          // Keep existing values for fields that should be manually entered
          itemSerialNumber: prev.itemSerialNumber,
          sroScheduleNumber: prev.sroScheduleNumber,
          // Populate tax and price fields
          taxAmount: product.taxAmount || 0,
          taxPercentage: product.taxPercentage || 0,
          priceIncludingTax: product.priceIncludingTax || 0,
          priceExcludingTax: product.priceExcludingTax || 0,
          extraTax: product.extraTax || 0,
          furtherTax: product.furtherTax || 0,
          fedPayableTax: product.fedPayableTax || 0,
          discountAmount: product.discount || 0,
          // Additional tax fields (reset to defaults)
          fixedNotifiedValueOrRetailPrice: 0,
          saleType: 'Goods at standard rate'
        }));
      }
    } else {
      // Reset editable fields when no product is selected
      setProductSelection(prev => ({
        ...prev,
        uom: '',
        hsCode: '',
        itemSerialNumber: '',
        sroScheduleNumber: '',
        productName: '',
        productDescription: '',
        taxAmount: 0,
        taxPercentage: 0,
        priceIncludingTax: 0,
        priceExcludingTax: 0,
        extraTax: 0,
        furtherTax: 0,
        fedPayableTax: 0,
        discountAmount: 0,
        // Additional tax fields (reset to defaults)
        fixedNotifiedValueOrRetailPrice: 0,
        saleType: 'Goods at standard rate'
      }));
    }
  }, [productSelection.selectedProductId, products]);

  // Scroll detection for sticky sidebar
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarContainerRef.current && sidebarRef.current) {
        const containerRect = sidebarContainerRef.current.getBoundingClientRect();
        const shouldStick = containerRect.top <= 24; // 24px offset for top spacing
        setIsSticky(shouldStick);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsRes, customersRes, stockSettingRes, driversRes, loyaltyRes, sellerInfoRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/users'),
        fetch('/api/settings/stock-management'),
        fetch('/api/drivers/available?includeAll=true'),
        fetch('/api/settings/loyalty'),
        fetch('/api/seller-info')
      ]);

      const productsData = await productsRes.json();
      const customersData = await customersRes.json();
      const stockData = await stockSettingRes.json();
      const driversData = await driversRes.json();
      const loyaltyData = await loyaltyRes.json();
      const sellerInfoData = await sellerInfoRes.json();

      // Process products to include variants
      const processedProducts = await Promise.all(
        productsData.map(async (productItem: any) => {
          const product = productItem.product;
          
          // Convert price to number
          product.price = Number(product.price) || 0;
          
          if (product.productType === 'variable') {
            const variantsRes = await fetch(`/api/product-variants?productId=${product.id}`);
            const variantsData = await variantsRes.json();
            product.variants = variantsData.map((v: any) => ({
              ...v.variant,
              price: Number(v.variant.price) || 0 // Convert variant price to number
            }));
          } else if (product.productType === 'group') {
            const addonsRes = await fetch(`/api/product-addons?productId=${product.id}`);
            const addonsData = await addonsRes.json();
            product.addons = addonsData.map((a: any) => ({
              ...a.productAddon,
              price: Number(a.productAddon.price) || 0, // Convert addon price to number
              addon: {
                ...a.addon,
                price: Number(a.addon.price) || 0
              }
            }));
          }
          
          return product;
        })
      );

      setProducts(processedProducts);
      setCustomers(customersData);
      setStockManagementEnabled(stockData.stockManagementEnabled ?? true);
      setAvailableDrivers(driversData.drivers || []);
      
      // Set loyalty settings
      console.log('Loyalty API response:', loyaltyData);
      if (loyaltyData.success) {
        const newSettings = {
          enabled: loyaltyData.settings.loyalty_enabled?.value === 'true' || loyaltyData.settings.loyalty_enabled?.value === true,
          earningRate: Number(loyaltyData.settings.points_earning_rate?.value) || 1,
          earningBasis: loyaltyData.settings.points_earning_basis?.value || 'subtotal',
          redemptionValue: Number(loyaltyData.settings.points_redemption_value?.value) || 0.01,
          maxRedemptionPercent: Number(loyaltyData.settings.points_max_redemption_percent?.value) || 50,
          redemptionMinimum: Number(loyaltyData.settings.points_redemption_minimum?.value) || 100,
          minimumOrder: Number(loyaltyData.settings.points_minimum_order?.value) || 0
        };
        console.log('Setting loyalty settings:', newSettings);
        setLoyaltySettings(newSettings);
      } else {
        console.log('Loyalty settings fetch failed:', loyaltyData);
      }
      
      // Set seller information from environment variables
      if (sellerInfoData && !sellerInfoData.error) {
        console.log('Setting seller info:', sellerInfoData);
        setSellerInfo(sellerInfoData);
      } else {
        console.log('Seller info fetch failed or empty:', sellerInfoData);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Addon management functions
  const addSelectedAddon = (addonId: string, addonTitle: string, price: number) => {
    const isAlreadySelected = selectedAddons.some(addon => addon.addonId === addonId);
    if (isAlreadySelected) return;

    setSelectedAddons([...selectedAddons, {
      addonId,
      addonTitle,
      price,
      quantity: 1
    }]);
  };

  const updateAddonQuantity = (addonId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedAddons(selectedAddons.filter(addon => addon.addonId !== addonId));
      return;
    }

    setSelectedAddons(selectedAddons.map(addon => 
      addon.addonId === addonId 
        ? { ...addon, quantity }
        : addon
    ));
  };

  const removeSelectedAddon = (addonId: string) => {
    setSelectedAddons(selectedAddons.filter(addon => addon.addonId !== addonId));
  };

  const clearSelectedAddons = () => {
    setSelectedAddons([]);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setOrderData({ ...orderData, customerId });
    
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
              if (customer) {
          setOrderData(prev => ({ 
            ...prev, 
            email: customer.email, 
            phone: customer.phone || '',
            // Populate buyer fields from selected customer's buyer information
            buyerNTNCNIC: customer.buyerNTNCNIC || '',
            buyerBusinessName: customer.buyerBusinessName || '',
            buyerProvince: customer.buyerProvince || '',
            buyerAddress: customer.buyerAddress || '',
            buyerRegistrationType: customer.buyerRegistrationType || ''
          }));
        setCustomerInfo(prev => ({
          ...prev,
          isGuest: false,
          billingFirstName: customer.firstName || '',
          billingLastName: customer.lastName || '',
          billingAddress1: customer.address || '',
          billingCity: customer.city || '',
          billingState: customer.state || '',
          billingPostalCode: customer.postalCode || '',
          billingCountry: customer.country || 'US'
        }));
        
        // Fetch customer loyalty points if loyalty is enabled
        if (loyaltySettings.enabled) {
          fetchCustomerPoints(customerId);
        }
      }
    } else {
      setCustomerInfo(prev => ({ ...prev, isGuest: true }));
      setOrderData(prev => ({ ...prev, email: '', phone: '', pointsToRedeem: 0, pointsDiscountAmount: 0, useAllPoints: false }));
      setCustomerPoints({ availablePoints: 0, totalPointsEarned: 0, totalPointsRedeemed: 0 });
    }
  };

  // Fetch customer loyalty points (simplified)
  const fetchCustomerPoints = async (customerId: string) => {
    try {
      const response = await fetch(`/api/loyalty/points-simple?userId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomerPoints({
            availablePoints: data.points.availablePoints || 0,
            totalPointsEarned: data.points.totalPointsEarned || 0,
            totalPointsRedeemed: data.points.totalPointsRedeemed || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching customer points:', err);
    }
  };

  // Helper function to get price per gram based on product's base weight unit
  const getPricePerGram = (product: Product): number => {
    const pricePerUnit = Number(product.pricePerUnit) || 0;
    if (product.baseWeightUnit === 'kg') {
      // If stored per kg, convert to per gram
      return pricePerUnit / 1000;
    }
    // If stored per gram or undefined, use as is
    return pricePerUnit;
  };

  // Driver assignment functions
  const handleDriverAssignmentTypeChange = (type: 'manual' | 'automatic') => {
    setOrderData(prev => ({
      ...prev,
      assignmentType: type,
      assignedDriverId: type === 'automatic' ? '' : prev.assignedDriverId
    }));
  };

  const handleAssignDriver = async (orderId: string) => {
    if (!orderId) return;

    try {
      const response = await fetch('/api/drivers/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          driverId: orderData.assignmentType === 'manual' ? orderData.assignedDriverId : null,
          assignedBy: 'admin', // This should be the current admin user ID
          assignmentType: orderData.assignmentType,
          priority: 'normal'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Driver assigned successfully:', data);
        return data;
      } else {
        console.warn('Failed to assign driver:', data.error || 'Unknown error');
        // Don't throw error - just log warning and continue
        return null;
      }
    } catch (error) {
      console.warn('Error in driver assignment request:', error);
      // Don't throw error - just log and continue
      return null;
    }
  };

  const handleAddProduct = () => {
    const { selectedProductId, selectedVariantId, quantity, customPrice, weightInput, weightUnit } = productSelection;
    
    if (!selectedProductId) {
      alert('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const isWeightBased = isWeightBasedProduct(product.stockManagementType || 'quantity');

    // Validate quantity or weight based on product type
    if (isWeightBased) {
      if (!weightInput || parseFloat(weightInput) <= 0) {
        alert('Please enter a valid weight');
        return;
      }
    } else {
      if (quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
      }
    }

    // For group products, validate that addons are selected if base price is 0
    if (product.productType === 'group') {
      const basePrice = Number(product.price) || 0;
      if (basePrice === 0 && selectedAddons.length === 0) {
        alert('Please select at least one addon for this group product');
        return;
      }
    }

    let variant = null;
    let price = Number(product.price) || 0;
    let productName = product.name;
    let variantTitle = '';
    let sku = product.sku || '';
    let weightInGrams = 0;
    let finalQuantity = quantity;

    if (selectedVariantId && product.variants) {
      variant = product.variants.find(v => v.id === selectedVariantId);
      if (variant) {
        price = Number(variant.price) || 0;
        variantTitle = variant.title;
        sku = variant.sku || sku;
      }
    }

    // Handle weight-based pricing
    if (isWeightBased) {
      weightInGrams = convertToGrams(parseFloat(weightInput), weightUnit);
      const pricePerGram = getPricePerGram(product);
      price = calculateWeightBasedPrice(weightInGrams, pricePerGram);
      finalQuantity = 1; // For weight-based products, quantity is always 1 (the weight is the measure)
    }

    // Use custom price if provided (overrides weight-based calculation)
    if (customPrice) {
      price = parseFloat(customPrice);
    }

    // Stock validation when stock management is enabled
    if (stockManagementEnabled) {
      // Check if we have inventory information for this product/variant
      const inventoryKey = selectedVariantId ? `${selectedProductId}-${selectedVariantId}` : selectedProductId;
      
      // For now, we'll add a warning but allow the order to proceed
      // The actual validation will happen on the server side
      if (variant && variant.inventoryQuantity !== undefined) {
        if (variant.inventoryQuantity < quantity) {
          if (!confirm(`Warning: Requested quantity (${quantity}) exceeds available stock (${variant.inventoryQuantity}). Do you want to continue? This may fail when creating the order.`)) {
            return;
          }
        }
      }
    }

    // Calculate total price including addons for group products
    // Use priceIncludingTax if available, otherwise fall back to base price
    const effectivePrice = productSelection.priceIncludingTax || price;
    let totalPrice = effectivePrice * finalQuantity;
    if (product.productType === 'group' && selectedAddons.length > 0) {
      const addonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
      totalPrice = (effectivePrice + addonsPrice) * finalQuantity;
    }

    const newItem: OrderItem = {
      productId: selectedProductId,
      variantId: selectedVariantId || undefined,
      productName: productSelection.productName || productName,
      productDescription: productSelection.productDescription || undefined,
      variantTitle: variantTitle || undefined,
      sku,
      hsCode: productSelection.hsCode || product.hsCode,
      price,
      quantity: finalQuantity,
      totalPrice,
      addons: product.productType === 'group' && selectedAddons.length > 0 ? [...selectedAddons] : undefined,
      // Weight-based fields
      isWeightBased,
      weightQuantity: isWeightBased ? weightInGrams : undefined,
      weightUnit: isWeightBased ? weightUnit : undefined,
      // UOM for non-weight based products
      uom: !isWeightBased ? productSelection.uom : undefined,
      // Additional editable fields
      itemSerialNumber: productSelection.itemSerialNumber || undefined,
      sroScheduleNumber: productSelection.sroScheduleNumber || undefined,
      // Tax and discount fields from editable selection
      taxAmount: productSelection.taxAmount || 0,
      taxPercentage: productSelection.taxPercentage || 0,
      priceIncludingTax: productSelection.priceIncludingTax || 0,
      priceExcludingTax: productSelection.priceExcludingTax || 0,
      extraTax: productSelection.extraTax || 0,
      furtherTax: productSelection.furtherTax || 0,
      fedPayableTax: productSelection.fedPayableTax || 0,
      discount: productSelection.discountAmount || 0,
      // Additional tax fields
      fixedNotifiedValueOrRetailPrice: productSelection.fixedNotifiedValueOrRetailPrice || 0,
      saleType: productSelection.saleType || 'Goods at standard rate'
    };

    setOrderItems([...orderItems, newItem]);
    
    // Set supplier_id from the product if not already set
    if (product.supplierId && !orderData.supplierId) {
      setOrderData(prev => ({...prev, supplierId: product.supplierId || ''}));
    }
    
    // Reset selection
    setProductSelection({
      selectedProductId: '',
      selectedVariantId: '',
      quantity: 1,
      customPrice: '',
      weightInput: '',
      weightUnit: 'grams',
      uom: '',
      hsCode: '',
      itemSerialNumber: '',
      sroScheduleNumber: '',
      productName: '',
      productDescription: '',
      taxAmount: 0,
      taxPercentage: 0,
      priceIncludingTax: 0,
      priceExcludingTax: 0,
      extraTax: 0,
      furtherTax: 0,
      fedPayableTax: 0,
      discountAmount: 0,
      // Additional tax fields (reset to defaults)
      fixedNotifiedValueOrRetailPrice: 0,
      saleType: 'Goods at standard rate'
    });
    clearSelectedAddons();
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    const updatedItems = [...orderItems];
    const item = updatedItems[index];
    updatedItems[index].quantity = quantity;
    
    // Use priceIncludingTax if available, otherwise fall back to base price
    const effectivePrice = item.priceIncludingTax || item.price;
    let totalPrice = effectivePrice * quantity;
    
    // Add addon prices for group products
    if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
      const addonsPrice = item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
      totalPrice = (effectivePrice + addonsPrice) * quantity;
    }
    
    updatedItems[index].totalPrice = totalPrice;
    setOrderItems(updatedItems);
  };

  const getAddonTitle = (addon: any, index: number) => {
    return addon.addonTitle || addon.title || addon.name || `Addon ${index + 1}`;
  };

  // Points redemption functions
  const handlePointsRedemption = (pointsToRedeem: number) => {
    if (pointsToRedeem < 0) pointsToRedeem = 0;
    if (pointsToRedeem > customerPoints.availablePoints) {
      pointsToRedeem = customerPoints.availablePoints;
    }

    // Calculate discount amount based on points
    const discountAmount = pointsToRedeem * loyaltySettings.redemptionValue;
    
    // Get current totals to check max redemption limit
    const currentTotals = calculateTotals();
    const maxAllowedDiscount = (currentTotals.subtotal - currentTotals.discountAmount) * (loyaltySettings.maxRedemptionPercent / 100);
    
    const finalDiscountAmount = Math.min(discountAmount, maxAllowedDiscount);
    const finalPointsToRedeem = Math.floor(finalDiscountAmount / loyaltySettings.redemptionValue);

    setOrderData(prev => ({
      ...prev,
      pointsToRedeem: finalPointsToRedeem,
      pointsDiscountAmount: finalDiscountAmount,
      useAllPoints: false
    }));
  };

  const handleUseAllPoints = () => {
    if (orderData.useAllPoints) {
      // Turn off - clear points
      setOrderData(prev => ({
        ...prev,
        pointsToRedeem: 0,
        pointsDiscountAmount: 0,
        useAllPoints: false
      }));
    } else {
      // Turn on - use maximum allowed points
      const currentTotals = calculateTotals();
      const maxAllowedDiscount = (currentTotals.subtotal - currentTotals.discountAmount) * (loyaltySettings.maxRedemptionPercent / 100);
      const maxPointsDiscount = customerPoints.availablePoints * loyaltySettings.redemptionValue;
      
      const finalDiscountAmount = Math.min(maxAllowedDiscount, maxPointsDiscount);
      const finalPointsToRedeem = Math.floor(finalDiscountAmount / loyaltySettings.redemptionValue);

      setOrderData(prev => ({
        ...prev,
        pointsToRedeem: finalPointsToRedeem,
        pointsDiscountAmount: finalDiscountAmount,
        useAllPoints: true
      }));
    }
  };

  const calculatePointsToEarn = () => {
    console.log('calculatePointsToEarn called:', {
      loyaltyEnabled: loyaltySettings.enabled,
      customerId: orderData.customerId,
      loyaltySettings,
      orderData: { customerId: orderData.customerId, status: orderData.status }
    });

    if (!loyaltySettings.enabled) {
      console.log('Points calculation skipped - loyalty disabled');
      return 0;
    }
    
    const totals = calculateTotals();
    const baseAmount = loyaltySettings.earningBasis === 'total' ? totals.totalAmount : totals.subtotal;
    
    console.log('Points calculation:', {
      totals,
      baseAmount,
      earningBasis: loyaltySettings.earningBasis,
      earningRate: loyaltySettings.earningRate,
      minimumOrder: loyaltySettings.minimumOrder
    });
    
    if (baseAmount < loyaltySettings.minimumOrder) {
      console.log('Points calculation skipped - below minimum order amount');
      return 0;
    }
    
    const points = Math.floor(baseAmount * loyaltySettings.earningRate);
    console.log('Points to earn:', points);
    return points;
  };

  const calculateTotals = () => {
    // Calculate total using 'Price including tax' for each product
    const totalAmount = orderItems.reduce((sum, item) => {
      // Use priceIncludingTax if available, otherwise fall back to regular price
      const itemPrice = item.priceIncludingTax || item.price;
      let itemTotal = itemPrice * item.quantity;
      
      // Add addon prices for group products
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        const addonsTotal = item.addons.reduce((addonSum, addon) => 
          addonSum + (addon.price * addon.quantity), 0
        );
        itemTotal += addonsTotal * item.quantity;
      }
      
      return sum + itemTotal;
    }, 0);
    
    // Apply order-level discounts
    const discountAmount = orderData.discountType === 'percentage' 
      ? totalAmount * (orderData.discountAmount / 100)
      : orderData.discountAmount;
    
    // Apply points discount
    const pointsDiscountAmount = orderData.pointsDiscountAmount || 0;
    
    // Final total after all discounts
    const finalTotal = Math.max(0, totalAmount - discountAmount - pointsDiscountAmount);

    return {
      totalAmount: finalTotal,
      discountAmount,
      pointsDiscountAmount,
      // Keep these for backward compatibility but they're not used in new summary
      subtotal: totalAmount,
      taxAmount: 0,
      afterPointsDiscount: finalTotal
    };
  };

  // Add new user function
  const handleAddNewUser = async () => {
    if (!newUserData.name || !newUserData.email) {
      alert('Please fill in both name and email');
      return;
    }

    setAddingUser(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserData.name,
          email: newUserData.email,
          firstName: newUserData.name.split(' ')[0] || '',
          lastName: newUserData.name.split(' ').slice(1).join(' ') || '',
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      
      // Add to customers list and select it
      setCustomers(prev => [...prev, newUser]);
      setOrderData(prev => ({ 
        ...prev, 
        customerId: newUser.id,
        email: newUser.email,
        phone: newUser.phone || ''
      }));
      
      // Reset form and close dialog
      setNewUserData({ name: '', email: '' });
      setShowAddUserDialog(false);
      setCustomerComboboxOpen(false);
    } catch (error: any) {
      alert('Error creating user: ' + error.message);
    } finally {
      setAddingUser(false);
    }
  };

  // Add new product function
  const handleAddNewProduct = async () => {
    if (!newProductData.name || !newProductData.price) {
      alert('Please fill in both name and price');
      return;
    }

    const price = parseFloat(newProductData.price);
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price');
      return;
    }

    const stockQuantity = parseFloat(newProductData.stockQuantity) || 0;
    if (stockQuantity < 0) {
      alert('Please enter a valid stock quantity (0 or greater)');
      return;
    }

    setAddingProduct(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductData.name,
          price: price,
          productType: 'simple',
          isActive: true,
          stockManagementType: 'quantity',
          initialStock: stockQuantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const responseData = await response.json();
      const newProduct = responseData.product || responseData;
      
      // Add to products list and select it
      setProducts(prev => [...prev, newProduct]);
      setProductSelection(prev => ({ 
        ...prev, 
        selectedProductId: newProduct.id,
        productName: newProduct.name
      }));
      
      // Reset form and close dialog
      setNewProductData({ name: '', price: '', stockQuantity: '' });
      setShowAddProductDialog(false);
      setProductComboboxOpen(false);
    } catch (error: any) {
      alert('Error creating product: ' + error.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (orderItems.length === 0) {
      setError('Please add at least one product to the order');
      setSubmitting(false);
      return;
    }

    if (!orderData.email) {
      setError('Please provide customer email');
      setSubmitting(false);
      return;
    }

    try {
      const totals = calculateTotals();
      
      const submitData = {
        userId: orderData.customerId || null,
        email: orderData.email,
        phone: orderData.phone,
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        shippingAmount: orderData.shippingAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        currency: orderData.currency,
        notes: orderData.notes,
        
        // Supplier field
        supplierId: orderData.supplierId || null,
        
        // Invoice and validation fields
        invoiceType: orderData.invoiceType || null,
        invoiceRefNo: orderData.invoiceRefNo || null,
        scenarioId: orderData.scenarioId || null,
        invoiceNumber: orderData.invoiceNumber || null,
        invoiceDate: orderData.invoiceDate || null,
        validationResponse: orderData.validationResponse || null,
        
        // Driver assignment fields
        assignedDriverId: orderData.assignedDriverId || null,
        deliveryStatus: orderData.deliveryStatus,
        
        // Loyalty points fields
        pointsToRedeem: orderData.pointsToRedeem,
        pointsDiscountAmount: orderData.pointsDiscountAmount,
        
        // Billing address
        billingFirstName: customerInfo.billingFirstName,
        billingLastName: customerInfo.billingLastName,
        billingAddress1: customerInfo.billingAddress1,
        billingAddress2: customerInfo.billingAddress2,
        billingCity: customerInfo.billingCity,
        billingState: customerInfo.billingState,
        billingPostalCode: customerInfo.billingPostalCode,
        billingCountry: customerInfo.billingCountry,
        
        // Shipping address
        shippingFirstName: customerInfo.sameAsBilling ? customerInfo.billingFirstName : customerInfo.shippingFirstName,
        shippingLastName: customerInfo.sameAsBilling ? customerInfo.billingLastName : customerInfo.shippingLastName,
        shippingAddress1: customerInfo.sameAsBilling ? customerInfo.billingAddress1 : customerInfo.shippingAddress1,
        shippingAddress2: customerInfo.sameAsBilling ? customerInfo.billingAddress2 : customerInfo.shippingAddress2,
        shippingCity: customerInfo.sameAsBilling ? customerInfo.billingCity : customerInfo.shippingCity,
        shippingState: customerInfo.sameAsBilling ? customerInfo.billingState : customerInfo.shippingState,
        shippingPostalCode: customerInfo.sameAsBilling ? customerInfo.billingPostalCode : customerInfo.shippingPostalCode,
        shippingCountry: customerInfo.sameAsBilling ? customerInfo.billingCountry : customerInfo.shippingCountry,
        
        // Order items
        items: orderItems,
        
        // Buyer fields (from selected customer)
        buyerNTNCNIC: orderData.buyerNTNCNIC || null,
        buyerBusinessName: orderData.buyerBusinessName || null,
        buyerProvince: orderData.buyerProvince || null,
        buyerAddress: orderData.buyerAddress || null,
        buyerRegistrationType: orderData.buyerRegistrationType || null,
        
        // Seller fields (for FBR Digital Invoicing)
        sellerNTNCNIC: sellerInfo.sellerNTNCNIC || null,
        sellerBusinessName: sellerInfo.sellerBusinessName || null,
        sellerProvince: sellerInfo.sellerProvince || null,
        sellerAddress: sellerInfo.sellerAddress || null,
        fbrSandboxToken: sellerInfo.fbrSandboxToken || null,
        fbrBaseUrl: sellerInfo.fbrBaseUrl || null,
        
        // Email and FBR submission control flags
        skipCustomerEmail,
        skipSellerEmail,
        skipFbrSubmission
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Handle FBR-specific errors with more detail
        if (data.step === 'fbr_validation' || data.step === 'fbr_connection') {
          let errorMessage = data.error || 'FBR Digital Invoice submission failed';
          
          // Show detailed FBR validation errors
          if (data.fbrError?.response?.validationResponse?.invoiceStatuses) {
            const itemErrors = data.fbrError.response.validationResponse.invoiceStatuses
              .filter((status: any) => status.error)
              .map((status: any) => `• Item ${status.itemSNo}: ${status.error}`)
              .join('\n');
            
            if (itemErrors) {
              errorMessage += '\n\nValidation Details:\n' + itemErrors;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        throw new Error(data.error || 'Failed to create order');
      }

      const orderResponse = await response.json();
      const orderId = orderResponse.orderId;

      // Create driver assignment record if driver is assigned
      if (orderData.assignedDriverId && orderData.assignmentType === 'manual') {
        try {
          await handleAssignDriver(orderId);
        } catch (driverError) {
          console.warn('Order created but driver assignment failed:', driverError);
          // Don't fail the order creation if driver assignment fails
          // The order is still created successfully, just without driver assignment
        }
      }

      // Redeem loyalty points if any were used
      if (orderData.pointsToRedeem > 0 && orderData.customerId) {
        try {
          const pointsResponse = await fetch('/api/loyalty/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'redeem_points',
              userId: orderData.customerId,
              orderId: orderId,
              pointsToRedeem: orderData.pointsToRedeem,
              discountAmount: orderData.pointsDiscountAmount,
              description: `Redeemed at checkout for order #${orderResponse.orderNumber || orderId}`
            })
          });
          
          if (!pointsResponse.ok) {
            console.warn('Order created but points redemption failed:', await pointsResponse.text());
          }
        } catch (pointsError) {
          console.warn('Order created but points redemption failed:', pointsError);
          // Don't fail the order creation if points redemption fails
        }
      }

      // Show success message and redirect to invoice page
      if (orderResponse.fbrInvoiceNumber) {
        console.log('✅ Order created with FBR Digital Invoice:', {
          orderNumber: orderResponse.orderNumber,
          fbrInvoiceNumber: orderResponse.fbrInvoiceNumber,
          orderId: orderResponse.orderId || orderId
        });
        
        // Show success message and redirect to invoice page
        //alert(`Order created successfully!\n\nOrder Number: ${orderResponse.orderNumber}\nFBR Invoice Number: ${orderResponse.fbrInvoiceNumber}\n\nRedirecting to invoice page...`);
        router.push(`/orders/${orderResponse.orderId || orderId}/invoice`);
      } else {
        console.log('✅ Order created successfully (no FBR submission):', {
          orderNumber: orderResponse.orderNumber,
          orderId: orderResponse.orderId || orderId
        });
        
        // Redirect to invoice page even without FBR
       //alert(`Order created successfully!\n\nOrder Number: ${orderResponse.orderNumber}\n\nRedirecting to invoice page...`);
        router.push(`/orders/${orderResponse.orderId || orderId}/invoice`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === productSelection.selectedProductId);
  const totals = calculateTotals();

  if (loading) return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🛒 Create New Order</h1>
          <p className="text-muted-foreground mt-1">Add products and configure order details</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/orders')}
          className="gap-2"
        >
          ← Back to Orders
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
        </div>
          </CardContent>
        </Card>
      )}
{/*
      {!stockManagementEnabled && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-orange-800">Stock Management Disabled</h3>
                <p className="text-sm text-orange-700 mt-1">
                Orders can be created without stock limitations. Products will not show inventory levels or availability warnings.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      )}
*/}
      {stockManagementEnabled ? (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-blue-800">Stock Management Enabled</h3>
                <p className="text-sm text-blue-700 mt-1">
                Orders will check inventory levels where available. Products without inventory records can still be ordered.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium text-orange-800">Stock Management Disabled</h3>
                <p className="text-sm text-orange-700 mt-1">
                Orders will be created without checking or reducing inventory levels. Stock quantities will remain unchanged.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Main Order Form - Left Side */}
        <div className="lg:col-span-2 space-y-6 min-h-0">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Customer Information
              </CardTitle>
              <CardDescription>
                Select an existing customer or add a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-select">Select Customer</Label>
                <Popover open={customerComboboxOpen} onOpenChange={setCustomerComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerComboboxOpen}
                      className="w-full justify-between"
                    >
                      {orderData.customerId
                        ? customers.find((customer) => customer.id === orderData.customerId)?.name || 
                          `${customers.find((customer) => customer.id === orderData.customerId)?.firstName} ${customers.find((customer) => customer.id === orderData.customerId)?.lastName}` ||
                          customers.find((customer) => customer.id === orderData.customerId)?.email
                        : "Select customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              handleCustomerChange({ target: { value: '' } } as any);
                              setCustomerComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${orderData.customerId === '' ? "opacity-100" : "opacity-0"}`}
                            />
                            Guest Customer
                          </CommandItem>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.name || `${customer.firstName} ${customer.lastName}`} ${customer.email}`}
                              onSelect={() => {
                                handleCustomerChange({ target: { value: customer.id } } as any);
                                setCustomerComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${orderData.customerId === customer.id ? "opacity-100" : "opacity-0"}`}
                              />
                      {customer.name || `${customer.firstName} ${customer.lastName}`} ({customer.email})
                            </CommandItem>
                          ))}
                          <CommandItem
                            onSelect={() => {
                              setShowAddUserDialog(true);
                              setCustomerComboboxOpen(false);
                            }}
                            className="text-blue-600 font-medium"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New Customer
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="customer-email"
                  type="email"
                  value={orderData.email}
                  onChange={(e) => setOrderData({...orderData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                  type="tel"
                  value={orderData.phone}
                  onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="order-status">Order Status</Label>
                  <Select value={orderData.status} onValueChange={(value) => setOrderData({...orderData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
            
            {/* Email Options */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <input
                type="checkbox"
                id="skip-customer-email"
                checked={skipCustomerEmail}
                onChange={(e) => setSkipCustomerEmail(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="skip-customer-email" className="text-sm">
                Do not send email to customer
              </Label>
            </div>
            </CardContent>
          </Card>

          {/* Seller Information - Auto-filled from environment variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏪 Seller Information
              </CardTitle>
              <CardDescription>
                Your business information for FBR Digital Invoicing. These fields are auto-filled from environment variables but can be modified if needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seller-ntn">Seller NTN/CNIC</Label>
                  <Input
                    id="seller-ntn"
                    type="text"
                    value={sellerInfo.sellerNTNCNIC}
                    onChange={(e) => setSellerInfo({...sellerInfo, sellerNTNCNIC: e.target.value})}
                    placeholder="Enter your NTN or CNIC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-business">Business Name</Label>
                  <Input
                    id="seller-business"
                    type="text"
                    value={sellerInfo.sellerBusinessName}
                    onChange={(e) => setSellerInfo({...sellerInfo, sellerBusinessName: e.target.value})}
                    placeholder="Enter your business name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seller-province">Province</Label>
                  <Select value={sellerInfo.sellerProvince} onValueChange={(value) => setSellerInfo({...sellerInfo, sellerProvince: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Punjab">Punjab</SelectItem>
                      <SelectItem value="Sindh">Sindh</SelectItem>
                      <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                      <SelectItem value="Balochistan">Balochistan</SelectItem>
                      <SelectItem value="Islamabad Capital Territory">Islamabad Capital Territory</SelectItem>
                      <SelectItem value="Azad Jammu and Kashmir">Azad Jammu and Kashmir</SelectItem>
                      <SelectItem value="Gilgit-Baltistan">Gilgit-Baltistan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-address">Business Address</Label>
                  <Input
                    id="seller-address"
                    type="text"
                    value={sellerInfo.sellerAddress}
                    onChange={(e) => setSellerInfo({...sellerInfo, sellerAddress: e.target.value})}
                    placeholder="Enter your complete business address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fbr-base-url">FBR Base URL</Label>
                  <Input
                    id="fbr-base-url"
                    type="url"
                    value={sellerInfo.fbrBaseUrl}
                    onChange={(e) => setSellerInfo({...sellerInfo, fbrBaseUrl: e.target.value})}
                    placeholder="https://sandbox-api.fbr.gov.pk/di_data/v1/di"
                  />
                  <p className="text-sm text-muted-foreground">
                    FBR API base URL (sandbox or production). Auto-filled from settings.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fbr-token">FBR Sandbox Token</Label>
                  <Input
                    id="fbr-token"
                    type="password"
                    value={sellerInfo.fbrSandboxToken}
                    onChange={(e) => setSellerInfo({...sellerInfo, fbrSandboxToken: e.target.value})}
                    placeholder="Enter your FBR sandbox token"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your FBR sandbox token for API authentication. Auto-filled from settings.
                  </p>
                </div>
              </div>
              
              {(!sellerInfo.sellerNTNCNIC || !sellerInfo.sellerBusinessName || !sellerInfo.fbrSandboxToken || !sellerInfo.fbrBaseUrl) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span>⚠️</span>
                    <span className="font-medium">Missing Seller Information</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please ensure your seller information is complete for FBR Digital Invoicing. 
                    You can set default values in your environment variables (FBR_SELLER_*).
                  </p>
                </div>
              )}
              
              {/* Email Options */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <input
                  type="checkbox"
                  id="skip-seller-email"
                  checked={skipSellerEmail}
                  onChange={(e) => setSkipSellerEmail(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="skip-seller-email" className="text-sm">
                  Do not send email to seller
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information - Show only when customer is selected */}
          {orderData.customerId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏢 Buyer Information
                </CardTitle>
                <CardDescription>
                These fields are populated from the selected customer's buyer profile. You can modify them for this order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-ntn">Buyer NTN/CNIC</Label>
                    <Input
                      id="buyer-ntn"
                    type="text"
                    value={orderData.buyerNTNCNIC}
                    onChange={(e) => setOrderData({...orderData, buyerNTNCNIC: e.target.value})}
                    placeholder="Enter NTN or CNIC"
                  />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyer-business">Buyer Business Name</Label>
                    <Input
                      id="buyer-business"
                    type="text"
                    value={orderData.buyerBusinessName}
                    onChange={(e) => setOrderData({...orderData, buyerBusinessName: e.target.value})}
                    placeholder="Enter business name"
                  />
                </div>
              </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyer-province">Buyer Province</Label>
                                    <Select value={orderData.buyerProvince} onValueChange={(value) => setOrderData({...orderData, buyerProvince: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Punjab">Punjab</SelectItem>
                        <SelectItem value="Sindh">Sindh</SelectItem>
                        <SelectItem value="Khyber Pakhtunkhwa (KPK)">Khyber Pakhtunkhwa (KPK)</SelectItem>
                        <SelectItem value="Balochistan">Balochistan</SelectItem>
                        <SelectItem value="Islamabad Capital Territory (ICT)">Islamabad Capital Territory (ICT)</SelectItem>
                        <SelectItem value="Azad Jammu & Kashmir (AJK)">Azad Jammu & Kashmir (AJK)</SelectItem>
                        <SelectItem value="Gilgit-Baltistan (GB)">Gilgit-Baltistan (GB)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyer-address">Buyer Address</Label>
                    <Input
                      id="buyer-address"
                    type="text"
                    value={orderData.buyerAddress}
                    onChange={(e) => setOrderData({...orderData, buyerAddress: e.target.value})}
                    placeholder="Enter buyer address"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buyer-registration-type">Buyer Registration Type</Label>
                <Select value={orderData.buyerRegistrationType} onValueChange={(value) => setOrderData({...orderData, buyerRegistrationType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Registration Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Registered">Registered</SelectItem>
                    <SelectItem value="Unregistered">Unregistered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </CardContent>
            </Card>
          )}

          {/* Loyalty Points Redemption */}
          {loyaltySettings.enabled && orderData.customerId && customerPoints.availablePoints > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎁 Loyalty Points
                </CardTitle>
                <CardDescription>
                  Redeem customer loyalty points for discount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">Available Points:</span>
                    <Badge variant="secondary" className="text-lg font-bold text-purple-600 bg-purple-100">
                      {customerPoints.availablePoints}
                    </Badge>
                </div>
                <div className="text-xs text-purple-600">
                  Worth up to <CurrencySymbol />{(customerPoints.availablePoints * loyaltySettings.redemptionValue).toFixed(2)} discount
                </div>
              </div>

              <div className="space-y-4">
                {/* Use All Points Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Use All Available Points</label>
                    <p className="text-xs text-gray-500">
                      Apply maximum discount (up to {loyaltySettings.maxRedemptionPercent}% of order)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseAllPoints}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      orderData.useAllPoints ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        orderData.useAllPoints ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Manual Points Input */}
                {!orderData.useAllPoints && (
                  <div className="space-y-2">
                    <Label htmlFor="points-redeem">Points to Redeem</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="points-redeem"
                        type="number"
                        min="0"
                        max={customerPoints.availablePoints}
                        value={orderData.pointsToRedeem}
                        onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                        placeholder={`Min: ${loyaltySettings.redemptionMinimum}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePointsRedemption(customerPoints.availablePoints)}
                      >
                        Max
                      </Button>
                    </div>
                    {orderData.pointsToRedeem > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        Discount: <CurrencySymbol />{orderData.pointsDiscountAmount.toFixed(2)}
                      </div>
                    )}
                    {orderData.pointsToRedeem > 0 && orderData.pointsToRedeem < loyaltySettings.redemptionMinimum && (
                      <div className="mt-2 text-sm text-red-600">
                        Minimum {loyaltySettings.redemptionMinimum} points required for redemption
                      </div>
                    )}
                  </div>
                )}

                {/* Points Summary */}
                {orderData.pointsToRedeem > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Points to redeem:</span>
                        <span className="font-medium">{orderData.pointsToRedeem}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount amount:</span>
                        <span className="font-medium"><CurrencySymbol />{orderData.pointsDiscountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-600 mt-1">
                        <span>Remaining points:</span>
                        <span>{customerPoints.availablePoints - orderData.pointsToRedeem}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
          )}

          {/* Invoice & Validation Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧾 Invoice & Validation
              </CardTitle>
              <CardDescription>
                Enter invoice details and validation information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-type">Invoice Type</Label>
                  <Input
                    id="invoice-type"
                  type="text"
                  value={orderData.invoiceType}
                  onChange={(e) => setOrderData({...orderData, invoiceType: e.target.value})}
                  placeholder="e.g., Sales Invoice, Pro Forma"
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-ref">Invoice Ref No</Label>
                  <Input
                    id="invoice-ref"
                  type="text"
                  value={orderData.invoiceRefNo}
                  onChange={(e) => setOrderData({...orderData, invoiceRefNo: e.target.value})}
                  placeholder="Reference number"
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="scenario-id">Scenario ID</Label>
                  <div className="space-y-2">
                    <Select 
                      value={isCustomScenario ? "custom" : orderData.scenarioId} 
                      onValueChange={(value) => {
                        if (value === "custom") {
                          setIsCustomScenario(true);
                          setOrderData({...orderData, scenarioId: ""});
                        } else {
                          setIsCustomScenario(false);
                          setOrderData({...orderData, scenarioId: value});
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select FBR Scenario" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="SN001">SN001 - Goods at standard rate (default)</SelectItem>
                        <SelectItem value="SN002">SN002 - Goods at standard rate (with WHT)</SelectItem>
                        <SelectItem value="SN003">SN003 - Goods at standard rate (default)</SelectItem>
                        <SelectItem value="SN004">SN004 - Goods at standard rate (default)</SelectItem>
                        <SelectItem value="SN005">SN005 - Goods at Reduced Rate</SelectItem>
                        <SelectItem value="SN006">SN006 - Exempt goods</SelectItem>
                        <SelectItem value="SN007">SN007 - Goods at zero-rate</SelectItem>
                        <SelectItem value="SN008">SN008 - 3rd Schedule Goods</SelectItem>
                        <SelectItem value="SN009">SN009 - Cotton ginners</SelectItem>
                        <SelectItem value="SN010">SN010 - Ship breaking</SelectItem>
                        <SelectItem value="SN011">SN011 - Steel Melters / Re-Rollers</SelectItem>
                        <SelectItem value="SN012">SN012 - Petroleum products</SelectItem>
                        <SelectItem value="SN013">SN013 - Natural Gas / CNG</SelectItem>
                        <SelectItem value="SN014">SN014 - Electric power / Electricity</SelectItem>
                        <SelectItem value="SN015">SN015 - Telecommunication services</SelectItem>
                        <SelectItem value="SN016">SN016 - Processing / Conversion of Goods</SelectItem>
                        <SelectItem value="SN017">SN017 - Goods liable to FED in ST mode</SelectItem>
                        <SelectItem value="SN018">SN018 - Services with FED in ST mode</SelectItem>
                        <SelectItem value="SN019">SN019 - Services rendered or provided</SelectItem>
                        <SelectItem value="SN020">SN020 - Mobile phones (9th Schedule)</SelectItem>
                        <SelectItem value="SN021">SN021 - Drugs at fixed rate (Eighth Schedule)</SelectItem>
                        <SelectItem value="SN022">SN022 - Services (ICT Ordinance)</SelectItem>
                        <SelectItem value="SN023">SN023 - Services liable to FED in ST mode</SelectItem>
                        <SelectItem value="SN024">SN024 - Non-Adjustable Supplies</SelectItem>
                        <SelectItem value="SN025">SN025 - Drugs at fixed ST rate (Eighth Schedule)</SelectItem>
                        <SelectItem value="SN026">SN026 - Goods at standard rate (Tested ✅)</SelectItem>
                        <SelectItem value="SN027">SN027 - Retail Supplies (Invoice Level)</SelectItem>
                        <SelectItem value="SN028">SN028 - Retail Supplies (Item Level)</SelectItem>
                        <SelectItem value="custom">Custom Scenario...</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {isCustomScenario && (
                      <Input
                        id="custom-scenario-id"
                        type="text"
                        value={orderData.scenarioId}
                        onChange={(e) => setOrderData({...orderData, scenarioId: e.target.value})}
                        placeholder="Enter custom scenario ID (e.g., SN029)"
                      />
                    )}
                  </div>
                  
                  {orderData.scenarioId && (
                    <div className="text-sm text-muted-foreground">
                      {orderData.scenarioId === "SN001" && "⚠️ Not valid for unregistered buyers"}
                      {orderData.scenarioId === "SN002" && "Requires withholding tax at item level"}
                      {orderData.scenarioId === "SN005" && "Uses 1% tax rate"}
                      {orderData.scenarioId === "SN006" && "Tax-exempt goods (0% tax)"}
                      {orderData.scenarioId === "SN007" && "Zero-rate goods (0% tax)"}
                      {orderData.scenarioId === "SN008" && "Requires fixed retail price"}
                      {orderData.scenarioId === "SN017" && "Requires FED payable amount"}
                      {orderData.scenarioId === "SN018" && "Services with FED in ST mode"}
                      {orderData.scenarioId === "SN026" && "✅ Tested and working for unregistered buyers"}
                      {orderData.scenarioId === "SN027" && "Retail supplies at invoice level"}
                      {orderData.scenarioId === "SN028" && "Retail supplies at item level"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                  type="text"
                  value={orderData.invoiceNumber}
                  onChange={(e) => setOrderData({...orderData, invoiceNumber: e.target.value})}
                  placeholder="Invoice number"
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {orderData.invoiceDate ? format(orderData.invoiceDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={orderData.invoiceDate}
                        onSelect={(date) => setOrderData({...orderData, invoiceDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="validation-response">Validation Response</Label>
                <Input
                  id="validation-response"
                value={orderData.validationResponse}
                onChange={(e) => setOrderData({...orderData, validationResponse: e.target.value})}
                placeholder="Validation response data..."
              />
            </div>
            
            {/* FBR Submission Options */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <input
                type="checkbox"
                id="skip-fbr-submission"
                checked={skipFbrSubmission}
                onChange={(e) => setSkipFbrSubmission(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="skip-fbr-submission" className="text-sm">
                Do not submit invoice to FBR (create order only)
              </Label>
            </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <div className="bg-white border rounded-lg p-6 hidden">
            <h3 className="text-lg font-semibold mb-4">📍 Billing Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={customerInfo.billingFirstName}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingFirstName: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={customerInfo.billingLastName}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingLastName: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Address Line 1</label>
                <input
                  type="text"
                  value={customerInfo.billingAddress1}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingAddress1: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={customerInfo.billingCity}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingCity: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={customerInfo.billingState}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingState: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={customerInfo.billingPostalCode}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingPostalCode: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={customerInfo.billingCountry}
                  onChange={(e) => setCustomerInfo({...customerInfo, billingCountry: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customerInfo.sameAsBilling}
                  onChange={(e) => setCustomerInfo({...customerInfo, sameAsBilling: e.target.checked})}
                  className="mr-2"
                />
                Shipping address same as billing
              </label>
            </div>
          </div>

          {/* Add Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📦 Add Products
              </CardTitle>
              <CardDescription>
                Select products and configure their details for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-select">Product</Label>
                <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productComboboxOpen}
                      className="w-full justify-between"
                    >
                      {productSelection.selectedProductId
                        ? (() => {
                            const product = products.find((p) => p.id === productSelection.selectedProductId);
                            if (!product) return "Select a product...";
                            return `${product.name} - ${
                        isWeightBasedProduct(product.stockManagementType || 'quantity')
                          ? product.baseWeightUnit === 'kg'
                            ? `${Number(product.pricePerUnit).toFixed(2)}/kg`
                            : `${(Number(product.pricePerUnit) * 1000).toFixed(2)}/kg`
                          : `${Number(product.price).toFixed(2)}`
                            }`;
                          })()
                        : "Select a product..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search product..." />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {products.map((product) => {
                            const displayText = `${product.name} - ${
                              isWeightBasedProduct(product.stockManagementType || 'quantity')
                                ? product.baseWeightUnit === 'kg'
                                  ? `${Number(product.pricePerUnit).toFixed(2)}/kg`
                                  : `${(Number(product.pricePerUnit) * 1000).toFixed(2)}/kg`
                                : `${Number(product.price).toFixed(2)}`
                            }${product.productType === 'group' && Number(product.price) === 0 ? ' (Group Product - Price from addons)' : ''}${isWeightBasedProduct(product.stockManagementType || 'quantity') ? ' (Weight-based)' : ''}${!stockManagementEnabled ? ' (No stock limit)' : ''}`;
                            
                            return (
                              <CommandItem
                                key={product.id}
                                value={displayText}
                                onSelect={() => {
                                  setProductSelection({...productSelection, selectedProductId: product.id, selectedVariantId: ''});
                                  setProductComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${productSelection.selectedProductId === product.id ? "opacity-100" : "opacity-0"}`}
                                />
                                {displayText}
                              </CommandItem>
                            );
                          })}
                          <CommandItem
                            onSelect={() => {
                              setShowAddProductDialog(true);
                              setProductComboboxOpen(false);
                            }}
                            className="text-blue-600 font-medium"
                          >
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Add New Product
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedProduct && selectedProduct.productType === 'variable' && selectedProduct.variants && (
                <div>
                  <label className="block text-gray-700 mb-2">Variant</label>
                  <select
                    value={productSelection.selectedVariantId}
                    onChange={(e) => setProductSelection({...productSelection, selectedVariantId: e.target.value})}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select variant...</option>
                    {selectedProduct.variants?.filter(v => v.isActive).map(variant => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title} - {Number(variant.price).toFixed(2)}
                        {stockManagementEnabled && variant.inventoryQuantity !== undefined 
                          ? ` (Stock: ${variant.inventoryQuantity})` 
                          : !stockManagementEnabled ? ' (No stock limit)' : ''
                        }
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProduct && selectedProduct.productType === 'group' && selectedProduct.addons && (
                <div className="md:col-span-4">
                  <label className="block text-gray-700 mb-2">🧩 Available Addons</label>
                  <div className="border rounded p-3 bg-gray-50">
                    {selectedProduct.addons.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProduct.addons
                          .filter(pa => pa.isActive && pa.addon.isActive)
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map(productAddon => {
                            const isSelected = selectedAddons.some(sa => sa.addonId === productAddon.addonId);
                            const selectedAddon = selectedAddons.find(sa => sa.addonId === productAddon.addonId);
                            
                            return (
                              <div key={productAddon.id} className="flex items-center justify-between p-2 border rounded bg-white">
                                <div className="flex items-center flex-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        removeSelectedAddon(productAddon.addonId);
                                      } else {
                                        addSelectedAddon(
                                          productAddon.addonId, 
                                          productAddon.addon.title, 
                                          productAddon.price
                                        );
                                      }
                                    }}
                                    className={`px-3 py-1 rounded text-sm mr-3 ${
                                      isSelected 
                                        ? 'bg-green-500 text-white hover:bg-green-600' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {isSelected ? '✓ Added' : '+ Add'}
                                  </button>
                                  
                                  <div className="flex-1">
                                    <div className="font-medium">{productAddon.addon.title}</div>
                                    <div className="text-sm text-gray-600">
                                      <span className="flex items-center gap-1"><CurrencySymbol />{productAddon.price.toFixed(2)}</span>
                                      {productAddon.isRequired && (
                                        <span className="ml-2 text-red-500 text-xs">Required</span>
                                      )}
                                    </div>
                                    {productAddon.addon.description && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {productAddon.addon.description}
                                      </div>
                                    )}
                                  </div>

                                  {productAddon.addon.image && (
                                    <img 
                                      src={productAddon.addon.image} 
                                      alt={productAddon.addon.title}
                                      className="w-12 h-12 object-cover rounded ml-2"
                                    />
                                  )}
                                </div>

                                {isSelected && (
                                  <div className="flex items-center ml-3">
                                    <label className="text-sm text-gray-600 mr-2">Qty:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedAddon?.quantity || 1}
                                      onChange={(e) => updateAddonQuantity(
                                        productAddon.addonId, 
                                        parseInt(e.target.value) || 1
                                      )}
                                      className="w-16 p-1 border rounded text-center"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        No addons available for this product
                      </div>
                    )}

                    {selectedAddons.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Selected Addons Summary:
                        </div>
                        <div className="space-y-1">
                          {selectedAddons.map(addon => (
                            <div key={addon.addonId} className="flex justify-between text-sm">
                              <span>{addon.addonTitle} (x{addon.quantity})</span>
                              <span className="flex items-center gap-1"><CurrencySymbol />{(addon.price * addon.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-medium text-sm border-t pt-1">
                            <span>Total Addons:</span>
                            <span className="flex items-center gap-1"><CurrencySymbol />{selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity or Weight input based on product type */}
              {selectedProduct && isWeightBasedProduct(selectedProduct.stockManagementType || 'quantity') ? (
                <div>
                  <label className="block text-gray-700 mb-2">
                                         Weight 
                     {selectedProduct.pricePerUnit && (
                       <span className="text-sm text-gray-500">
                         (<CurrencySymbol />{
                           selectedProduct.baseWeightUnit === 'kg'
                             ? `${Number(selectedProduct.pricePerUnit).toFixed(2)}/kg`
                             : `${(Number(selectedProduct.pricePerUnit) * 1000).toFixed(2)}/kg`
                         })
                       </span>
                     )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={productSelection.weightInput}
                      onChange={(e) => setProductSelection({...productSelection, weightInput: e.target.value})}
                      className="flex-1 p-2 border rounded focus:border-blue-500 focus:outline-none"
                      placeholder="Enter weight"
                    />
                    <select
                      value={productSelection.weightUnit}
                      onChange={(e) => setProductSelection({...productSelection, weightUnit: e.target.value as 'grams' | 'kg'})}
                      className="p-2 border rounded focus:border-blue-500 focus:outline-none"
                    >
                      <option value="grams">g</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                                     {productSelection.weightInput && selectedProduct.pricePerUnit && (
                    <div className="mt-1 text-sm text-green-600">
                      Price: <CurrencySymbol />{calculateWeightBasedPrice(
                        convertToGrams(parseFloat(productSelection.weightInput) || 0, productSelection.weightUnit),
                        getPricePerGram(selectedProduct)
                      ).toFixed(2)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={productSelection.quantity}
                    onChange={(e) => setProductSelection({...productSelection, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
              )}

              <div className="space-y-2 hidden">
                <Label htmlFor="custom-price">Custom Price (optional)</Label>
                <Input
                  id="custom-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productSelection.customPrice}
                  onChange={(e) => setProductSelection({...productSelection, customPrice: e.target.value})}
                  placeholder="Override price"
                />
              </div>

              {/* UOM field for non-weight based products */}
              {selectedProduct && !isWeightBasedProduct(selectedProduct.stockManagementType || 'quantity') && (
                <div className="space-y-2">
                  <Label htmlFor="uom">Unit of Measurement (UOM)</Label>
                  <Input
                    id="uom"
                    type="text"
                    value={productSelection.uom}
                    onChange={(e) => setProductSelection({...productSelection, uom: e.target.value})}
                    placeholder="e.g., pieces, boxes, units"
                  />
                </div>
              )}
            </div>

            {/* Editable Product and Tax Fields */}
            {selectedProduct && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">📋 Product & Tax Details (Editable)</CardTitle>
                  <CardDescription>
                    These values are pre-populated from the product but can be modified before adding to the order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Product Details Section */}
                    <div>
                    <h5 className="text-sm font-medium mb-3 text-muted-foreground">Product Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-name-edit" className="text-sm">Product Name</Label>
                        <Input
                          id="product-name-edit"
                        type="text"
                        value={productSelection.productName}
                        onChange={(e) => setProductSelection({...productSelection, productName: e.target.value})}
                        placeholder="Product name"
                          className="text-sm"
                      />
                    </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="product-description-edit" className="text-sm">Product Description</Label>
                        <Input
                          id="product-description-edit"
                          type="text"
                          value={productSelection.productDescription}
                          onChange={(e) => setProductSelection({...productSelection, productDescription: e.target.value})}
                          placeholder="Product description"
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hs-code-edit" className="text-sm">HS Code</Label>
                        <Input
                          id="hs-code-edit"
                        type="text"
                        value={productSelection.hsCode}
                        onChange={(e) => setProductSelection({...productSelection, hsCode: e.target.value})}
                        placeholder="Harmonized System Code"
                          className="text-sm"
                      />
                    </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="serial-number-edit" className="text-sm">Item Serial No.</Label>
                        <Input
                          id="serial-number-edit"
                        type="text"
                        value={productSelection.itemSerialNumber}
                        onChange={(e) => setProductSelection({...productSelection, itemSerialNumber: e.target.value})}
                        placeholder="Serial number"
                          className="text-sm"
                      />
                    </div>
                    
                      <div className="space-y-2">
                        <Label htmlFor="sro-schedule-edit" className="text-sm">SRO / Schedule No.</Label>
                        <Input
                          id="sro-schedule-edit"
                        type="text"
                        value={productSelection.sroScheduleNumber}
                        onChange={(e) => setProductSelection({...productSelection, sroScheduleNumber: e.target.value})}
                        placeholder="SRO or Schedule number"
                          className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                  <Separator />

                {/* Tax and Price Section */}
                <div>
                    <h5 className="text-sm font-medium mb-3 text-muted-foreground">Tax & Pricing Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tax-amount-edit" className="text-sm">Tax Amount</Label>
                        <Input
                          id="tax-amount-edit"
                      type="text"
                      value={productSelection.taxAmount === 0 ? '' : productSelection.taxAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, taxAmount: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter amount"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="tax-percentage-edit" className="text-sm">Tax Percentage (%)</Label>
                        <Input
                          id="tax-percentage-edit"
                      type="text"
                      value={productSelection.taxPercentage === 0 ? '' : productSelection.taxPercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, taxPercentage: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter percentage"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="price-including-tax-edit" className="text-sm">Price Including Tax</Label>
                        <Input
                          id="price-including-tax-edit"
                      type="text"
                      value={productSelection.priceIncludingTax === 0 ? '' : productSelection.priceIncludingTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, priceIncludingTax: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter price"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="price-excluding-tax-edit" className="text-sm">Price Excluding Tax</Label>
                        <Input
                          id="price-excluding-tax-edit"
                      type="text"
                      value={productSelection.priceExcludingTax === 0 ? '' : productSelection.priceExcludingTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, priceExcludingTax: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter price"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="extra-tax-edit" className="text-sm">Extra Tax</Label>
                        <Input
                          id="extra-tax-edit"
                      type="text"
                      value={productSelection.extraTax === 0 ? '' : productSelection.extraTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, extraTax: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter amount"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="further-tax-edit" className="text-sm">Further Tax</Label>
                        <Input
                          id="further-tax-edit"
                      type="text"
                      value={productSelection.furtherTax === 0 ? '' : productSelection.furtherTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, furtherTax: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter amount"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="fed-payable-tax-edit" className="text-sm">FED Payable Tax</Label>
                        <Input
                          id="fed-payable-tax-edit"
                      type="text"
                      value={productSelection.fedPayableTax === 0 ? '' : productSelection.fedPayableTax}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, fedPayableTax: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter amount"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="discount-amount-edit" className="text-sm">Discount Amount</Label>
                        <Input
                          id="discount-amount-edit"
                      type="text"
                      value={productSelection.discountAmount === 0 ? '' : productSelection.discountAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProductSelection({...productSelection, discountAmount: value === '' ? 0 : parseFloat(value) || 0});
                      }}
                      placeholder="Enter amount"
                          className="text-sm"
                    />
                  </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="fixed-notified-value-edit" className="text-sm">Fixed Notified Value/Retail Price</Label>
                        <Input
                          id="fixed-notified-value-edit"
                          type="text"
                          value={productSelection.fixedNotifiedValueOrRetailPrice === 0 ? '' : productSelection.fixedNotifiedValueOrRetailPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProductSelection({...productSelection, fixedNotifiedValueOrRetailPrice: value === '' ? 0 : parseFloat(value) || 0});
                          }}
                          placeholder="Enter value"
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sale-type-edit" className="text-sm">Sale Type</Label>
                        <Input
                          id="sale-type-edit"
                          type="text"
                          value={productSelection.saleType}
                          onChange={(e) => setProductSelection({...productSelection, saleType: e.target.value})}
                          placeholder="Goods at standard rate (default)"
                          className="text-sm"
                        />
                      </div>
                  </div>
                </div>
                </CardContent>
              </Card>
            )}

            <Button
              type="button"
              onClick={handleAddProduct}
              className="mt-4"
              size="lg"
            >
              ➕ Add Product
            </Button>

            {/* Order Items List */}
            {orderItems.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Order Items</h4>
                  {orderData.supplierId && (
                    <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
                      🏢 Supplier Products
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          {item.productDescription && (
                            <div className="text-sm text-gray-600 italic">{item.productDescription}</div>
                          )}
                          {item.variantTitle && (
                            <div className="text-sm text-gray-600">{item.variantTitle}</div>
                          )}
                          {item.sku && (
                            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                          )}
                          {item.hsCode && (
                            <div className="text-sm text-gray-500">HS Code: {item.hsCode}</div>
                          )}
                          {item.isWeightBased && item.weightQuantity && (
                            <div className="text-sm text-blue-600">
                              ⚖️ Weight: {formatWeightAuto(item.weightQuantity).formattedString}
                            </div>
                          )}
                          {item.uom && !item.isWeightBased && (
                            <div className="text-sm text-purple-600">
                              📏 UOM: {item.uom}
                            </div>
                          )}
                          {item.itemSerialNumber && (
                            <div className="text-sm text-orange-600">
                              🔢 Serial No: {item.itemSerialNumber}
                            </div>
                          )}
                          {item.sroScheduleNumber && (
                            <div className="text-sm text-teal-600">
                              📄 SRO/Schedule: {item.sroScheduleNumber}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            {item.addons && Array.isArray(item.addons) && item.addons.length > 0 ? (
                              <div className="text-right">
                                                <div className="flex items-center gap-1">Price Inc. Tax: <CurrencySymbol />{(item.priceIncludingTax || item.price).toFixed(2)}</div>
                <div className="flex items-center gap-1">Addons: <CurrencySymbol />{item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0).toFixed(2)}</div>
                <div className="font-medium border-t pt-1 flex items-center gap-1">
                  <CurrencySymbol />{((item.priceIncludingTax || item.price) + item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)).toFixed(2)} x 
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-16 mx-1 p-1 border rounded text-center"
                  />
                  = <CurrencySymbol />{item.totalPrice.toFixed(2)}
                </div>
                              </div>
                            ) : item.isWeightBased ? (
                              <div className="flex items-center gap-1">
                                Price Inc. Tax: <CurrencySymbol />{(item.priceIncludingTax || item.price).toFixed(2)} (for {formatWeightAuto(item.weightQuantity || 0).formattedString})
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                Price Inc. Tax: <CurrencySymbol />{(item.priceIncludingTax || item.price).toFixed(2)} x 
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)}
                                  className="w-16 mx-1 p-1 border rounded text-center"
                                />
                                = <CurrencySymbol />{item.totalPrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      {/* Display addons for group products */}
                      {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-blue-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">🧩 Addons:</div>
                          <div className="space-y-1">
                            {item.addons.map((addon, addonIndex) => (
                              <div key={addon.addonId} className="flex justify-between text-sm text-gray-600">
                                <span>• {getAddonTitle(addon, addonIndex)} (x{addon.quantity})</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{(addon.price * addon.quantity).toFixed(2)} each</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-medium text-gray-700 border-t pt-1 mt-2">
                              <span>Addons subtotal per product:</span>
                              <span className="flex items-center gap-1"><CurrencySymbol />{item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Display tax and discount information */}
                      {(Number(item.taxAmount) || Number(item.taxPercentage) || Number(item.discount) || Number(item.extraTax) || Number(item.furtherTax) || Number(item.fedPayableTax) || Number(item.priceIncludingTax) || Number(item.priceExcludingTax)) > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-green-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">💰 Tax & Discount Details:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {(Number(item.taxAmount) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Tax Amount:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.taxAmount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(Number(item.taxPercentage) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Tax %:</span>
                                <span>{Number(item.taxPercentage || 0).toFixed(2)}%</span>
                              </div>
                            )}
                            {(Number(item.priceIncludingTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Price Inc. Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.priceIncludingTax || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(Number(item.priceExcludingTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Price Ex. Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.priceExcludingTax || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(Number(item.extraTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Extra Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.extraTax || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(Number(item.furtherTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Further Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.furtherTax || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(Number(item.fedPayableTax) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>FED Tax:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.fedPayableTax || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(Number(item.discount) || 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Discount:</span>
                                <span className="flex items-center gap-1"><CurrencySymbol />{Number(item.discount || 0).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </CardContent>
          </Card>

          {/* Order Settings */}
          <div className="bg-white border rounded-lg p-6 hidden">
            <h3 className="text-lg font-semibold mb-4">⚙️ Order Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Payment Status</label>
                <select
                  value={orderData.paymentStatus}
                  onChange={(e) => setOrderData({...orderData, paymentStatus: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Shipping Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderData.shippingAmount}
                  onChange={(e) => setOrderData({...orderData, shippingAmount: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={orderData.taxRate}
                  onChange={(e) => setOrderData({...orderData, taxRate: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Discount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={orderData.discountAmount}
                    onChange={(e) => setOrderData({...orderData, discountAmount: parseFloat(e.target.value) || 0})}
                    className="flex-1 p-2 border rounded focus:border-blue-500 focus:outline-none"
                  />
                  <select
                    value={orderData.discountType}
                    onChange={(e) => setOrderData({...orderData, discountType: e.target.value})}
                    className="p-2 border rounded focus:border-blue-500 focus:outline-none currency-symbol"
                  >
                    <option value="amount">Currency</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 mb-2">Order Notes</label>
              <textarea
                value={orderData.notes}
                onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Internal notes about this order..."
              />
            </div>
          </div>

          

          {/* Driver Assignment */}
          <div className="bg-white border rounded-lg p-6 hidden">
            <h3 className="text-lg font-semibold mb-4">🚚 Driver Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Assignment Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="manual"
                      checked={orderData.assignmentType === 'manual'}
                      onChange={(e) => handleDriverAssignmentTypeChange(e.target.value as 'manual')}
                      className="mr-2"
                    />
                    Manual Assignment
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="automatic"
                      checked={orderData.assignmentType === 'automatic'}
                      onChange={(e) => handleDriverAssignmentTypeChange(e.target.value as 'automatic')}
                      className="mr-2"
                    />
                    Automatic (Nearest Driver)
                  </label>
                </div>
              </div>

              {orderData.assignmentType === 'manual' && (
                <div>
                  <label className="block text-gray-700 mb-2">Select Driver</label>
                  <select
                    value={orderData.assignedDriverId}
                    onChange={(e) => setOrderData({...orderData, assignedDriverId: e.target.value})}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select a driver --</option>
                    {availableDrivers.map((driverData) => (
                      <option key={driverData.driver.id} value={driverData.driver.id}>
                        {driverData.user.name} - {driverData.driver.vehicleType} ({driverData.driver.vehiclePlateNumber}) - {driverData.driver.status}
                      </option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No drivers available</p>
                  )}
                </div>
              )}

              {orderData.assignmentType === 'automatic' && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-700">
                    📍 The system will automatically assign the nearest available driver based on the delivery address.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2">Delivery Status</label>
                <select
                  value={orderData.deliveryStatus}
                  onChange={(e) => setOrderData({...orderData, deliveryStatus: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - Right Side */}
        <div ref={sidebarContainerRef} className="lg:col-span-1 relative">
          <aside 
            ref={sidebarRef}
            className={`transition-all duration-300 will-change-transform z-30 ${
              isSticky 
                ? 'fixed top-6 right-6 w-80 max-w-[calc(100vw-3rem)]' 
                : 'sticky top-6'
            } h-fit max-h-[calc(100vh-3rem)] overflow-y-auto`}
          >
            <Card className={`border-2 transition-all duration-300 ${
              isSticky 
                ? 'shadow-2xl bg-white/95 backdrop-blur-sm border-blue-200/50 scale-105' 
                : 'shadow-lg bg-white border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Order Summary
                </CardTitle>
                <CardDescription>
                  Review your order details and total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <div className="space-y-3">
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                      <span className="flex items-center gap-1 font-medium">-<CurrencySymbol />{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {totals.pointsDiscountAmount > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>Points Discount ({orderData.pointsToRedeem} pts):</span>
                      <span className="flex items-center gap-1 font-medium">-<CurrencySymbol />{totals.pointsDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="flex items-center gap-1"><CurrencySymbol />{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Points Preview */}
              {loyaltySettings.enabled && (
                  <>
                    <Separator />
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-purple-800 mb-1 flex items-center gap-2">
                        🎁 Loyalty Points
                      </div>
                    <div className="text-sm text-purple-700">
                      {orderData.customerId ? (
                          <>Customer will earn: <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-800">{calculatePointsToEarn()} points</Badge></>
                      ) : (
                          <>This order will earn: <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-800">{calculatePointsToEarn()} points</Badge> (requires customer)</>
                      )}
                      {calculatePointsToEarn() === 0 && loyaltySettings.minimumOrder > 0 && (
                        <div className="text-xs text-purple-600 mt-1">
                          (Minimum order: <CurrencySymbol />{loyaltySettings.minimumOrder})
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-purple-600 mt-2">
                      {orderData.status === 'completed' ? (
                        <span className="text-green-600">✅ Points will be available immediately</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Points will be pending until completed</span>
                      )}
                    </div>
                    {!orderData.customerId && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ Select a customer above to award points for this order
                      </div>
                    )}
                  </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                  <strong>{orderItems.length}</strong> item(s) in order
                </div>
                
                  <Button
                  onClick={handleSubmit}
                  disabled={submitting || orderItems.length === 0}
                    className="w-full"
                    size="lg"
                >
                  {submitting ? 'Creating Order...' : 'Create Order'}
                  </Button>
                
                  <Button
                  type="button"
                    variant="outline"
                  onClick={() => router.push('/orders')}
                    className="w-full"
                    size="lg"
                >
                  Cancel
                  </Button>
              </div>
              </CardContent>
            </Card>
          </aside>
            </div>
          </div>

      {/* Add New User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer to add to your order. Enter their basic information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <input
                id="name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Customer name"
              />
        </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="customer@example.com"
              />
      </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowAddUserDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAddNewUser}
              disabled={addingUser}
            >
              {addingUser ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product to add to your order. Enter the basic product information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="productName" className="text-right">
                Name
              </label>
              <input
                id="productName"
                value={newProductData.name}
                onChange={(e) => setNewProductData({...newProductData, name: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Product name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="productPrice" className="text-right">
                Price
              </label>
              <input
                id="productPrice"
                type="number"
                step="0.01"
                min="0"
                value={newProductData.price}
                onChange={(e) => setNewProductData({...newProductData, price: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="stockQuantity" className="text-right">
                Stock Qty
              </label>
              <input
                id="stockQuantity"
                type="number"
                min="0"
                value={newProductData.stockQuantity}
                onChange={(e) => setNewProductData({...newProductData, stockQuantity: e.target.value})}
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowAddProductDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAddNewProduct}
              disabled={addingProduct}
            >
              {addingProduct ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
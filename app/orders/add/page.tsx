'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CurrencySymbol from '../../components/CurrencySymbol';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  productType: string;
  isActive: boolean;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
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
  variantTitle?: string;
  sku?: string;
  price: number;
  quantity: number;
  totalPrice: number;
  addons?: SelectedAddon[];
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
}

export default function AddOrder() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);
  
  // Order form data
  const [orderData, setOrderData] = useState({
    customerId: '',
    email: '',
    phone: '',
    status: 'pending',
    paymentStatus: 'pending',
    notes: '',
    shippingAmount: 0,
    taxRate: 10, // 10%
    discountAmount: 0,
    discountType: 'amount', // 'amount' or 'percentage'
    currency: 'CUSTOM'
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
    customPrice: ''
  });

  // Group product addon selection
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Clear selected addons when product changes
  useEffect(() => {
    setSelectedAddons([]);
  }, [productSelection.selectedProductId]);

  const fetchInitialData = async () => {
    try {
      const [productsRes, customersRes, stockSettingRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/users'),
        fetch('/api/settings/stock-management')
      ]);

      const productsData = await productsRes.json();
      const customersData = await customersRes.json();
      const stockData = await stockSettingRes.json();

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
      setStockManagementEnabled(stockData.stockManagementEnabled || true);
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
        setOrderData(prev => ({ ...prev, email: customer.email, phone: customer.phone || '' }));
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
      }
    } else {
      setCustomerInfo(prev => ({ ...prev, isGuest: true }));
      setOrderData(prev => ({ ...prev, email: '', phone: '' }));
    }
  };

  const handleAddProduct = () => {
    const { selectedProductId, selectedVariantId, quantity, customPrice } = productSelection;
    
    if (!selectedProductId || quantity <= 0) {
      alert('Please select a product and enter a valid quantity');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

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

    if (selectedVariantId && product.variants) {
      variant = product.variants.find(v => v.id === selectedVariantId);
      if (variant) {
        price = Number(variant.price) || 0;
        variantTitle = variant.title;
        sku = variant.sku || sku;
      }
    }

    // Use custom price if provided
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
    let totalPrice = price * quantity;
    if (product.productType === 'group' && selectedAddons.length > 0) {
      const addonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
      totalPrice = (price + addonsPrice) * quantity;
    }

    const newItem: OrderItem = {
      productId: selectedProductId,
      variantId: selectedVariantId || undefined,
      productName,
      variantTitle: variantTitle || undefined,
      sku,
      price,
      quantity,
      totalPrice,
      addons: product.productType === 'group' && selectedAddons.length > 0 ? [...selectedAddons] : undefined
    };

    setOrderItems([...orderItems, newItem]);
    
    // Reset selection
    setProductSelection({
      selectedProductId: '',
      selectedVariantId: '',
      quantity: 1,
      customPrice: ''
    });
    clearSelectedAddons();
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].totalPrice = updatedItems[index].price * quantity;
    setOrderItems(updatedItems);
  };

  const getAddonTitle = (addon: any, index: number) => {
    return addon.addonTitle || addon.title || addon.name || `Addon ${index + 1}`;
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;
      
      // Add addon prices for group products
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        const addonsTotal = item.addons.reduce((addonSum, addon) => 
          addonSum + (addon.price * addon.quantity), 0
        );
        itemTotal += addonsTotal * item.quantity;
      }
      
      return sum + itemTotal;
    }, 0);
    
    const discountAmount = orderData.discountType === 'percentage' 
      ? subtotal * (orderData.discountAmount / 100)
      : orderData.discountAmount;
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * (orderData.taxRate / 100);
    const totalAmount = discountedSubtotal + taxAmount + orderData.shippingAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount
    };
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
        items: orderItems
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }

      router.push('/orders');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find(p => p.id === productSelection.selectedProductId);
  const totals = calculateTotals();

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🛒 Create New Order</h1>
        <button
          onClick={() => router.push('/orders')}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          ← Back to Orders
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {!stockManagementEnabled && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
            <div>
              <h3 className="font-medium text-orange-800">Stock Management Disabled</h3>
              <p className="text-sm text-orange-600 mt-1">
                Orders can be created without stock limitations. Products will not show inventory levels or availability warnings.
              </p>
            </div>
          </div>
        </div>
      )}

      {stockManagementEnabled && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
            <div>
              <h3 className="font-medium text-blue-800">Stock Management Enabled</h3>
              <p className="text-sm text-blue-600 mt-1">
                Orders will check inventory levels where available. Products without inventory records can still be ordered.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Form - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">👤 Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Select Customer</label>
                <select
                  value={orderData.customerId}
                  onChange={handleCustomerChange}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Guest Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name || `${customer.firstName} ${customer.lastName}`} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={orderData.email}
                  onChange={(e) => setOrderData({...orderData, email: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={orderData.phone}
                  onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Order Status</label>
                <select
                  value={orderData.status}
                  onChange={(e) => setOrderData({...orderData, status: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white border rounded-lg p-6">
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
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📦 Add Products</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Product</label>
                <select
                  value={productSelection.selectedProductId}
                  onChange={(e) => setProductSelection({...productSelection, selectedProductId: e.target.value, selectedVariantId: ''})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                                      {product.name} - {String.fromCharCode(0xe001)}{Number(product.price).toFixed(2)}
                {product.productType === 'group' && Number(product.price) === 0 ? ' (Group Product - Price from addons)' : ''}
                      {!stockManagementEnabled ? ' (No stock limit)' : ''}
                    </option>
                  ))}
                </select>
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
                        {variant.title} - {String.fromCharCode(0xe001)}{Number(variant.price).toFixed(2)}
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

              <div>
                <label className="block text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={productSelection.quantity}
                  onChange={(e) => setProductSelection({...productSelection, quantity: parseInt(e.target.value) || 1})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Custom Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productSelection.customPrice}
                  onChange={(e) => setProductSelection({...productSelection, customPrice: e.target.value})}
                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  placeholder="Override price"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddProduct}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ➕ Add Product
            </button>

            {/* Order Items List */}
            {orderItems.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          {item.variantTitle && (
                            <div className="text-sm text-gray-600">{item.variantTitle}</div>
                          )}
                          {item.sku && (
                            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            {item.addons && Array.isArray(item.addons) && item.addons.length > 0 ? (
                              <div className="text-right">
                                                <div className="flex items-center gap-1">Base: <CurrencySymbol />{item.price.toFixed(2)}</div>
                <div className="flex items-center gap-1">Addons: <CurrencySymbol />{item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0).toFixed(2)}</div>
                <div className="font-medium border-t pt-1 flex items-center gap-1">
                  <CurrencySymbol />{(item.price + item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0)).toFixed(2)} x 
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
                            ) : (
                                            <div className="flex items-center gap-1">
                <CurrencySymbol />{item.price.toFixed(2)} x 
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Settings */}
          <div className="bg-white border rounded-lg p-6">
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
                    <option value="amount">{String.fromCharCode(0xe001)}</option>
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
        </div>

        {/* Order Summary - Right Side */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">📊 Order Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="flex items-center gap-1"><CurrencySymbol />{totals.subtotal.toFixed(2)}</span>
              </div>
              
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span className="flex items-center gap-1">-<CurrencySymbol />{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax ({orderData.taxRate}%):</span>
                <span className="flex items-center gap-1"><CurrencySymbol />{totals.taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="flex items-center gap-1"><CurrencySymbol />{orderData.shippingAmount.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="flex items-center gap-1"><CurrencySymbol />{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="text-sm text-gray-600">
                  <strong>{orderItems.length}</strong> item(s) in order
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={submitting || orderItems.length === 0}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? 'Creating Order...' : 'Create Order'}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push('/orders')}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
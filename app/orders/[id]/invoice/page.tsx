'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CurrencySymbol from '../../../components/CurrencySymbol';
import { 
  formatWeightAuto, 
  isWeightBasedProduct 
} from '@/utils/weightUtils';

export default function OrderInvoice() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderData();
    fetchAddons();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const orderRes = await fetch(`/api/orders/${orderId}`);
      
      if (!orderRes.ok) throw new Error('Order not found');
      
      const orderData = await orderRes.json();
      
      // Process items to add weight-based information
      if (orderData.items) {
        orderData.items = orderData.items.map((item: any) => {
          // Determine if item is weight-based by checking if weightQuantity exists and is > 0
          const weightQuantity = item.weightQuantity ? parseFloat(item.weightQuantity) : 0;
          const isWeightBased = weightQuantity > 0;

          return {
            ...item,
            isWeightBased,
            weightQuantity: weightQuantity > 0 ? weightQuantity : undefined,
            weightUnit: item.weightUnit || undefined
          };
        });
      }
      
      setOrder(orderData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddons = async () => {
    try {
      const addonsRes = await fetch('/api/addons');
      if (addonsRes.ok) {
        const addonsData = await addonsRes.json();
        setAddons(addonsData);
      }
    } catch (err) {
      console.error('Failed to fetch addons:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Format date and time to "Aug 5, 2025 at 5:57 PM" format
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options).replace(',', ' at');
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = Number(amount);
    
    // Handle NaN, undefined, null, or invalid values
    if (isNaN(numAmount) || amount === null || amount === undefined || typeof numAmount !== 'number') {
      return (
        <span className="flex items-center gap-1">
          <CurrencySymbol />0.00
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-1">
        <CurrencySymbol />{numAmount.toFixed(2)}
      </span>
    );
  };

  const parseAddons = (addonsData: any) => {
    if (!addonsData) return [];
    
    try {
      // If it's already an array, return it
      if (Array.isArray(addonsData)) {
        return addonsData;
      }
      
      // If it's a string, try to parse it
      if (typeof addonsData === 'string') {
        const parsed = JSON.parse(addonsData);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      // If it's an object but not an array, wrap it in an array
      if (typeof addonsData === 'object') {
        return [addonsData];
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing addons:', error);
      return [];
    }
  };

  const getAddonTitle = (addon: any, index: number) => {
    // First try to get the title from the stored addon data
    if (addon.addonTitle) return addon.addonTitle;
    if (addon.title) return addon.title;
    if (addon.name) return addon.name;
    
    // If no title in stored data, try to find it in the addons table
    if (addon.addonId && addons.length > 0) {
      const addonFromTable = addons.find(a => a.id === addon.addonId);
      if (addonFromTable) {
        return addonFromTable.title;
      }
    }
    
    // Fallback to generic name
    return `Addon ${index + 1}`;
  };

  const getAddonDescription = (addon: any) => {
    // Try to get description from addons table
    if (addon.addonId && addons.length > 0) {
      const addonFromTable = addons.find(a => a.id === addon.addonId);
      if (addonFromTable && addonFromTable.description) {
        return addonFromTable.description;
      }
    }
    return null;
  };

  const getAddonImage = (addon: any) => {
    // Try to get image from addons table
    if (addon.addonId && addons.length > 0) {
      const addonFromTable = addons.find(a => a.id === addon.addonId);
      if (addonFromTable && addonFromTable.image) {
        return addonFromTable.image;
      }
    }
    return null;
  };

  if (loading) return <div className="p-8">Loading invoice...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!order) return <div className="p-8">Order not found</div>;

  const orderItems = order.items || [];

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hidden {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Print Button */}
          <div className="mb-6 print-hidden">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🖨️ Print Invoice
            </button>
          </div>

          {/* Invoice */}
          <div className="invoice-container bg-white shadow-lg">
            {/* Header */}
            <div className="border-b-2 border-gray-200 p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                  <p className="text-gray-600 mt-2">Invoice #{order.orderNumber}</p>
                  {order.invoiceNumber && (
                    <p className="text-gray-600 mt-1">Invoice Number: {order.invoiceNumber}</p>
                  )}
                  {order.invoiceRefNo && (
                    <p className="text-gray-600 mt-1">Ref No: {order.invoiceRefNo}</p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-blue-600"> Hisaab360 </h2>
                  <div className="text-gray-600 mt-2">
                    <p>Alrasheed arcade second floor</p>
                    <p> Flat no 1 mujahid street ,</p>
                    <p> Defence road , Rawalpindi</p>
                    <p>Phone: +92 335 5836 228</p>
                    <p>Email: support@hisaab360.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="p-8 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Supplier */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">🏢 Supplier:</h3>
                  <div className="text-gray-600">
                    {/* Primary: Show seller business fields from order */}
                    { order.supplier ? (
                      /* Fallback: Show supplier table data if seller fields are empty */
                      <>
                        {order.supplier.name && <p className="font-medium">{order.supplier.name}</p>} 
                        {order.supplier.sellerBusinessName && <p className="text-sm text-gray-500">{order.supplier.sellerBusinessName}</p>}
                        {order.supplier.email && <p className="mt-1 text-sm text-gray-500">{order.supplier.email}</p>}
                        {order.supplier.sellerNTNCNIC && <p className="text-sm text-gray-500">NTN / CNIC: {order.supplier.sellerNTNCNIC}</p>}
                        {order.supplier.sellerProvince && <p className="text-sm text-gray-500">Province: {order.supplier.sellerProvince}</p>}
                        {order.supplier.sellerAddress && <p className="text-sm text-gray-500">Address: {order.supplier.sellerAddress}</p>}

                        
                        
                        
                        {order.supplier.fax && <p>Fax: {order.supplier.fax}</p>}
                        {order.supplier.website && <p className="text-blue-600 text-sm break-all">{order.supplier.website}</p>}
                        {order.supplier.taxId && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Tax ID: </span>
                            <span className="font-mono text-sm">{order.supplier.taxId}</span>
                          </div>
                        )}
                        
                        {/* Address from supplier table */}
                        {(order.supplier.addressLine1 || order.supplier.addressLine2 || order.supplier.city || order.supplier.state || order.supplier.postalCode || order.supplier.country) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Address:</p>
                            {order.supplier.addressLine1 && <p className="text-sm">{order.supplier.addressLine1}</p>}
                            {order.supplier.addressLine2 && <p className="text-sm">{order.supplier.addressLine2}</p>}
                            <p className="text-sm">
                              {order.supplier.city && `${order.supplier.city}, `}
                              {order.supplier.state && `${order.supplier.state} `}
                              {order.supplier.postalCode}
                            </p>
                            {order.supplier.country && <p className="text-sm">{order.supplier.country}</p>}
                          </div>
                        )}
                        
                        {/* Primary Contact */}
                        {(order.supplier.primaryContactName || order.supplier.primaryContactEmail || order.supplier.primaryContactPhone || order.supplier.primaryContactMobile) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Primary Contact:</p>
                            {order.supplier.primaryContactName && <p className="text-sm">{order.supplier.primaryContactName}</p>}
                            {order.supplier.primaryContactEmail && <p className="text-sm">{order.supplier.primaryContactEmail}</p>}
                            {order.supplier.primaryContactPhone && <p className="text-sm">Phone: {order.supplier.primaryContactPhone}</p>}
                            {order.supplier.primaryContactMobile && <p className="text-sm">Mobile: {order.supplier.primaryContactMobile}</p>}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 italic">No supplier information</p>
                    )}
                  </div>
                </div>

                {/* Seller Information (from order) */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">🏪 Seller:</h3>
                  <div className="text-gray-600">
                    {(order.sellerBusinessName || order.sellerNTNCNIC || order.sellerProvince || order.sellerAddress) ? (
                      <>
                        {order.sellerBusinessName && <p className="font-medium">{order.sellerBusinessName}</p>}
                        {order.sellerNTNCNIC && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">NTN/CNIC: </span>
                            <span className="font-mono text-sm">{order.sellerNTNCNIC}</span>
                          </div>
                        )}
                        {order.sellerProvince && <p className="text-sm">{order.sellerProvince} Province</p>}
                        {order.sellerAddress && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Address: </span>
                            <p className="text-sm">{order.sellerAddress}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 italic">No seller information</p>
                    )}
                  </div>
                </div>

                {/* Buyer */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">👤 Buyer:</h3>
                  <div className="text-gray-600">
                    {/* Primary: Show buyer business fields from order */}
                    {(order.buyerBusinessName || order.buyerNTNCNIC || order.buyerProvince || order.buyerAddress || order.buyerRegistrationType) ? (
                      <>
                        {order.buyerBusinessName && <p className="font-medium">{order.buyerBusinessName}</p>}
                        {order.buyerNTNCNIC && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">NTN/CNIC: </span>
                            <span className="font-mono text-sm">{order.buyerNTNCNIC}</span>
                          </div>
                        )}
                        {order.buyerRegistrationType && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">Registration Type: </span>
                            <span className="text-sm capitalize">{order.buyerRegistrationType}</span>
                          </div>
                        )}
                        {order.buyerAddress && <p className="mt-1">{order.buyerAddress}</p>}
                        {order.buyerProvince && <p className="text-sm">{order.buyerProvince} Province</p>}
                        
                        {/* Contact info from order */}
                        {(order.email || order.phone) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Contact Information:</p>
                            {order.email && <p className="text-sm">{order.email}</p>}
                            {order.phone && <p className="text-sm">Phone: {order.phone}</p>}
                          </div>
                        )}
                      </>
                    ) : order.user ? (
                      /* Fallback: Show user table data if buyer fields are empty */
                      <>
                        {/* Basic User Information */}
                        {(order.user.name || order.user.firstName || order.user.lastName) && (
                          <p className="font-medium">
                            {order.user.name || `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()}
                          </p>
                        )}
                        {order.user.displayName && order.user.displayName !== order.user.name && (
                          <p className="text-sm text-gray-500">Display Name: {order.user.displayName}</p>
                        )}
                        {order.user.username && <p className="text-sm text-gray-500">Username: @{order.user.username}</p>}
                        
                        {/* Contact Information */}
                        {order.user.email && <p className="mt-1 text-sm text-gray-500">{order.user.email} </p>}
                        {order.user.phone && <p className="text-sm text-gray-500">Phone: {order.user.phone}</p>}
                        {order.user.buyerNTNCNIC && <p className="text-sm text-gray-500">NTN / CNIC: {order.user.buyerNTNCNIC}</p>}
                        {order.user.buyerProvince && <p className="text-sm text-gray-500">Province: {order.user.buyerProvince}</p>}
                        {order.user.buyerAddress && <p className="text-sm text-gray-500">Address: {order.user.buyerAddress}</p>}
                        {order.user.buyerRegistrationType && <p className="text-sm text-gray-500">Registration Type: {order.user.buyerRegistrationType}</p>}
                        
                        {/* User Type & Profile */}
                        {order.user.userType && order.user.userType !== 'customer' && (
                          <p className="text-xs text-blue-600 capitalize">User Type: {order.user.userType}</p>
                        )}
                        {order.user.profilePicture && (
                          <div className="mt-2">
                            <img src={order.user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full" />
                          </div>
                        )}
                        
                        {/* Address Information */}
                        {(order.user.address || order.user.city || order.user.state || order.user.postalCode || order.user.country) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Address:</p>
                            {order.user.address && <p className="text-sm">{order.user.address}</p>}
                            <p className="text-sm">
                              {order.user.city && `${order.user.city}, `}
                              {order.user.state && `${order.user.state} `}
                              {order.user.postalCode}
                            </p>
                            {order.user.country && <p className="text-sm">{order.user.country}</p>}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Final fallback: Show billing information if no user and no buyer business data */
                      <>
                        <p className="font-medium">{order.billingFirstName} {order.billingLastName}</p>
                        {order.email && <p className="mt-1">{order.email}</p>}
                        {order.phone && <p>Phone: {order.phone}</p>}
                        
                        {/* Billing Address */}
                        {(order.billingAddress1 || order.billingAddress2 || order.billingCity || order.billingState || order.billingPostalCode || order.billingCountry) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Billing Address:</p>
                            {order.billingAddress1 && <p className="text-sm">{order.billingAddress1}</p>}
                            {order.billingAddress2 && <p className="text-sm">{order.billingAddress2}</p>}
                            <p className="text-sm">
                              {order.billingCity && `${order.billingCity}, `}
                              {order.billingState && `${order.billingState} `}
                              {order.billingPostalCode}
                            </p>
                            {order.billingCountry && <p className="text-sm">{order.billingCountry}</p>}
                          </div>
                        )}
                        
                        {/* Shipping Address if different */}
                        {(order.shippingFirstName && (order.shippingFirstName !== order.billingFirstName || order.shippingLastName !== order.billingLastName)) && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Shipping Address:</p>
                            <p className="text-sm font-medium">{order.shippingFirstName} {order.shippingLastName}</p>
                            {order.shippingAddress1 && <p className="text-sm">{order.shippingAddress1}</p>}
                            {order.shippingAddress2 && <p className="text-sm">{order.shippingAddress2}</p>}
                            <p className="text-sm">
                              {order.shippingCity && `${order.shippingCity}, `}
                              {order.shippingState && `${order.shippingState} `}
                              {order.shippingPostalCode}
                            </p>
                            {order.shippingCountry && <p className="text-sm">{order.shippingCountry}</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Invoice Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Invoice Information:</h3>
                  <div className="text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Invoice Date:</span>
                      <span className='text-sm text-gray-500'>{formatDateTime(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className='text-sm text-gray-500'>Order Status:</span>
                      <span className="text-sm text-gray-500 capitalize">{order.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className='text-sm text-gray-500'>Payment Status:</span>
                      <span className="capitalize text-sm text-gray-500">{order.paymentStatus}</span>
                    </div>
                    {order.invoiceType && (
                      <div className="flex justify-between">
                        <span className='text-sm text-gray-500'>Invoice Type:</span>
                        <span className="text-sm text-gray-500">{order.invoiceType}</span>
                      </div>
                    )}
                    {order.scenarioId && (
                      <div className="flex justify-between">
                        <span className='text-sm text-gray-500'>Scenario ID:</span>
                        <span className="text-sm text-gray-500 font-mono">{order.scenarioId}</span>
                      </div>
                    )}
                    {order.validationResponse && (
                      <div className="mt-2">
                        <span className='text-sm text-gray-500'>Validation:</span>
                        <div className="text-xs text-gray-400 mt-1 p-2 bg-gray-50 rounded font-mono max-h-20 overflow-y-auto">
                          {order.validationResponse}
                        </div>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="flex justify-between">
                        <span className='text-sm text-gray-500'>Tracking:</span>
                        <span className="font-mono text-sm text-gray-500">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Items:</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2">Product Name</th>
                      <th className="text-left py-3 px-2">HS Code</th>
                      <th className="text-left py-3 px-2">Serial No.</th>
                      <th className="text-left py-3 px-2">SRO/Schedule</th>
                      <th className="text-center py-3 px-2">Quantity</th>
                      <th className="text-center py-3 px-2">UOM</th>
                      <th className="text-right py-3 px-2">Unit Price</th>
                      <th className="text-right py-3 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.length > 0 ? (
                      orderItems.map((item: any, index: number) => (
                        <React.Fragment key={index}>
                          <tr className="border-b border-gray-100">
                            {/* Product Name */}
                            <td className="py-3 px-2">
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                {item.variantTitle && (
                                  <div className="text-xs text-gray-500">{item.variantTitle}</div>
                                )}
                                {item.sku && (
                                  <div className="text-xs text-gray-500 font-mono">SKU: {item.sku}</div>
                                )}
                                {item.isWeightBased && item.weightQuantity && (
                                  <div className="text-xs text-blue-600">
                                    ⚖️ Weight: {formatWeightAuto(item.weightQuantity).formattedString}
                                  </div>
                                )}
                                {(() => {
                                  const parsedAddons = parseAddons(item.addons);
                                  return parsedAddons.length > 0 && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      🧩 {parsedAddons.length} addon(s) included
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                            
                            {/* HS Code */}
                            <td className="py-3 px-2 text-gray-600 font-mono text-xs">
                              {item.hsCode || '-'}
                            </td>
                            
                            {/* Serial Number */}
                            <td className="py-3 px-2 text-gray-600 font-mono text-xs">
                              {item.itemSerialNumber || '-'}
                            </td>
                            
                            {/* SRO/Schedule Number */}
                            <td className="py-3 px-2 text-gray-600 font-mono text-xs">
                              {item.sroScheduleNumber || '-'}
                            </td>
                            
                            {/* Quantity */}
                            <td className="py-3 px-2 text-center">
                              {item.isWeightBased && item.weightQuantity ? (
                                <div className="text-sm">
                                  <div>{formatWeightAuto(item.weightQuantity).formattedString}</div>
                                  <div className="text-xs text-gray-500">(Weight)</div>
                                </div>
                              ) : (
                                <div className="font-medium">{item.quantity}</div>
                              )}
                            </td>
                            
                            {/* UOM */}
                            <td className="py-3 px-2 text-center text-gray-600">
                              {item.isWeightBased ? (
                                <span className="text-xs text-gray-500">Weight-based</span>
                              ) : (
                                item.uom || '-'
                              )}
                            </td>
                            
                            {/* Unit Price */}
                            <td className="py-3 px-2 text-right">
                              {(() => {
                                const parsedAddons = parseAddons(item.addons);
                                if (parsedAddons.length > 0) {
                                  return (
                                    <div>
                                      <div className="text-sm">Base: {formatAmount(item.price)}</div>
                                      <div className="text-xs text-gray-500">
                                        +Addons: {formatAmount(parsedAddons.reduce((sum: number, addon: any) => sum + ((Number(addon.price) || 0) * (Number(addon.quantity) || 1)), 0))}
                                      </div>
                                    </div>
                                  );
                                } else if (item.isWeightBased && item.weightQuantity) {
                                  return (
                                    <div className="text-sm">
                                      {formatAmount(item.price)}
                                      <div className="text-xs text-gray-500">
                                        (for {formatWeightAuto(item.weightQuantity).formattedString})
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return formatAmount(item.price);
                                }
                              })()}
                            </td>
                            
                            {/* Total */}
                            <td className="py-3 px-2 text-right font-medium">
                              {formatAmount(item.totalPrice)}
                            </td>
                          </tr>
                          {/* Addon details row */}
                          {(() => {
                            const parsedAddons = parseAddons(item.addons);
                            return parsedAddons.length > 0 && (
                              <tr className="border-b border-gray-50 bg-gray-25">
                                <td colSpan={8} className="py-3 px-2 pl-8">
                                  <div className="text-xs text-gray-600">
                                    <div className="font-medium mb-2 text-gray-700">🧩 Addons:</div>
                                    <div className="space-y-2">
                                      {parsedAddons.map((addon: any, addonIndex: number) => {
                                      // Ensure addon has required properties
                                      const safeAddon = {
                                        addonId: addon.addonId || '',
                                        addonTitle: addon.addonTitle || addon.title || addon.name || `Addon ${addonIndex + 1}`,
                                        price: Number(addon.price) || 0,
                                        quantity: Number(addon.quantity) || 1
                                      };
                                      
                                      const addonDescription = getAddonDescription(addon);
                                      const addonImage = getAddonImage(addon);
                                      return (
                                        <div key={addonIndex} className="flex items-start justify-between">
                                          <div className="flex items-start gap-2 flex-1">
                                            {addonImage && (
                                              <img 
                                                src={addonImage} 
                                                alt={safeAddon.addonTitle}
                                                className="w-6 h-6 object-cover rounded"
                                              />
                                            )}
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-700">
                                                • {safeAddon.addonTitle} (x{safeAddon.quantity})
                                              </div>
                                              {addonDescription && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {addonDescription}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right ml-4">
                                            <div className="font-medium text-gray-700">
                                              {formatAmount(safeAddon.price)} each
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Total: {formatAmount(safeAddon.price * safeAddon.quantity)}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                        <div className="flex justify-between text-sm font-medium text-gray-700 border-t pt-2 mt-2">
                                          <span>Addons subtotal per product:</span>
                                          <span>{formatAmount(parsedAddons.reduce((sum: number, addon: any) => sum + ((Number(addon.price) || 0) * (Number(addon.quantity) || 1)), 0))}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })()}
                          
                          {/* Tax and Discount details row */}
                          {(item.taxAmount || item.taxPercentage || item.discount || item.extraTax || item.furtherTax || item.fedPayableTax || item.priceIncludingTax || item.priceExcludingTax || item.fixedNotifiedValueOrRetailPrice || item.saleType) && (
                            <tr className="border-b border-gray-50 bg-green-25">
                              <td colSpan={8} className="py-3 px-2 pl-8">
                                <div className="text-xs text-gray-600">
                                  <div className="font-medium mb-2 text-gray-700">💰 Tax & Discount Details:</div>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                    {(Number(item.taxAmount) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Tax Amount:</span>
                                        <span className="font-medium">{formatAmount(item.taxAmount || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.taxPercentage) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Tax Percentage:</span>
                                        <span className="font-medium">{Number(item.taxPercentage || 0).toFixed(2)}%</span>
                                      </div>
                                    )}
                                    {(Number(item.priceIncludingTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Price Inc. Tax:</span>
                                        <span className="font-medium">{formatAmount(item.priceIncludingTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.priceExcludingTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Price Ex. Tax:</span>
                                        <span className="font-medium">{formatAmount(item.priceExcludingTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.extraTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Extra Tax:</span>
                                        <span className="font-medium">{formatAmount(item.extraTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.furtherTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Further Tax:</span>
                                        <span className="font-medium">{formatAmount(item.furtherTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.fedPayableTax) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>FED Payable Tax:</span>
                                        <span className="font-medium">{formatAmount(item.fedPayableTax || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.discount) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Discount:</span>
                                        <span className="font-medium text-green-600">-{formatAmount(item.discount || 0)}</span>
                                      </div>
                                    )}
                                    {(Number(item.fixedNotifiedValueOrRetailPrice) || 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span>Fixed Notified Value/Retail Price:</span>
                                        <span className="font-medium">{formatAmount(item.fixedNotifiedValueOrRetailPrice || 0)}</span>
                                      </div>
                                    )}
                                    {item.saleType && item.saleType !== 'Goods at standard rate' && (
                                      <div className="flex justify-between">
                                        <span>Sale Type:</span>
                                        <span className="font-medium">{item.saleType}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500">
                          No items found for this order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="p-8 bg-gray-50">
              <div className="max-w-md ml-auto">
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span>Subtotal:</span>
                    <span>{formatAmount(order.subtotal)}</span>
                  </div>
                  
                  {parseFloat(order.taxAmount) > 0 && (
                    <div className="flex justify-between py-2">
                      <span>Tax:</span>
                      <span>{formatAmount(order.taxAmount)}</span>
                    </div>
                  )}
                  
                  {parseFloat(order.shippingAmount) > 0 && (
                    <div className="flex justify-between py-2">
                      <span>Shipping:</span>
                      <span>{formatAmount(order.shippingAmount)}</span>
                    </div>
                  )}
                  
                  {parseFloat(order.discountAmount) > 0 && (
                    <div className="flex justify-between py-2 text-green-600">
                      <span>Discount:</span>
                      <span>-{formatAmount(order.discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t-2 border-gray-300 pt-2">
                    <div className="flex justify-between py-2 text-xl font-bold">
                      <span>Total:</span>
                      <span>{formatAmount(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-200 text-center text-gray-600">
              <p className="text-sm">Thank you for your business!</p>
              <p className="text-xs mt-2">
                For questions about this invoice, please contact us at support@hisaab360.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 
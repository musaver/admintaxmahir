'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Skeleton } from '@/components/ui/skeleton';
import { 
  Printer, 
  FileText, 
  CheckCircle, 
  Building2, 
  User, 
  Calendar, 
  Package, 
  Receipt,
  ShoppingCart,
  CreditCard,
  Truck,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
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
  const [debugJson, setDebugJson] = useState<{
    orderData?: any;
    fbrPayload?: any;
    fbrError?: any;
    showDebug: boolean;
  }>({
    showDebug: false
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <Card>
            <CardHeader className="pb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
                  <div className="h-16 w-64 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 w-32 ml-auto bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-40 ml-auto bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-36 ml-auto bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Details Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>

          {/* Items Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
                      <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading invoice:</strong> {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Order not found. Please check the order ID and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const orderItems = order.items || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Print Button */}
          <div className="mb-6 print-hidden flex gap-4">
            <Button
              onClick={handlePrint}
              size="lg"
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
            
            {/* Debug JSON Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => setDebugJson(prev => ({ 
                    ...prev, 
                    orderData: order, 
                    showDebug: true 
                  }))}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View JSON Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    🔍 Debug: Order JSON Data
                  </DialogTitle>
                  <DialogDescription>
                    View the raw order data and any FBR submission details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 overflow-auto max-h-96">
                  {debugJson.orderData && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">📤 Order Data:</h4>
                      <pre className="bg-muted p-3 rounded border text-xs overflow-auto max-h-64">
                        {JSON.stringify(debugJson.orderData, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {debugJson.fbrPayload && (
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">📋 FBR JSON Payload:</h4>
                      <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-64">
                        {JSON.stringify(debugJson.fbrPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {debugJson.fbrError && (
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">❌ FBR Error Response:</h4>
                      <pre className="bg-red-50 p-3 rounded border text-xs overflow-auto max-h-64">
                        {JSON.stringify(debugJson.fbrError, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Invoice */}
          <Card className="invoice-container shadow-xl border-0 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-8 w-8" />
                    <h1 className="text-4xl font-bold tracking-tight">INVOICE</h1>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-sm font-mono bg-slate-700 text-slate-100">
                      Order: {order.orderNumber}
                    </Badge>
                    {order.invoiceRefNo && (
                      <Badge variant="outline" className="text-sm font-mono border-slate-300 text-slate-200">
                        Ref: {order.invoiceRefNo}
                      </Badge>
                    )}
                  </div>
                  {order.invoiceNumber && (
                    <Alert className="bg-emerald-50 border-emerald-200 mt-4">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-emerald-800">
                        <div className="font-semibold">FBR Digital Invoice Number</div>
                        <div className="font-mono text-lg mt-1">{order.invoiceNumber}</div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="text-right space-y-3">
                  <div className="flex items-center justify-end gap-3">
                    <Building2 className="h-6 w-6" />
                    <h2 className="text-3xl font-bold">TaxMahir</h2>
                  </div>
                  <div className="text-slate-200 space-y-1 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Office #152, WBC, Ferozpur Road, Lahore</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Phone className="h-4 w-4" />
                      <span>0321-4250013</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Mail className="h-4 w-4" />
                      <span>support@taxmahir.pk</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Invoice Details */}
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Buyer Information */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-blue-600" />
                      Buyer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                {/* Invoice Information */}
                <Card className="border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      Invoice Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                        <span className='text-sm text-gray-500'>FBR Validation:</span>
                        <div className="text-xs mt-1 p-2 bg-green-50 border border-green-200 rounded max-h-20 overflow-y-auto">
                          <div className="text-green-700 font-medium">✅ Successfully validated with FBR</div>
                          <details className="mt-1">
                            <summary className="text-xs text-green-600 cursor-pointer">View validation details</summary>
                            <div className="text-xs text-gray-600 mt-1 font-mono">
                              {order.validationResponse}
                            </div>
                          </details>
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
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            {/* Order Items */}
            <CardContent className="p-8">
              <CardTitle className="flex items-center gap-2 text-xl mb-6">
                <ShoppingCart className="h-6 w-6 text-slate-600" />
                Order Items
              </CardTitle>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Product Name</TableHead>
                      <TableHead className="text-left">HS Code</TableHead>
                      <TableHead className="text-left">Serial No.</TableHead>
                      <TableHead className="text-left">SRO/Schedule</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">UOM</TableHead>
                      <TableHead className="text-right">Price Inc. Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.length > 0 ? (
                      orderItems.map((item: any, index: number) => (
                        <React.Fragment key={index}>
                          <TableRow className="hover:bg-slate-50">
                            {/* Product Name */}
                            <TableCell className="py-4">
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
                            </TableCell>
                            
                            {/* HS Code */}
                            <TableCell className="text-gray-600 font-mono text-xs">
                              {item.hsCode || '-'}
                            </TableCell>
                            
                            {/* Serial Number */}
                            <TableCell className="text-gray-600 font-mono text-xs">
                              {item.itemSerialNumber || '-'}
                            </TableCell>
                            
                            {/* SRO/Schedule Number */}
                            <TableCell className="text-gray-600 font-mono text-xs">
                              {item.sroScheduleNumber || '-'}
                            </TableCell>
                            
                            {/* Quantity */}
                            <TableCell className="text-center">
                              {item.isWeightBased && item.weightQuantity ? (
                                <div className="text-sm">
                                  <div>{formatWeightAuto(item.weightQuantity).formattedString}</div>
                                  <div className="text-xs text-gray-500">(Weight)</div>
                                </div>
                              ) : (
                                <div className="font-medium">{item.quantity}</div>
                              )}
                            </TableCell>
                            
                            {/* UOM */}
                            <TableCell className="text-center text-gray-600">
                              {item.isWeightBased ? (
                                <span className="text-xs text-gray-500">Weight-based</span>
                              ) : (
                                item.uom || '-'
                              )}
                            </TableCell>
                            
                            {/* Price Inc. Tax */}
                            <TableCell className="text-right">
                              {(() => {
                                const parsedAddons = parseAddons(item.addons);
                                const effectivePrice = item.priceIncludingTax || item.price;
                                if (parsedAddons.length > 0) {
                                  return (
                                    <div>
                                      <div className="text-sm">Price Inc. Tax: {formatAmount(effectivePrice)}</div>
                                      <div className="text-xs text-gray-500">
                                        +Addons: {formatAmount(parsedAddons.reduce((sum: number, addon: any) => sum + ((Number(addon.price) || 0) * (Number(addon.quantity) || 1)), 0))}
                                      </div>
                                    </div>
                                  );
                                } else if (item.isWeightBased && item.weightQuantity) {
                                  return (
                                    <div className="text-sm">
                                      {formatAmount(effectivePrice)}
                                      <div className="text-xs text-gray-500">
                                        (for {formatWeightAuto(item.weightQuantity).formattedString})
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return formatAmount(effectivePrice);
                                }
                              })()}
                            </TableCell>
                            
                            {/* Total */}
                            <TableCell className="text-right font-medium">
                              {formatAmount(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                          {/* Addon details row */}
                          {(() => {
                            const parsedAddons = parseAddons(item.addons);
                            return parsedAddons.length > 0 && (
                              <TableRow className="bg-slate-25 hover:bg-slate-50">
                                <TableCell colSpan={8} className="py-3 pl-8">
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
                                  </TableCell>
                                </TableRow>
                              );
                            })()}
                          
                          {/* Tax and Discount details row */}
                          {(item.taxAmount || item.taxPercentage || item.discount || item.extraTax || item.furtherTax || item.fedPayableTax || item.priceIncludingTax || item.priceExcludingTax || item.fixedNotifiedValueOrRetailPrice || item.saleType) && (
                            <TableRow className="bg-emerald-25 hover:bg-emerald-50">
                              <TableCell colSpan={8} className="py-3 pl-8">
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
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                          No items found for this order
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {/* Product Summary */}
            <CardContent className="p-8 bg-slate-25">
              <CardTitle className="flex items-center gap-2 text-xl mb-6">
                <Package className="h-6 w-6 text-slate-600" />
                Order Summary
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items Count */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      Total Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">
                      {orderItems.reduce((total: number, item: any) => total + (Number(item.quantity) || 0), 0)}
                    </div>
                    <div className="text-xs text-gray-500">{orderItems.length} unique product(s)</div>
                  </CardContent>
                </Card>

                {/* Weight Summary */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      ⚖️ Total Weight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-700">
                      {(() => {
                        const totalWeight = orderItems.reduce((total: number, item: any) => {
                          if (item.isWeightBased && item.weightQuantity) {
                            return total + Number(item.weightQuantity);
                          }
                          return total;
                        }, 0);
                        return totalWeight > 0 ? formatWeightAuto(totalWeight).formattedString : 'N/A';
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {orderItems.filter((item: any) => item.isWeightBased).length} weight-based item(s)
                    </div>
                  </CardContent>
                </Card>

                {/* Addons Summary */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      🧩 Total Addons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">
                      {(() => {
                        const totalAddons = orderItems.reduce((total: number, item: any) => {
                          const parsedAddons = parseAddons(item.addons);
                          return total + parsedAddons.reduce((addonTotal: number, addon: any) => 
                            addonTotal + (Number(addon.quantity) || 1), 0
                          );
                        }, 0);
                        return totalAddons;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Across {orderItems.filter((item: any) => parseAddons(item.addons).length > 0).length} product(s)
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 flex gap-3 print-hidden">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Product Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>📦 Detailed Product Information</DialogTitle>
                      <DialogDescription>
                        Complete breakdown of all products, variants, and addons in this order
                      </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto max-h-96 space-y-4">
                      {orderItems.map((item: any, index: number) => (
                        <Card key={index} className="border-l-4 border-l-indigo-400">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-mono">
                                #{index + 1}
                              </span>
                              {item.productName}
                            </CardTitle>
                            {item.variantTitle && (
                              <div className="text-sm text-gray-600">Variant: {item.variantTitle}</div>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><span className="font-medium">SKU:</span> {item.sku || 'N/A'}</div>
                              <div><span className="font-medium">Quantity:</span> {item.quantity}</div>
                              <div><span className="font-medium">Price:</span> {formatAmount(item.priceIncludingTax || item.price)}</div>
                              <div><span className="font-medium">Total:</span> {formatAmount(item.totalPrice)}</div>
                              {item.hsCode && <div><span className="font-medium">HS Code:</span> {item.hsCode}</div>}
                              {item.isWeightBased && item.weightQuantity && (
                                <div><span className="font-medium">Weight:</span> {formatWeightAuto(item.weightQuantity).formattedString}</div>
                              )}
                            </div>
                            
                            {(() => {
                              const parsedAddons = parseAddons(item.addons);
                              return parsedAddons.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    🧩 Addons ({parsedAddons.length}):
                                  </div>
                                  <div className="space-y-2">
                                    {parsedAddons.map((addon: any, addonIndex: number) => (
                                      <div key={addonIndex} className="flex justify-between text-xs bg-purple-50 p-2 rounded">
                                        <span>{getAddonTitle(addon, addonIndex)} (x{addon.quantity || 1})</span>
                                        <span>{formatAmount((Number(addon.price) || 0) * (Number(addon.quantity) || 1))}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>

            {/* Totals */}
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                {/* FBR Logos - Left Side - Only show if invoice has FBR invoice number */}
                {order.invoiceNumber && (
                  <div className="flex-shrink-0 flex items-center gap-4">
                    <img 
                      src="/digital-invoicing-logo.webp" 
                      alt="FBR Digital Invoicing" 
                      className="h-20 w-auto object-contain"
                    />
                    <img 
                      src="/fbr-pakistan-logo.png" 
                      alt="FBR Pakistan" 
                      className="h-20 w-auto object-contain"
                    />
                  </div>
                )}
                
                {/* Totals - Right Side */}
                <Card className="min-w-80 shadow-lg border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                    
                    <Separator className="my-3" />
                    <div className="flex justify-between py-2 text-xl font-bold text-emerald-700">
                      <span>Total:</span>
                      <span>{formatAmount(order.totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            {/* Footer */}
            <CardContent className="p-8 text-center border-t">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-lg font-semibold">Thank you for your business!</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <p className="text-sm">
                    For questions about this invoice, please contact us at{' '}
                    <a href="mailto:support@taxmahir.pk" className="text-blue-600 hover:underline">
                      support@taxmahir.pk
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
} 
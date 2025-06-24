'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  phone?: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress1?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

interface OrderItem {
  id: string;
  productName: string;
  variantTitle?: string;
  sku?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  productImage?: string;
  addons?: Array<{
    addonId: string;
    addonTitle?: string;
    title?: string;
    name?: string;
    price: number;
    quantity: number;
  }>;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const orderStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  useEffect(() => {
    fetchOrders();
    fetchAddons();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter, dateRange]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
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

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter);
    }

    // Date range filter
    if (dateRange.startDate) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(dateRange.startDate)
      );
    }
    if (dateRange.endDate) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(dateRange.endDate)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setOrders(orders.filter(order => order.id !== id));
        } else {
          throw new Error('Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      }
    }
  };

  const getStatusBadge = (status: string, type: 'order' | 'payment' = 'order') => {
    const orderStatusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const paymentStatusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800',
    };

    const colors = type === 'order' ? orderStatusColors : paymentStatusColors;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getOrderStats = () => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
    const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;

    return { totalOrders, totalRevenue, pendingOrders, completedOrders };
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  const stats = getOrderStats();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🛒 Orders Management</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link 
            href="/orders/add" 
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ➕ Create Order
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-800">{stats.totalOrders}</div>
          <div className="text-blue-600">Total Orders</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-800">{formatCurrency(stats.totalRevenue)}</div>
          <div className="text-green-600">Total Revenue</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-800">{stats.pendingOrders}</div>
          <div className="text-yellow-600">Pending Orders</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-800">{stats.completedOrders}</div>
          <div className="text-purple-600">Completed Orders</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Order number, email, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {orderStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payment Status</option>
              {paymentStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Orders Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b p-3 text-left font-semibold">Order</th>
                <th className="border-b p-3 text-left font-semibold">Customer</th>
                <th className="border-b p-3 text-left font-semibold">Items</th>
                <th className="border-b p-3 text-left font-semibold">Total</th>
                <th className="border-b p-3 text-left font-semibold">Status</th>
                <th className="border-b p-3 text-left font-semibold">Payment</th>
                <th className="border-b p-3 text-left font-semibold">Date</th>
                <th className="border-b p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="border-b p-3">
                      <div>
                        <div className="font-medium">#{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">ID: {order.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="border-b p-3">
                      <div>
                        <div className="font-medium">
                          {order.shippingFirstName && order.shippingLastName 
                            ? `${order.shippingFirstName} ${order.shippingLastName}`
                            : order.user?.name || 'Guest'
                          }
                        </div>
                        <div className="text-sm text-gray-500">{order.email}</div>
                        {order.phone && (
                          <div className="text-sm text-gray-500">{order.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="border-b p-3">
                      <div className="text-sm">
                        {order.items && order.items.length > 0 ? (
                          <div>
                            <div className="font-medium">{order.items.length} item(s)</div>
                            <div className="text-gray-500 space-y-1">
                              {order.items.slice(0, 2).map((item, idx) => {
                                const parsedAddons = parseAddons(item.addons);
                                const isExpanded = expandedItems.has(`${order.id}-${item.id}`);
                                
                                return (
                                  <div key={idx} className="border-l-2 border-gray-200 pl-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-medium text-gray-700">
                                          {item.productName} {item.variantTitle && `(${item.variantTitle})`}
                                        </span>
                                        <span className="text-gray-500"> x{item.quantity}</span>
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {formatCurrency(item.totalPrice)}
                                      </div>
                                    </div>
                                    
                                    {parsedAddons.length > 0 && (
                                      <div className="mt-1">
                                        <button
                                          onClick={() => toggleItemExpansion(`${order.id}-${item.id}`)}
                                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                          🧩 {parsedAddons.length} addon(s)
                                          <span className="text-xs">
                                            {isExpanded ? '▼' : '▶'}
                                          </span>
                                        </button>
                                        
                                        {isExpanded && (
                                          <div className="mt-2 ml-4 space-y-1">
                                            {parsedAddons.map((addon: any, addonIndex: number) => {
                                              const safeAddon = {
                                                addonId: addon.addonId || '',
                                                addonTitle: getAddonTitle(addon, addonIndex),
                                                price: Number(addon.price) || 0,
                                                quantity: Number(addon.quantity) || 1
                                              };
                                              
                                              return (
                                                <div key={addonIndex} className="flex justify-between text-xs">
                                                  <span className="text-gray-600">
                                                    • {safeAddon.addonTitle} (x{safeAddon.quantity})
                                                  </span>
                                                  <span className="text-gray-500">
                                                    {formatCurrency(safeAddon.price * safeAddon.quantity)}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                            <div className="flex justify-between text-xs font-medium text-gray-700 border-t pt-1 mt-1">
                                              <span>Addons subtotal:</span>
                                              <span>
                                                {formatCurrency(parsedAddons.reduce((sum: number, addon: any) => 
                                                  sum + ((Number(addon.price) || 0) * (Number(addon.quantity) || 1)), 0))}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {order.items.length > 2 && (
                                <div className="text-gray-400 text-xs">
                                  ... and {order.items.length - 2} more item(s)
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No items</span>
                        )}
                      </div>
                    </td>
                    <td className="border-b p-3">
                      <div className="font-semibold">{formatCurrency(order.totalAmount, order.currency)}</div>
                      {order.discountAmount > 0 && (
                        <div className="text-sm text-green-600">
                          -{formatCurrency(order.discountAmount, order.currency)} discount
                        </div>
                      )}
                    </td>
                    <td className="border-b p-3">
                      {getStatusBadge(order.status, 'order')}
                    </td>
                    <td className="border-b p-3">
                      {getStatusBadge(order.paymentStatus, 'payment')}
                    </td>
                    <td className="border-b p-3 text-sm">
                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="border-b p-3">
                      <div className="flex gap-1">
                        <Link 
                          href={`/orders/edit/${order.id}`}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </Link>
                        <Link 
                          href={`/orders/${order.id}/invoice`}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                        >
                          Invoice
                        </Link>
                        <button 
                          onClick={() => handleDelete(order.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="border-b p-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || dateRange.startDate || dateRange.endDate
                      ? 'No orders match your filters' 
                      : 'No orders found'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CurrencySymbol from '../../components/CurrencySymbol';
import { getDateRanges } from '@/utils/profitUtils';
import { useCurrency } from '@/app/contexts/CurrencyContext';

interface SalesReportData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalTax: number;
    totalShipping: number;
    totalDiscount: number;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    email: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    createdAt: string;
    customer?: {
      name?: string;
      email: string;
    };
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  salesByStatus: Array<{
    status: string;
    count: number;
    totalRevenue: number;
  }>;
  salesByPaymentStatus: Array<{
    paymentStatus: string;
    count: number;
    totalRevenue: number;
  }>;
  dailySales: Array<{
    date: string;
    orderCount: number;
    totalRevenue: number;
  }>;
  monthlySales: Array<{
    month: string;
    orderCount: number;
    totalRevenue: number;
    averageOrderValue: number;
  }>;
}

export default function SalesReport() {
  const { currentCurrency } = useCurrency();
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const dateRanges = getDateRanges();
  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  // Helper function to safely format currency
  const formatCurrency = (amount: any) => {
    // Convert to number and handle all edge cases
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

  // Helper function for plain text currency formatting (for PDF export)
  const formatCurrencyText = (amount: any) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || amount === null || amount === undefined || typeof numAmount !== 'number') {
      return `${currentCurrency} 0.00`;
    }
    return `${currentCurrency} ${numAmount.toFixed(2)}`;
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate, selectedStatus]);

  const fetchSalesData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (selectedStatus) params.append('status', selectedStatus);
    params.append('export', 'csv');

    window.open(`/api/reports/sales?${params.toString()}`, '_blank');
  };

  const handleExportPDF = async () => {
    if (!data) return;
    
    try {
      // Dynamic import to avoid build issues
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Sales Report', 20, 20);
      
      // Date range
      if (startDate || endDate) {
        doc.setFontSize(12);
        const dateText = `Period: ${startDate || 'All time'} to ${endDate || 'Present'}`;
        doc.text(dateText, 20, 30);
      }
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 20, 45);
      doc.setFontSize(10);
      doc.text(`Total Orders: ${data.summary.totalOrders}`, 20, 55);
          doc.text(`Total Revenue: ${formatCurrencyText(data.summary.totalRevenue)}`, 20, 62);
    doc.text(`Average Order Value: ${formatCurrencyText(data.summary.averageOrderValue)}`, 20, 69);
    doc.text(`Total Tax: ${formatCurrencyText(data.summary.totalTax)}`, 20, 76);
    doc.text(`Total Shipping: ${formatCurrencyText(data.summary.totalShipping)}`, 20, 83);
    doc.text(`Total Discount: ${formatCurrencyText(data.summary.totalDiscount)}`, 20, 90);
      
      // Top Products (simplified without table plugin)
      if (data.topProducts.length > 0) {
        doc.setFontSize(14);
        doc.text('Top Products', 20, 105);
        
        let yPosition = 115;
        data.topProducts.slice(0, 10).forEach((product, index) => {
          doc.setFontSize(8);
          const productText = `${product.productName} | Qty: ${product.totalQuantity} | Revenue: ${formatCurrencyText(product.totalRevenue)}`;
          doc.text(productText, 20, yPosition);
          yPosition += 5;
          
          if (yPosition > 270) { // Prevent overflow
            return;
          }
        });
      }
      
      doc.save(`sales-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const setPresetDateRange = (preset: keyof typeof dateRanges) => {
    const range = dateRanges[preset];
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedStatus('');
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading sales data...</p>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">💵 Sales Report</h1>
          <p className="text-gray-600 mt-1">Comprehensive sales analytics and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={!data}
          >
            📊 Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={!data}
          >
            📄 Export PDF
          </button>
          <Link
            href="/reports"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Reports
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {orderStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preset Date Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(dateRanges).map(([key, range]) => (
            <button
              key={key}
              onClick={() => setPresetDateRange(key as keyof typeof dateRanges)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Active Filters Display */}
        {(startDate || endDate || selectedStatus) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Active Filters:</span>
              {startDate && ` From ${new Date(startDate).toLocaleDateString()}`}
              {endDate && ` To ${new Date(endDate).toLocaleDateString()}`}
              {selectedStatus && ` • Status: ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}`}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            Error: {error}
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{data.summary.totalOrders}</p>
                </div>
                <div className="text-3xl">🛒</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
    {formatCurrency(data.summary.totalRevenue)}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                  <p className="text-2xl font-bold text-purple-600">
    {formatCurrency(data.summary.averageOrderValue)}
                  </p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tax</p>
                  <p className="text-2xl font-bold text-orange-600">
    {formatCurrency(data.summary.totalTax)}
                  </p>
                </div>
                <div className="text-3xl">🧾</div>
              </div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales by Status */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Sales by Status</h3>
              <div className="space-y-3">
                {data.salesByStatus.map((statusData) => (
                  <div key={statusData.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(statusData.status)}`}>
                        {statusData.status.charAt(0).toUpperCase() + statusData.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">{statusData.count} orders</span>
                    </div>
                    <span className="font-medium">
{formatCurrency(statusData.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales by Payment Status */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 Sales by Payment Status</h3>
              <div className="space-y-3">
                {data.salesByPaymentStatus.map((paymentData) => (
                  <div key={paymentData.paymentStatus} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(paymentData.paymentStatus)}`}>
                        {paymentData.paymentStatus.charAt(0).toUpperCase() + paymentData.paymentStatus.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">{paymentData.count} orders</span>
                    </div>
                    <span className="font-medium">
{formatCurrency(paymentData.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Top Products by Revenue</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.topProducts.map((product, index) => (
                    <tr key={product.productId}>
                      <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{product.productName}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{product.orderCount}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{product.totalQuantity}</td>
                      <td className="px-4 py-2 text-sm font-medium text-green-600">
  {formatCurrency(product.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">📋 Recent Orders</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {data.orders.length} orders
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.orders.slice(0, 20).map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-900">
                          {order.customer?.name || 'Guest'}
                        </div>
                        <div className="text-xs text-gray-500">{order.email}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(order.paymentStatus)}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 
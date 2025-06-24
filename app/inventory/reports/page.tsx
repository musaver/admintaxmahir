'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InventoryReports() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStockAnalytics = () => {
    const total = inventory.length;
    const outOfStock = inventory.filter((item: any) => item.inventory.quantity <= 0).length;
    const lowStock = inventory.filter((item: any) => 
      item.inventory.quantity > 0 && item.inventory.quantity <= item.inventory.reorderPoint
    ).length;
    const inStock = inventory.filter((item: any) => 
      item.inventory.quantity > item.inventory.reorderPoint
    ).length;
    
    const totalValue = inventory.reduce((sum: number, item: any) => {
      const price = parseFloat(item.product?.price || '0');
      return sum + (item.inventory.quantity * price);
    }, 0);

    const averageStockLevel = total > 0 ? inventory.reduce((sum: number, item: any) => 
      sum + item.inventory.quantity, 0) / total : 0;

    return {
      total,
      outOfStock,
      lowStock,
      inStock,
      totalValue,
      averageStockLevel,
      outOfStockPercentage: total > 0 ? (outOfStock / total) * 100 : 0,
      lowStockPercentage: total > 0 ? (lowStock / total) * 100 : 0,
      inStockPercentage: total > 0 ? (inStock / total) * 100 : 0
    };
  };

  const getTopProducts = () => {
    return inventory
      .sort((a: any, b: any) => {
        const aValue = a.inventory.quantity * parseFloat(a.product?.price || '0');
        const bValue = b.inventory.quantity * parseFloat(b.product?.price || '0');
        return bValue - aValue;
      })
      .slice(0, 10);
  };

  const getLowStockItems = () => {
    return inventory.filter((item: any) => 
      item.inventory.quantity > 0 && item.inventory.quantity <= item.inventory.reorderPoint
    );
  };

  const getLocationAnalytics = () => {
    const locationMap = new Map();
    
    inventory.forEach((item: any) => {
      const location = item.inventory.location || 'Main Warehouse';
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          location,
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0
        });
      }
      
      const locationData = locationMap.get(location);
      locationData.totalItems += 1;
      locationData.totalQuantity += item.inventory.quantity;
      locationData.totalValue += item.inventory.quantity * parseFloat(item.product?.price || '0');
    });

    return Array.from(locationMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  };

  const analytics = getStockAnalytics();
  const topProducts = getTopProducts();
  const lowStockItems = getLowStockItems();
  const locationAnalytics = getLocationAnalytics();

  if (loading) return <div className="p-8 text-center">Loading reports...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Inventory Reports</h1>
        <div className="flex gap-2">
          <Link 
            href="/inventory" 
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Inventory
          </Link>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📈 Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800">{analytics.total}</div>
            <div className="text-blue-600">Total SKUs</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-800">${analytics.totalValue.toFixed(2)}</div>
            <div className="text-green-600">Total Inventory Value</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-800">{analytics.averageStockLevel.toFixed(1)}</div>
            <div className="text-purple-600">Avg Stock Level</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-800">{lowStockItems.length}</div>
            <div className="text-orange-600">Items Need Reorder</div>
          </div>
        </div>
      </div>

      {/* Stock Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Stock Status Distribution</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span>In Stock</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{analytics.inStock}</div>
                <div className="text-sm text-gray-500">{analytics.inStockPercentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${analytics.inStockPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span>Low Stock</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{analytics.lowStock}</div>
                <div className="text-sm text-gray-500">{analytics.lowStockPercentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${analytics.lowStockPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                <span>Out of Stock</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{analytics.outOfStock}</div>
                <div className="text-sm text-gray-500">{analytics.outOfStockPercentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${analytics.outOfStockPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📍 Location Analytics</h2>
          <div className="space-y-3">
            {locationAnalytics.map((location, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{location.location}</div>
                  <div className="text-sm text-gray-500">{location.totalItems} items</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${location.totalValue.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{location.totalQuantity} units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products by Value */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">💰 Top Products by Value</h2>
          <div className="space-y-3">
            {topProducts.slice(0, 8).map((item: any, index) => {
              const value = item.inventory.quantity * parseFloat(item.product?.price || '0');
              return (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      {item.inventory.quantity} units × ${parseFloat(item.product?.price || '0').toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold text-green-600">${value.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Low Stock Alert</h2>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.slice(0, 8).map((item: any, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{item.product?.name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      Current: {item.inventory.quantity} | Reorder at: {item.inventory.reorderPoint}
                    </div>
                  </div>
                  <div className="text-red-600 font-semibold text-sm">
                    {item.inventory.quantity} left
                  </div>
                </div>
              ))}
              {lowStockItems.length > 8 && (
                <div className="text-center text-sm text-gray-500 mt-3">
                  +{lowStockItems.length - 8} more items need attention
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">✅</div>
              <div>All items are well stocked!</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 Recommended Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.outOfStock > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="font-semibold text-red-800 mb-2">
                🚨 {analytics.outOfStock} Out of Stock Items
              </div>
              <div className="text-sm text-red-700">
                Immediate restocking required to avoid lost sales.
              </div>
            </div>
          )}
          
          {lowStockItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="font-semibold text-yellow-800 mb-2">
                ⚠️ {lowStockItems.length} Low Stock Items
              </div>
              <div className="text-sm text-yellow-700">
                Place reorder to maintain optimal stock levels.
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-semibold text-blue-800 mb-2">
              📈 Inventory Health: {((analytics.inStock / analytics.total) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-blue-700">
              {analytics.inStockPercentage > 70 ? 'Good inventory levels maintained.' : 'Consider reviewing reorder points.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
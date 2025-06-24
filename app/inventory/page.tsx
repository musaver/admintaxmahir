'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);
  const [updatingStockSetting, setUpdatingStockSetting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
      setFilteredInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockManagementSetting = async () => {
    try {
      const res = await fetch('/api/settings/stock-management');
      const data = await res.json();
      setStockManagementEnabled(data.stockManagementEnabled);
    } catch (err) {
      console.error('Error fetching stock management setting:', err);
    }
  };

  const toggleStockManagement = async () => {
    setUpdatingStockSetting(true);
    try {
      const res = await fetch('/api/settings/stock-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !stockManagementEnabled })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update stock management setting');
      }
      
      const data = await res.json();
      setStockManagementEnabled(data.stockManagementEnabled);
      
      alert(data.message);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUpdatingStockSetting(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchStockManagementSetting();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, stockFilter]);

  const filterInventory = () => {
    let filtered = inventory;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((item: any) =>
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.variant?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.inventory.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stock status filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter((item: any) => {
        const stockStatus = getStockStatus(item.inventory.quantity, item.inventory.reorderPoint);
        return stockStatus.status.toLowerCase().replace(' ', '') === stockFilter;
      });
    }

    setFilteredInventory(filtered);
  };

  const getStockStatus = (quantity: number, reorderPoint: number) => {
    if (quantity <= 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (quantity <= reorderPoint) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventory.map((item: any) => item.inventory.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} inventory records?`)) {
      try {
        await Promise.all(
          selectedItems.map(id => 
            fetch(`/api/inventory/${id}`, { method: 'DELETE' })
          )
        );
        setInventory(inventory.filter((item: any) => !selectedItems.includes(item.inventory.id)));
        setSelectedItems([]);
      } catch (error) {
        console.error('Error deleting inventory records:', error);
      }
    }
  };

  const handleBulkRestock = () => {
    if (selectedItems.length === 0) return;
    // This would open a modal or redirect to bulk restock page
    alert('Bulk restock functionality would be implemented here');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this inventory record?')) {
      try {
        await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
        setInventory(inventory.filter((item: any) => item.inventory.id !== id));
      } catch (error) {
        console.error('Error deleting inventory record:', error);
      }
    }
  };

  const getTotalValue = () => {
    return filteredInventory.reduce((total: number, item: any) => {
      const productPrice = parseFloat(item.product?.price || '0');
      return total + (item.inventory.quantity * productPrice);
    }, 0);
  };

  if (loading) return <div className="p-8 text-center">Loading inventory...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📦 Inventory Management</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link 
            href="/inventory/stock-movements/add" 
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ➕ Add Stock
          </Link>
          <Link 
            href="/inventory/stock-movements" 
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            📈 Stock Movements
          </Link>
          <Link 
            href="/inventory/listing" 
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            📋 Inventory Listing
          </Link>
          <Link 
            href="/inventory/reports" 
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            📊 Reports
          </Link>
          <button
            onClick={toggleStockManagement}
            disabled={updatingStockSetting}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updatingStockSetting ? 'Updating...' : stockManagementEnabled ? 'Disable Stock Management' : 'Enable Stock Management'}
          </button>
        </div>
      </div>

      {/* Stock Management Status */}
      <div className={`mb-4 p-4 border rounded-lg ${stockManagementEnabled ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-3 ${stockManagementEnabled ? 'bg-green-500' : 'bg-orange-500'}`}></span>
            <span className="font-medium">
              Stock Management: <span className={stockManagementEnabled ? 'text-green-700' : 'text-orange-700'}>
                {stockManagementEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </span>
          </div>
          <p className={`text-sm ${stockManagementEnabled ? 'text-green-600' : 'text-orange-600'}`}>
            {stockManagementEnabled 
              ? 'Orders will check and reserve inventory automatically' 
              : 'Orders can be created without stock limitations'
            }
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-800">{inventory.length}</div>
          <div className="text-blue-600">Total Items</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-800">
            {inventory.filter((item: any) => item.inventory.quantity <= 0).length}
          </div>
          <div className="text-red-600">Out of Stock</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-800">
            {inventory.filter((item: any) => 
              item.inventory.quantity > 0 && item.inventory.quantity <= item.inventory.reorderPoint
            ).length}
          </div>
          <div className="text-yellow-600">Low Stock</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-800">
            {inventory.filter((item: any) => 
              item.inventory.quantity > item.inventory.reorderPoint
            ).length}
          </div>
          <div className="text-green-600">In Stock</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-800">
            ${getTotalValue().toFixed(2)}
          </div>
          <div className="text-purple-600">Total Value</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products, variants, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Items</option>
              <option value="instock">In Stock</option>
              <option value="lowstock">Low Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Actions</label>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRestock}
                disabled={selectedItems.length === 0}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
              >
                Bulk Restock
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedItems.length === 0}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredInventory.length && filteredInventory.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="border-b p-3 text-left font-semibold">Product</th>
                <th className="border-b p-3 text-left font-semibold">Variant</th>
                <th className="border-b p-3 text-left font-semibold">Location</th>
                <th className="border-b p-3 text-left font-semibold">Total Qty</th>
                <th className="border-b p-3 text-left font-semibold">Reserved</th>
                <th className="border-b p-3 text-left font-semibold">Available</th>
                <th className="border-b p-3 text-left font-semibold">Reorder Point</th>
                <th className="border-b p-3 text-left font-semibold">Status</th>
                <th className="border-b p-3 text-left font-semibold">Value</th>
                <th className="border-b p-3 text-left font-semibold">Last Restock</th>
                <th className="border-b p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item: any) => {
                  const stockStatus = getStockStatus(item.inventory.quantity, item.inventory.reorderPoint);
                  const productPrice = parseFloat(item.product?.price || '0');
                  const itemValue = item.inventory.quantity * productPrice;
                  
                  return (
                    <tr key={item.inventory.id} className="hover:bg-gray-50">
                      <td className="border-b p-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.inventory.id)}
                          onChange={() => handleSelectItem(item.inventory.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="border-b p-3">
                        <div className="font-medium">{item.product?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">SKU: {item.product?.sku || 'N/A'}</div>
                      </td>
                      <td className="border-b p-3">{item.variant?.title || 'Base Product'}</td>
                      <td className="border-b p-3">{item.inventory.location || 'Main Warehouse'}</td>
                      <td className="border-b p-3">
                        <span className="font-semibold">{item.inventory.quantity}</span>
                      </td>
                      <td className="border-b p-3 text-orange-600">{item.inventory.reservedQuantity}</td>
                      <td className="border-b p-3 text-green-600 font-semibold">{item.inventory.availableQuantity}</td>
                      <td className="border-b p-3">{item.inventory.reorderPoint}</td>
                      <td className="border-b p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="border-b p-3 font-semibold">${itemValue.toFixed(2)}</td>
                      <td className="border-b p-3 text-sm">
                        {item.inventory.lastRestockDate 
                          ? new Date(item.inventory.lastRestockDate).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="border-b p-3">
                        <div className="flex gap-1">
                          <Link 
                            href={`/inventory/edit/${item.inventory.id}`}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </Link>
                          <Link 
                            href={`/inventory/restock/${item.inventory.id}`}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                          >
                            Restock
                          </Link>
                          <button 
                            onClick={() => handleDelete(item.inventory.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="border-b p-8 text-center text-gray-500">
                    {searchTerm || stockFilter !== 'all' 
                      ? 'No inventory records match your filters' 
                      : 'No inventory records found'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            <span className="font-semibold">{selectedItems.length}</span> items selected
          </p>
        </div>
      )}
    </div>
  );
} 
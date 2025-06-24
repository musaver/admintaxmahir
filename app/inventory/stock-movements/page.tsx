'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface StockMovement {
  id: string;
  productName: string;
  variantTitle?: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  location: string;
  createdAt: string;
  reference?: string;
}

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementFilter, setMovementFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStockMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, searchTerm, movementFilter, dateRange]);

  const fetchStockMovements = async () => {
    setLoading(true);
    try {
      // This would be a new API endpoint for stock movements
      const res = await fetch('/api/inventory/stock-movements');
      const data = await res.json();
      setMovements(data);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      // For now, use mock data
      setMovements([
        {
          id: '1',
          productName: 'Sample Product',
          variantTitle: 'Red - Large',
          movementType: 'in',
          quantity: 50,
          reason: 'Initial stock',
          location: 'Warehouse A',
          createdAt: new Date().toISOString(),
          reference: 'PO-001'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = movements;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(movement =>
        movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.variantTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Movement type filter
    if (movementFilter !== 'all') {
      filtered = filtered.filter(movement => movement.movementType === movementFilter);
    }

    // Date range filter
    if (dateRange.startDate) {
      filtered = filtered.filter(movement => 
        new Date(movement.createdAt) >= new Date(dateRange.startDate)
      );
    }
    if (dateRange.endDate) {
      filtered = filtered.filter(movement => 
        new Date(movement.createdAt) <= new Date(dateRange.endDate)
      );
    }

    setFilteredMovements(filtered);
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'in': return '📈';
      case 'out': return '📉';
      case 'adjustment': return '🔧';
      default: return '📦';
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'adjustment': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTotalMovements = () => {
    return {
      in: filteredMovements.filter(m => m.movementType === 'in').reduce((sum, m) => sum + m.quantity, 0),
      out: filteredMovements.filter(m => m.movementType === 'out').reduce((sum, m) => sum + m.quantity, 0),
      adjustments: filteredMovements.filter(m => m.movementType === 'adjustment').length
    };
  };

  if (loading) return <div className="p-8 text-center">Loading stock movements...</div>;

  const totals = getTotalMovements();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Stock Movements</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchStockMovements}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link 
            href="/inventory/stock-movements/add" 
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ➕ Add Stock Movement
          </Link>
          <Link 
            href="/inventory" 
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            ← Back to Inventory
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">{filteredMovements.length}</div>
              <div className="text-gray-600">Total Movements</div>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-800">+{totals.in}</div>
              <div className="text-green-600">Stock In</div>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-800">-{totals.out}</div>
              <div className="text-red-600">Stock Out</div>
            </div>
            <div className="text-3xl">📉</div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-800">{totals.adjustments}</div>
              <div className="text-blue-600">Adjustments</div>
            </div>
            <div className="text-3xl">🔧</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products, reasons, references..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Movement Type</label>
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Movements</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustments</option>
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
      
      {/* Movements Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b p-3 text-left font-semibold">Date</th>
                <th className="border-b p-3 text-left font-semibold">Product</th>
                <th className="border-b p-3 text-left font-semibold">Variant</th>
                <th className="border-b p-3 text-left font-semibold">Type</th>
                <th className="border-b p-3 text-left font-semibold">Quantity</th>
                <th className="border-b p-3 text-left font-semibold">Reason</th>
                <th className="border-b p-3 text-left font-semibold">Location</th>
                <th className="border-b p-3 text-left font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length > 0 ? (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="border-b p-3 text-sm">
                      {new Date(movement.createdAt).toLocaleDateString()} <br />
                      <span className="text-gray-500">
                        {new Date(movement.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="border-b p-3">
                      <div className="font-medium">{movement.productName}</div>
                    </td>
                    <td className="border-b p-3">{movement.variantTitle || 'Base Product'}</td>
                    <td className="border-b p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.movementType)}`}>
                        {getMovementTypeIcon(movement.movementType)} {movement.movementType.toUpperCase()}
                      </span>
                    </td>
                    <td className="border-b p-3">
                      <span className={`font-semibold ${
                        movement.movementType === 'in' ? 'text-green-600' : 
                        movement.movementType === 'out' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {movement.movementType === 'in' ? '+' : movement.movementType === 'out' ? '-' : '±'}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="border-b p-3">{movement.reason}</td>
                    <td className="border-b p-3">{movement.location}</td>
                    <td className="border-b p-3">{movement.reference || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="border-b p-8 text-center text-gray-500">
                    {searchTerm || movementFilter !== 'all' || dateRange.startDate || dateRange.endDate
                      ? 'No stock movements match your filters' 
                      : 'No stock movements recorded yet'
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
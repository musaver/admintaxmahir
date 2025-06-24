'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  customers: number;
  products: number;
  categories: number;
  orders: number;
  adminUsers: number;
  dateRange?: {
    startDate: string | null;
    endDate: string | null;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    products: 0,
    categories: 0,
    orders: 0,
    adminUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = () => {
    fetchStats();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    // Fetch stats without date filters
    setTimeout(() => fetchStats(), 100);
  };

  const setPresetDates = (preset: string) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (preset) {
      case 'today':
        setStartDate(startOfToday.toISOString().split('T')[0]);
        setEndDate(startOfToday.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekAgo = new Date(startOfToday);
        weekAgo.setDate(weekAgo.getDate() - 7);
        setStartDate(weekAgo.toISOString().split('T')[0]);
        setEndDate(startOfToday.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthAgo = new Date(startOfToday);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setStartDate(monthAgo.toISOString().split('T')[0]);
        setEndDate(startOfToday.toISOString().split('T')[0]);
        break;
    }
    setTimeout(() => fetchStats(), 100);
  };
  
  const cards = [
    { 
      title: 'Customers', 
      count: loading ? '...' : stats.customers.toString(), 
      link: '/customers',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      icon: '👥'
    },
    { 
      title: 'Services', 
      count: loading ? '...' : stats.products.toString(), 
      link: '/products',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      icon: '📦'
    },
    { 
      title: 'Categories', 
      count: loading ? '...' : stats.categories.toString(), 
      link: '/categories',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      icon: '📂'
    },
    { 
      title: 'Orders', 
      count: loading ? '...' : stats.orders.toString(), 
      link: '/orders',
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      icon: '🛒'
    },
    { 
      title: 'Admin Users', 
      count: loading ? '...' : stats.adminUsers.toString(), 
      link: '/admins',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      icon: '👨‍💼'
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Date Filters */}
      <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Filter by Date Range</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          
          <div className="flex items-end">
            <button
              onClick={handleDateFilterChange}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Apply Filter
            </button>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPresetDates('today')}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setPresetDates('week')}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPresetDates('month')}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
          >
            Last 30 Days
          </button>
        </div>

        {/* Active Filter Display */}
        {(startDate || endDate) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Active Filter:</span> 
              {startDate && ` From ${new Date(startDate).toLocaleDateString()}`}
              {endDate && ` To ${new Date(endDate).toLocaleDateString()}`}
              {!startDate && endDate && ` Up to ${new Date(endDate).toLocaleDateString()}`}
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            Error loading dashboard statistics: {error}
          </div>
        </div>
      )}
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {cards.map((card) => (
          <div 
            key={card.title} 
            className="border rounded-xl shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => router.push(card.link)}
          >
            <div className={`${card.color} ${card.hoverColor} text-white p-4 rounded-t-xl transition-colors`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{card.title}</h2>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
            <div className="p-6 bg-white rounded-b-xl">
              <p className="text-4xl font-bold text-gray-800 mb-2">{card.count}</p>
              <p className="text-sm text-gray-500">Total records</p>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Link Section */}
      
    </div>
  );
}

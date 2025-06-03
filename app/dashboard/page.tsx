// app/dashboard/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ZoomLinkForm from '../components/ZoomLinkForm';

interface DashboardStats {
  users: number;
  courses: number;
  orders: number;
  adminUsers: number;
  attendance: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    courses: 0,
    orders: 0,
    adminUsers: 0,
    attendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/dashboard/stats');
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
  
  const cards = [
    { 
      title: 'Users', 
      count: loading ? '...' : stats.users.toString(), 
      link: '/users',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      icon: '👥'
    },
    { 
      title: 'Courses', 
      count: loading ? '...' : stats.courses.toString(), 
      link: '/courses',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      icon: '📚'
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
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      icon: '👨‍💼'
    },
    { 
      title: 'Attendance', 
      count: loading ? '...' : stats.attendance.toString(), 
      link: '/attendance',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      icon: '📅'
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

      {/* Statistics Summary */}
      {!loading && !error && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">📊 Quick Summary</h3>
          <p className="text-gray-600">
            Total system entities: <span className="font-bold text-blue-600">
              {stats.users + stats.courses + stats.orders + stats.adminUsers + stats.attendance}
            </span> records
          </p>
        </div>
      )}

      {/* Zoom Link Section */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔗 Zoom Link Management</h2>
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <ZoomLinkForm />
        </div>
      </div>
    </div>
  );
}

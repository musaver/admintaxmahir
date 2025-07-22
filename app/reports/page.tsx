'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReportsHub() {
  const router = useRouter();

  const reportCategories = [
    {
      title: '💰 Financial Reports',
      description: 'Revenue, costs, and profitability analysis',
      reports: [
        {
          title: 'Profit & Loss Report',
          description: 'Analyze profitability and margins across all orders',
          href: '/reports/profits',
          icon: '📈',
          color: 'bg-green-500 hover:bg-green-600'
        },
        {
          title: 'Sales Report',
          description: 'Comprehensive sales analytics and trends',
          href: '/reports/sales',
          icon: '💵',
          color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
          title: 'Revenue Analytics',
          description: 'Revenue trends and performance metrics',
          href: '/reports/revenue',
          icon: '📊',
          color: 'bg-purple-500 hover:bg-purple-600'
        }
      ]
    },
    {
      title: '🛒 Order Reports',
      description: 'Order performance and customer analytics',
      reports: [
        {
          title: 'Order Analytics',
          description: 'Order patterns, status distribution, and trends',
          href: '/reports/orders',
          icon: '🛍️',
          color: 'bg-orange-500 hover:bg-orange-600'
        },
        {
          title: 'Customer Analytics',
          description: 'Customer behavior and purchase patterns',
          href: '/reports/customers',
          icon: '👥',
          color: 'bg-indigo-500 hover:bg-indigo-600'
        }
      ]
    },
    {
      title: '📦 Product Reports',
      description: 'Product performance and inventory insights',
      reports: [
        {
          title: 'Product Performance',
          description: 'Top products, categories, and performance metrics',
          href: '/reports/products',
          icon: '📈',
          color: 'bg-teal-500 hover:bg-teal-600'
        },
        {
          title: 'Inventory Reports',
          description: 'Stock levels, movements, and valuation',
          href: '/inventory/reports',
          icon: '📋',
          color: 'bg-cyan-500 hover:bg-cyan-600'
        }
      ]
    }
  ];

  const quickStats = [
    {
      title: 'Total Reports',
      value: reportCategories.reduce((acc, cat) => acc + cat.reports.length, 0),
      icon: '📊',
      color: 'text-blue-600'
    },
    {
      title: 'Categories',
      value: reportCategories.length,
      icon: '📂',
      color: 'text-green-600'
    },
    {
      title: 'Export Formats',
      value: 'CSV, PDF',
      icon: '📤',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive business intelligence and reporting dashboard
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Categories */}
      <div className="space-y-8">
        {reportCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-white rounded-xl shadow-lg border p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {category.title}
              </h2>
              <p className="text-gray-600">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.reports.map((report, reportIndex) => (
                <div
                  key={reportIndex}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(report.href)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{report.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {report.description}
                      </p>
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${report.color} transition-colors`}>
                          View Report →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Features Overview */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">✨ Report Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">Real-time data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">Date range filtering</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">CSV export</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">Interactive charts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">Profit analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">Product insights</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">Customer analytics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-green-500">✅</div>
            <span className="text-sm text-gray-700">Mobile responsive</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/reports/profits')}
            className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div className="text-green-600 font-medium">📈 Today's Profits</div>
            <div className="text-sm text-gray-600">Quick profit overview</div>
          </button>
          
          <button 
            onClick={() => router.push('/reports/sales')}
            className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <div className="text-blue-600 font-medium">💵 This Month's Sales</div>
            <div className="text-sm text-gray-600">Monthly performance</div>
          </button>
          
          <button 
            onClick={() => router.push('/inventory/reports')}
            className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <div className="text-purple-600 font-medium">📦 Inventory Status</div>
            <div className="text-sm text-gray-600">Stock overview</div>
          </button>
          
          <button 
            onClick={() => router.push('/orders')}
            className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <div className="text-orange-600 font-medium">🛒 Recent Orders</div>
            <div className="text-sm text-gray-600">Latest transactions</div>
          </button>
        </div>
      </div>
    </div>
  );
} 
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Package, ShoppingCart, FolderOpen, TrendingUp, DollarSign, Activity, Calendar } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  
  const cards = [
    { 
      title: 'Customers', 
      count: '0', 
      link: '/admin/users',
      icon: Users,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      bgGradient: 'from-blue-500/20 via-cyan-500/15 to-teal-500/20',
      borderGradient: 'from-blue-500/40 to-cyan-500/40',
      shadowColor: 'shadow-blue-500/30',
      description: 'Manage your customer base'
    },
    { 
      title: 'Products', 
      count: '0', 
      link: '/admin/products',
      icon: Package,
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      bgGradient: 'from-purple-500/20 via-pink-500/15 to-rose-500/20',
      borderGradient: 'from-purple-500/40 to-pink-500/40',
      shadowColor: 'shadow-purple-500/30',
      description: 'Inventory and product catalog'
    },
    { 
      title: 'Orders', 
      count: '0', 
      link: '/admin/orders',
      icon: ShoppingCart,
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      bgGradient: 'from-green-500/20 via-emerald-500/15 to-teal-500/20',
      borderGradient: 'from-green-500/40 to-emerald-500/40',
      shadowColor: 'shadow-green-500/30',
      description: 'Track sales and orders'
    },
    { 
      title: 'Categories', 
      count: '0', 
      link: '/admin/categories',
      icon: FolderOpen,
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      bgGradient: 'from-orange-500/20 via-red-500/15 to-pink-500/20',
      borderGradient: 'from-orange-500/40 to-red-500/40',
      shadowColor: 'shadow-orange-500/30',
      description: 'Organize product categories'
    },
  ];

  const statsCards = [
    {
      title: 'Total Revenue',
      value: '$0.00',
      change: '+0%',
      icon: DollarSign,
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
      bgGradient: 'from-green-500/25 via-emerald-400/20 to-teal-500/25',
      shadowColor: 'shadow-green-500/40',
      description: 'Total earnings this period'
    },
    {
      title: 'Growth Rate',
      value: '0%',
      change: '+0%',
      icon: TrendingUp,
      gradient: 'from-blue-400 via-cyan-500 to-sky-600',
      bgGradient: 'from-blue-500/25 via-cyan-400/20 to-sky-500/25',
      shadowColor: 'shadow-blue-500/40',
      description: 'Business growth metrics'
    },
    {
      title: 'Active Users',
      value: '0',
      change: '+0%',
      icon: Activity,
      gradient: 'from-purple-400 via-pink-500 to-rose-600',
      bgGradient: 'from-purple-500/25 via-pink-400/20 to-rose-500/25',
      shadowColor: 'shadow-purple-500/40',
      description: 'Currently active users'
    },
    {
      title: 'This Month',
      value: '0',
      change: '+0%',
      icon: Calendar,
      gradient: 'from-orange-400 via-red-500 to-pink-600',
      bgGradient: 'from-orange-500/25 via-red-400/20 to-pink-500/25',
      shadowColor: 'shadow-orange-500/40',
      description: 'Monthly performance'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl blur-3xl"></div>
        
        <div className="relative z-10 p-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 leading-tight">
            Welcome to Tax Mahir Admin
          </h1>
          <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-xl mb-6">
            Manage your business with style and efficiency
          </p>
          
          {/* Floating elements */}
          <div className="flex justify-center gap-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-60"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-60"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative group cursor-pointer"
          >
            {/* Background gradient glow */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-500`}></div>
            
            <div className={`relative bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 dark:border-gray-700/30 light:border-gray-200/30 hover:border-transparent transition-all duration-500 hover:shadow-2xl ${stat.shadowColor} group-hover:scale-105 overflow-hidden`}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-full -ml-8 -mb-8"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-sm font-semibold tracking-wide uppercase">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-white dark:text-white light:text-gray-900">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-emerald-400 text-sm font-semibold">{stat.change}</p>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs">
                    {stat.description}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-2xl ${stat.shadowColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <stat.icon className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20, rotateX: 45 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: index * 0.15 + 0.4, type: "spring", stiffness: 100 }}
            className="relative group cursor-pointer perspective-1000"
            onClick={() => router.push(card.link)}
          >
            {/* Glowing background effect */}
            <div className={`absolute -inset-2 bg-gradient-to-r ${card.gradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-700`}></div>
            
            <div className={`relative bg-gradient-to-br ${card.bgGradient} backdrop-blur-lg rounded-3xl p-8 border-2 ${card.borderGradient} border-gradient-to-r hover:border-transparent transition-all duration-500 hover:shadow-2xl ${card.shadowColor} group-hover:scale-105 group-hover:-translate-y-2 overflow-hidden`}>
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000`}></div>
                <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr ${card.gradient} rounded-full -ml-12 -mb-12 group-hover:scale-125 transition-transform duration-1000 delay-200`}></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-2xl ${card.shadowColor} group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                    <card.icon className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-white dark:text-white light:text-gray-900 group-hover:scale-110 transition-transform duration-300">
                      {card.count}
                    </p>
                    <div className="w-8 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full mt-2 group-hover:via-white/80 transition-all duration-500"></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white dark:text-white light:text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-200 group-hover:bg-clip-text transition-all duration-500">
                    {card.title}
                  </h3>
                  <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-sm font-medium">
                    {card.description}
                  </p>
                  
                  {/* Action indicator */}
                  <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                    <div className="w-2 h-2 bg-gradient-to-r from-white to-gray-300 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-300 font-semibold tracking-wider uppercase">Click to manage</span>
                  </div>
                </div>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="relative overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        
        <div className="relative bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-800/60 light:from-white/80 light:via-gray-50/60 light:to-white/80 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/30 dark:border-gray-700/30 light:border-gray-200/30 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Recent Activity
            </h2>
          </div>
          
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="relative group"
            >
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/15 to-teal-500/20 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                {/* Animated status indicator */}
                <div className="relative">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full shadow-lg"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-ping opacity-30"></div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-white dark:text-white light:text-gray-900 font-semibold">
                    System initialized successfully
                  </p>
                  <p className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-sm">
                    Welcome to Tax Mahir Admin Panel - All systems operational
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-400 font-medium uppercase tracking-wide">Live</span>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <span className="text-gray-300 dark:text-gray-300 light:text-gray-600 text-sm font-medium">Just now</span>
                  <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-transparent rounded-full"></div>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 rounded-2xl transition-all duration-300"></div>
              </div>
            </motion.div>
            
            {/* Additional activity items with different colors */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="relative group"
            >
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-500/15 via-cyan-500/10 to-sky-500/15 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/15">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-60"></div>
                <div className="flex-1">
                  <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 font-medium">
                    Dashboard loaded with modern styling
                  </p>
                  <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">
                    Enhanced UI with gradients and animations
                  </p>
                </div>
                <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm">2 min ago</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminTopHeader } from '@/components/AdminTopHeader';
import { ThemeColor } from '@/components/ThemeColorSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { User, LogOut, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filteredNavigation, setFilteredNavigation] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { themeColor, setThemeColor } = useTheme();

  const handleNavigationFilter = (filtered: any[]) => {
    setFilteredNavigation(filtered);
    
    // Auto-expand items that have sub-items when searching
    const itemsToExpand: string[] = [];
    filtered.forEach(item => {
      if (item.hasSubItems && item.subItems && item.subItems.length > 0) {
        itemsToExpand.push(item.name);
      }
    });
    
    if (itemsToExpand.length > 0) {
      setExpandedItems(prev => [...new Set([...prev, ...itemsToExpand])]);
    }
  };

  const handleThemeColorChange = (color: ThemeColor) => {
    setThemeColor(color.id);
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Initialize filtered navigation on first render
  React.useEffect(() => {
    if (filteredNavigation.length === 0) {
      setFilteredNavigation(navigation);
    }
    
    // Auto-expand parent items if current path matches a sub-item
    navigation.forEach(item => {
      if (item.hasSubItems && item.subItems) {
        const hasActiveSubItem = item.subItems.some((subItem: any) => pathname.startsWith(subItem.href));
        if (hasActiveSubItem && !expandedItems.includes(item.name)) {
          setExpandedItems(prev => [...prev, item.name]);
        }
      }
    });
  }, [pathname]);

  // Use filtered navigation if available, otherwise use all navigation
  const displayNavigation = filteredNavigation.length > 0 ? filteredNavigation : navigation;

  // Helper function to check if any subitem is active
  const isParentActive = (item: any) => {
    if (pathname.startsWith(item.href)) return true;
    if (item.subItems) {
      return item.subItems.some((subItem: any) => pathname.startsWith(subItem.href));
    }
    return false;
  };

  // Helper function to render navigation item
  const renderNavigationItem = (item: any, index: number, isMobile: boolean = false) => {
    const isExpanded = expandedItems.includes(item.name);
    const isActive = isParentActive(item);
    
    return (
      <motion.div
        key={item.name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        {/* Main navigation item */}
        <div className="relative">
          {item.hasSubItems ? (
            <button
              onClick={() => toggleExpanded(item.name)}
              className={`w-full flex items-center px-4 py-3 text-base rounded-lg transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-3 text-lg z-10 relative">{item.icon}</span>
              <span className="font-medium z-10 relative flex-1 text-left">{item.name}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="z-10 relative"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full z-10 relative mr-2"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
            </button>
          ) : (
            <Link
              href={item.href}
              className={`flex items-center px-4 py-3 text-base rounded-lg transition-all duration-300 group relative overflow-hidden ${
                pathname.startsWith(item.href)
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <span className="mr-3 text-lg z-10 relative">{item.icon}</span>
              <span className="font-medium z-10 relative">{item.name}</span>
              {pathname.startsWith(item.href) && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full z-10 relative"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
            </Link>
          )}
        </div>

        {/* Sub-items */}
        {item.hasSubItems && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-4"
              >
                {item.subItems.map((subItem: any, subIndex: number) => (
                  <motion.div
                    key={subItem.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: subIndex * 0.05 }}
                  >
                    <Link
                      href={subItem.href}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-300 group ${
                        pathname.startsWith(subItem.href)
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => isMobile && setSidebarOpen(false)}
                    >
                      <span className="mr-2 text-sm">{subItem.icon}</span>
                      <span className="font-medium">{subItem.name}</span>
                      {pathname.startsWith(subItem.href) && (
                        <div className="ml-auto w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    );
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Customers', href: '/admin/users', icon: '👥' },
    { 
      name: 'Products', 
      href: '/admin/products', 
      icon: '📦',
      hasSubItems: true,
      subItems: [
        { name: 'All Products', href: '/admin/products', icon: '📦' },
        { name: 'Categories', href: '/admin/categories', icon: '📂' },
        { name: 'Inventory', href: '/inventory', icon: '📈' },
        { name: 'Inventory Listing', href: '/inventory/listing', icon: '📋' },
      ]
    },
    { name: 'Tags', href: '/tags', icon: '🏷️' },
    { name: 'Tag Groups', href: '/tag-groups', icon: '📑' },
    /*{ name: 'Addons', href: '/admin/addons', icon: '🧩' },
    { name: 'Variation Attributes', href: '/admin/variation-attributes', icon: '🏷️' },
    { name: 'Product Variants', href: '/admin/product-variants', icon: '🔧' },*/
    { name: 'Orders', href: '/admin/orders', icon: '🛒' },
    /*{ name: 'Returns', href: '/admin/returns', icon: '↩️' },
    { name: 'Refunds', href: '/admin/refunds', icon: '💰' },
    { name: 'Shipping Labels', href: '/admin/shipping-labels', icon: '🏷️' },
    { name: 'Admin Users', href: '/admin/admins', icon: '👮' },
    { name: 'Admin Roles', href: '/admin/roles', icon: '🔐' },
    { name: 'Admin Logs', href: '/admin/logs', icon: '📋' },*/
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Top Header */}
      <AdminTopHeader />

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-20 left-0 right-0 z-40 flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-all duration-300"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tax Mahir Admin</h1>
          </div>
        </div>
        <ThemeToggle />
      </div>
      
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-30 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
        <motion.div 
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-y-0 left-0 w-64 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl"
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pt-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tax Mahir</h2>
            </div>
            <button 
              type="button" 
              className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300" 
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1" style={{ overflowY: 'auto' }}>
            {displayNavigation.map((item, index) => renderNavigationItem(item, index, true))}
          </nav>
        </motion.div>
      </div>
      
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 pt-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">T</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tax Mahir</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1" style={{ overflowY: 'auto' }}>
            {displayNavigation.map((item, index) => renderNavigationItem(item, index, false))}
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@taxmahir.com</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="pt-20 min-h-screen">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[calc(100vh-8rem)]">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
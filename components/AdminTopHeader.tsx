'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AdminTopHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-lg"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Business Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <img src="/taxmahirlogo.png" alt="Tax Mahir" className="w-10 h-10 p-2" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tax Mahir</h1>
            <p className="text-sm text-muted-foreground">Business Management</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile */}
          <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground">Admin</p>
              <p className="text-xs text-muted-foreground">admin@taxmahir.com</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

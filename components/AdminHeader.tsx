'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeColorSelector, ThemeColor } from '@/components/ThemeColorSelector';
import { Input } from '@/components/ui/input';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

interface AdminHeaderProps {
  navigation: NavigationItem[];
  onNavigationFilter: (filteredItems: NavigationItem[]) => void;
  selectedThemeColor: string;
  onThemeColorChange: (color: ThemeColor) => void;
}

export function AdminHeader({ 
  navigation, 
  onNavigationFilter, 
  selectedThemeColor, 
  onThemeColorChange 
}: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter navigation items based on search query
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) {
      return navigation;
    }

    const filtered: any[] = [];
    
    navigation.forEach(item => {
      // Check if main item matches
      const mainItemMatches = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Check if any sub-items match
      let matchingSubItems: any[] = [];
      if (item.subItems) {
        matchingSubItems = item.subItems.filter((subItem: any) =>
          subItem.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Include item if main item matches or has matching sub-items
      if (mainItemMatches || matchingSubItems.length > 0) {
        if (item.subItems) {
          // Include the parent with filtered sub-items
          filtered.push({
            ...item,
            subItems: matchingSubItems.length > 0 ? matchingSubItems : item.subItems
          });
        } else {
          filtered.push(item);
        }
      }
    });

    return filtered;
  }, [navigation, searchQuery]);

  // Update parent component when filtered results change
  React.useEffect(() => {
    onNavigationFilter(filteredNavigation);
  }, [filteredNavigation, onNavigationFilter]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 light:from-white/95 light:via-gray-50/95 light:to-white/95 backdrop-blur-xl border-b border-gray-700/50 dark:border-gray-700/50 light:border-gray-200/50 shadow-2xl shadow-black/20"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search Section */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-400 light:text-gray-500" />
              </div>
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages... (⌘K)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`pl-10 pr-10 bg-gray-800/50 dark:bg-gray-800/50 light:bg-gray-100/50 border-gray-700/50 dark:border-gray-700/50 light:border-gray-200/50 text-white dark:text-white light:text-gray-900 placeholder-gray-400 dark:placeholder-gray-400 light:placeholder-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300 ${
                  isSearchFocused ? 'ring-2 ring-purple-500/20' : ''
                }`}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-300 light:text-gray-500 light:hover:text-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Results Counter */}
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute mt-2 px-3 py-1 bg-gray-800/90 dark:bg-gray-800/90 light:bg-white/90 backdrop-blur-sm rounded-lg border border-gray-700/50 dark:border-gray-700/50 light:border-gray-200/50 shadow-lg"
              >
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                  {filteredNavigation.length} page{filteredNavigation.length !== 1 ? 's' : ''} found
                  {filteredNavigation.length === 0 && ' - try a different search term'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Right Section - Theme Controls */}
          <div className="flex items-center gap-3">
            {/* Keyboard Shortcut Hint */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800/30 dark:bg-gray-800/30 light:bg-gray-100/50 rounded-lg border border-gray-700/30 dark:border-gray-700/30 light:border-gray-200/30">
              <Command className="w-3 h-3 text-gray-400 dark:text-gray-400 light:text-gray-500" />
              <span className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-500">K</span>
            </div>

            {/* Theme Color Selector */}
            <ThemeColorSelector
              selectedColor={selectedThemeColor}
              onColorChange={onThemeColorChange}
            />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Active Search Indicator */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-700/30 dark:border-gray-700/30 light:border-gray-200/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
                Filtering sidebar for: <span className="text-purple-400 font-medium">"{searchQuery}"</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="text-xs text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white light:text-gray-500 light:hover:text-gray-900 ml-auto"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

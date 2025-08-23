'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ThemeColor {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  gradient: string;
  preview: string;
}

const themeColors: ThemeColor[] = [
  {
    id: 'purple-blue',
    name: 'Purple Blue',
    primary: 'from-purple-600 to-blue-600',
    secondary: 'from-purple-500/20 to-blue-500/20',
    gradient: 'from-purple-500 to-blue-500',
    preview: 'bg-gradient-to-r from-purple-500 to-blue-500'
  },
  {
    id: 'green-emerald',
    name: 'Green Emerald',
    primary: 'from-green-600 to-emerald-600',
    secondary: 'from-green-500/20 to-emerald-500/20',
    gradient: 'from-green-500 to-emerald-500',
    preview: 'bg-gradient-to-r from-green-500 to-emerald-500'
  },
  {
    id: 'orange-red',
    name: 'Orange Red',
    primary: 'from-orange-600 to-red-600',
    secondary: 'from-orange-500/20 to-red-500/20',
    gradient: 'from-orange-500 to-red-500',
    preview: 'bg-gradient-to-r from-orange-500 to-red-500'
  },
  {
    id: 'cyan-blue',
    name: 'Cyan Blue',
    primary: 'from-cyan-600 to-blue-600',
    secondary: 'from-cyan-500/20 to-blue-500/20',
    gradient: 'from-cyan-500 to-blue-500',
    preview: 'bg-gradient-to-r from-cyan-500 to-blue-500'
  },
  {
    id: 'pink-rose',
    name: 'Pink Rose',
    primary: 'from-pink-600 to-rose-600',
    secondary: 'from-pink-500/20 to-rose-500/20',
    gradient: 'from-pink-500 to-rose-500',
    preview: 'bg-gradient-to-r from-pink-500 to-rose-500'
  },
  {
    id: 'indigo-purple',
    name: 'Indigo Purple',
    primary: 'from-indigo-600 to-purple-600',
    secondary: 'from-indigo-500/20 to-purple-500/20',
    gradient: 'from-indigo-500 to-purple-500',
    preview: 'bg-gradient-to-r from-indigo-500 to-purple-500'
  }
];

interface ThemeColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: ThemeColor) => void;
}

export function ThemeColorSelector({ selectedColor, onColorChange }: ThemeColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentColor = themeColors.find(color => color.id === selectedColor) || themeColors[0];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300"
      >
        <div className={`h-4 w-4 rounded-full ${currentColor.preview} shadow-lg`}></div>
        <span className="sr-only">Select theme color</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Color Selector Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 z-50 w-72 bg-gray-800/95 dark:bg-gray-800/95 light:bg-white/95 backdrop-blur-md rounded-2xl border border-gray-700/50 dark:border-gray-700/50 light:border-gray-200/50 shadow-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50 dark:border-gray-700/50 light:border-gray-200/50">
                <Palette className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white dark:text-white light:text-gray-900">
                  Theme Colors
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {themeColors.map((color) => (
                  <motion.button
                    key={color.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onColorChange(color);
                      setIsOpen(false);
                    }}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-300 group ${
                      selectedColor === color.id
                        ? 'border-white/30 bg-gray-700/50 dark:border-white/30 dark:bg-gray-700/50 light:border-gray-400/50 light:bg-gray-100/50'
                        : 'border-gray-700/30 hover:border-gray-600/50 dark:border-gray-700/30 dark:hover:border-gray-600/50 light:border-gray-200/50 light:hover:border-gray-300/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${color.preview} shadow-lg flex items-center justify-center`}>
                        {selectedColor === color.id && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white dark:text-white light:text-gray-900">
                          {color.name}
                        </p>
                        <div className={`h-1 w-12 rounded-full ${color.preview} mt-1`}></div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700/50 dark:border-gray-700/50 light:border-gray-200/50">
                <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 text-center">
                  Choose your preferred theme color
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

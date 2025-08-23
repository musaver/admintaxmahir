import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const themeClasses = {
  // Background gradients
  backgroundGradient: 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 light:from-gray-50 light:via-white light:to-gray-100',
  
  // Sidebar gradients
  sidebarGradient: 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 light:from-white light:via-gray-50 light:to-white',
  
  // Card backgrounds
  cardBackground: 'bg-gray-800/50 dark:bg-gray-800/50 light:bg-white/80',
  
  // Border colors
  border: 'border-gray-700/50 dark:border-gray-700/50 light:border-gray-200/50',
  
  // Text colors
  textPrimary: 'text-white dark:text-white light:text-gray-900',
  textSecondary: 'text-gray-400 dark:text-gray-400 light:text-gray-600',
  
  // Interactive elements
  hover: 'hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10',
  
  // Button gradients
  primaryButton: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
  
  // Navigation active state
  navActive: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25',
  navInactive: 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 dark:text-gray-300 dark:hover:text-white light:text-gray-600 light:hover:text-gray-900 light:hover:bg-gradient-to-r light:hover:from-purple-500/10 light:hover:to-blue-500/10'
};

export const gradients = {
  purple: 'from-purple-500 to-pink-500',
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-green-500 to-emerald-500',
  orange: 'from-orange-500 to-red-500',
  primary: 'from-purple-600 to-blue-600'
};

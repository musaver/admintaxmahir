'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light'); // Start with light as default
  const [themeColor, setThemeColor] = useState<string>('purple-blue');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedThemeColor = localStorage.getItem('themeColor');
    
    if (savedTheme) {
      setTheme(savedTheme);
      // Apply theme immediately to prevent flash
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(savedTheme);
    } else {
      // If no saved theme, default to light
      setTheme('light');
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add('light');
    }
    if (savedThemeColor) {
      setThemeColor(savedThemeColor);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return; // Prevent applying theme before component is mounted
    
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    console.log('Applied theme class:', theme, 'Classes on html:', root.classList.toString());
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    // Save theme color to localStorage
    localStorage.setItem('themeColor', themeColor);
    
    // Apply theme color as CSS custom property
    const root = window.document.documentElement;
    root.setAttribute('data-theme-color', themeColor);
  }, [themeColor]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Toggling theme from', theme, 'to', newTheme);
    setTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

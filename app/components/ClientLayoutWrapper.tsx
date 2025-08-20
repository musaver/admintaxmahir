'use client';

import { SessionProvider } from 'next-auth/react';
import ClientLayout from './ClientLayout';
import { CurrencyProvider } from '@/app/contexts/CurrencyContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState, useEffect } from 'react';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if this is a subdomain request
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const hasSubdomain = parts.length > 2 && !hostname.startsWith('www.');
    setIsSubdomain(hasSubdomain);
  }, []);

  // If we haven't determined subdomain status yet, show loading
  if (isSubdomain === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <CurrencyProvider>
        {isSubdomain ? (
          // Subdomain - show admin layout with sidebar
          <ClientLayout>{children}</ClientLayout>
        ) : (
          // Main domain - show content without admin layout
          <>{children}</>
        )}
        <Toaster />
        <Sonner />
      </CurrencyProvider>
    </SessionProvider>
  );
}

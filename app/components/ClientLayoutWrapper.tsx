'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import ClientLayout from './ClientLayout';
import { CurrencyProvider } from '@/app/contexts/CurrencyContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState, useEffect } from 'react';
import { isSubdomainRequest } from '@/lib/subdomain-utils';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if this is a subdomain request
    const hostname = window.location.hostname;
    setIsSubdomain(isSubdomainRequest(hostname));
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
        <ClientLayoutDecider isSubdomain={isSubdomain}>
          {children}
        </ClientLayoutDecider>
        <Toaster />
        <Sonner />
      </CurrencyProvider>
    </SessionProvider>
  );
}

function ClientLayoutDecider({ isSubdomain, children }: { isSubdomain: boolean, children: React.ReactNode }) {
  const { data: session } = useSession();
  
  if (isSubdomain) {
    // Subdomain - always show admin layout with sidebar
    return <ClientLayout>{children}</ClientLayout>;
  } else {
    // Main domain - show admin layout only for super admins
    const currentUser = session?.user as any;
    const isSuperAdmin = currentUser?.type === 'super-admin';
    
    if (isSuperAdmin) {
      return <ClientLayout>{children}</ClientLayout>;
    } else {
      // Non-super-admin on main domain - show content without admin layout
      return <>{children}</>;
    }
  }
}

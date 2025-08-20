'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { IndustriesSection } from "@/components/landing/IndustriesSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if this is a subdomain request
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const hasSubdomain = parts.length > 2 && !hostname.startsWith('www.');
    setIsSubdomain(hasSubdomain);
    
    // Only handle tenant logic if this is a subdomain
    if (hasSubdomain) {
      if (status === 'loading') return; // Still loading session

      if (session) {
        // User is logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not logged in, redirect to login
        router.replace('/login');
      }
    }
  }, [session, status, router]);

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

  // If this is a subdomain (tenant), show loading while redirecting
  if (isSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // This is the main domain, show landing page
  return (
    <div className="landing-page min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <IndustriesSection />
      <ServicesSection />
      <HowItWorksSection />
      <FaqSection />
      <ContactSection />
      <CtaSection />
      <Footer />
    </div>
  );
}

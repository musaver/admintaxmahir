'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { isSubdomainRequest } from '@/lib/subdomain-utils';
import Header from "@/components/landing-new/Header";
import Hero from "@/components/landing-new/Hero";
import Features from "@/components/landing-new/Features";
import WhyChooseUs from "@/components/landing-new/WhyChooseUs";
import HowItWorks from "@/components/landing-new/HowItWorks";
import ClientLogos from "@/components/landing-new/ClientLogos";
import Industries from "@/components/landing-new/Industries";
import AdditionalServices from "@/components/landing-new/AdditionalServices";
import Testimonials from "@/components/landing-new/Testimonials";
import Pricing from "@/components/landing-new/Pricing";
import FAQ from "@/components/landing-new/FAQ";
import Contact from "@/components/landing-new/Contact";
import Footer from "@/components/landing-new/Footer";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubdomain, setIsSubdomain] = useState<boolean | null>(null);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    // Check if this is a subdomain request (using shared utility)
    const hostname = window.location.hostname;
    const hasSubdomain = isSubdomainRequest(hostname);
    
    setIsSubdomain(hasSubdomain);
    
    // Handle routing logic
    if (hasSubdomain) {
      // This is a subdomain (tenant) - handle login/dashboard redirect
      if (status === 'loading') return; // Still loading session

      if (session) {
        // User is logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not logged in, redirect to login
        router.replace('/login');
      }
    } else {
      // This is the main domain - always show landing page
      setShowLanding(true);
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
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // This is the main domain - show landing page
  if (showLanding) {
    return (
      <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
        <Header />
        <Hero />
        <Features />
        <WhyChooseUs />
        <HowItWorks />
        <ClientLogos />
        <Industries />
        {/*<AdditionalServices />*/}
        <Testimonials />
        <Pricing />
        <FAQ />
        <Contact />
        <Footer />
      </div>
    );
  }

  // Still determining what to show
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

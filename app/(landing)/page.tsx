"use client";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
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
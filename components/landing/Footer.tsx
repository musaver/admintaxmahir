'use client';

import { motion } from 'framer-motion';
import { Heart, Facebook, Instagram, Linkedin, Mail, Package } from 'lucide-react';

const links = [
  {
    title: 'Product',
    items: ['Features', 'Pricing', 'API', 'Integrations'],
  },
  {
    title: 'Company',
    items: ['About', 'Blog', 'Careers', 'Contact'],
  },
  {
    title: 'Resources',
    items: ['Help Center', 'Community', 'Tutorials', 'Status'],
  },
  {
    title: 'Legal',
    items: ['Privacy', 'Terms', 'Security', 'Cookies'],
  },
];

const socialLinks = [
  { icon: Facebook, target: '_blank', href: 'https://www.facebook.com/TaxMahir4u', color: 'from-blue-400 to-blue-600' },
  { icon: Instagram, target: '_blank', href: 'https://www.instagram.com/TaxMahir4u', color: 'from-gray-400 to-gray-600' },
  { icon: Linkedin, target: '_blank', href: 'https://www.linkedin.com/company/tax-mahir/', color: 'from-blue-600 to-blue-800' },
];

export default function Footer() {
  return (
    <footer className="py-20 px-6 relative border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-1 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Tax Mahir</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
              We offer comprehensive, one-window business support solutions, 
              FBR digital invoicing, Inventory management - including company incorporation, ERP induction, Bookkeeping, Financial management, Treasury, Payroll, Taxation, and Legal compliance.

              </p>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    target={social.target}
                    href={social.href}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-r ${social.color} flex items-center justify-center transition-transform duration-300 hover:shadow-lg`}
                  >
                    <social.icon className="w-5 h-5 text-white" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <p className="text-gray-400 text-center md:text-left">
            © 2025 Tax Mahir
            
          </p>
          
        </motion.div>
      </div>
    </footer>
  );
}
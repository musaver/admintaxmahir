'use client';

import { motion } from 'framer-motion';
import { Heart, Twitter, Github, Linkedin, Mail, Package } from 'lucide-react';

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
  { icon: Twitter, href: '#', color: 'from-blue-400 to-blue-600' },
  { icon: Github, href: '#', color: 'from-gray-400 to-gray-600' },
  { icon: Linkedin, href: '#', color: 'from-blue-600 to-blue-800' },
  { icon: Mail, href: '#', color: 'from-purple-400 to-purple-600' },
];

export default function Footer() {
  return (
    <footer className="py-20 px-6 relative border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-6 gap-12 mb-12">
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
                Making inventory management delightful, one business at a time. Join thousands of happy customers worldwide.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
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

          {/* Links */}
          {links.map((group, groupIndex) => (
            <motion.div
              key={groupIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
            >
              <h3 className="font-semibold text-white mb-6">{group.title}</h3>
              <ul className="space-y-4">
                {group.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-purple-400 transition-colors duration-300 relative group"
                    >
                      {item}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300"></span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <p className="text-gray-400 text-center md:text-left">
            © 2025 Tax Mahir. Made with{' '}
            <Heart className="inline w-4 h-4 text-red-500 mx-1" />
            for businesses everywhere.
          </p>
          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-purple-400 transition-colors">
              Status
            </a>
            <a href="#" className="hover:text-purple-400 transition-colors">
              Changelog
            </a>
            <a href="#" className="hover:text-purple-400 transition-colors">
              Documentation
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
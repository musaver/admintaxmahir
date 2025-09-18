'use client';

import { motion } from 'framer-motion';
import { Store, Coffee, ShoppingCart, Rocket, Shirt, Utensils, Package, Building } from 'lucide-react';

const industries = [
  {
    icon: Shirt,
    title: 'Boutiques',
    description: 'Fashion and clothing stores',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Coffee,
    title: 'Cafés',
    description: 'Coffee shops and bistros',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: ShoppingCart,
    title: 'Online Stores',
    description: 'E-commerce businesses',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Rocket,
    title: 'Startups',
    description: 'Growing tech companies',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: Store,
    title: 'Retail Stores',
    description: 'Traditional retail outlets',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Utensils,
    title: 'Restaurants',
    description: 'Food service businesses',
    color: 'from-red-500 to-pink-500',
  },
  {
    icon: Package,
    title: 'Warehouses',
    description: 'Distribution centers',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Building,
    title: 'Enterprises',
    description: 'Large corporations',
    color: 'from-gray-500 to-slate-500',
  },
];

export default function Industries() {
  return (
    <section className="py-16 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Industries We
            <br />
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Love to Help
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            From small boutiques to large enterprises, our platform adapts to your business needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 text-center">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${industry.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <industry.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {industry.title}
                </h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {industry.description}
                </p>

                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${industry.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
        >
          {[
            { number: '10K+', label: 'Happy Customers' },
            { number: '50M+', label: 'Items Managed' },
            { number: '99.9%', label: 'Uptime' },
            { number: '24/7', label: 'Support' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
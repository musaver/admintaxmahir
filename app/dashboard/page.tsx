// app/dashboard/page.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import ZoomLinkForm from '../components/ZoomLinkForm';

export default function Dashboard() {
  const router = useRouter();
  
  const cards = [
    { title: 'Users', count: '0', link: '/users' },
    { title: 'Courses', count: '0', link: '/courses' },
    { title: 'Orders', count: '0', link: '/orders' },
    { title: 'Admin Users', count: '0', link: '/admins' },
    { title: 'Attendance', count: '0', link: '/attendance' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Existing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div 
            key={card.title} 
            className="border p-4 rounded cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(card.link)}
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="text-3xl font-bold mt-2">{card.count}</p>
          </div>
        ))}
      </div>

      {/* Zoom Link Section */}
      <div className="max-w-md">
        <ZoomLinkForm />
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditUser() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: '',
    buyerAddress: '',
    buyerRegistrationType: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await response.json();
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '', // Don't populate password
          buyerNTNCNIC: userData.buyerNTNCNIC || '',
          buyerBusinessName: userData.buyerBusinessName || '',
          buyerProvince: userData.buyerProvince || '',
          buyerAddress: userData.buyerAddress || '',
          buyerRegistrationType: userData.buyerRegistrationType || '',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Only include password if it was changed
    const dataToSubmit = {
      name: formData.name,
      email: formData.email,
      buyerNTNCNIC: formData.buyerNTNCNIC,
      buyerBusinessName: formData.buyerBusinessName,
      buyerProvince: formData.buyerProvince,
      buyerAddress: formData.buyerAddress,
      buyerRegistrationType: formData.buyerRegistrationType,
      ...(formData.password ? { password: formData.password } : {})
    };

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      router.push('/users');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            New Password (leave empty to keep current password)
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="buyerNTNCNIC">
            Buyer NTN/CNIC
          </label>
          <input
            type="text"
            id="buyerNTNCNIC"
            name="buyerNTNCNIC"
            value={formData.buyerNTNCNIC}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="buyerBusinessName">
            Buyer Business Name
          </label>
          <input
            type="text"
            id="buyerBusinessName"
            name="buyerBusinessName"
            value={formData.buyerBusinessName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="buyerProvince">
            Buyer Province
          </label>
          <input
            type="text"
            id="buyerProvince"
            name="buyerProvince"
            value={formData.buyerProvince}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="buyerAddress">
            Buyer Address
          </label>
          <input
            type="text"
            id="buyerAddress"
            name="buyerAddress"
            value={formData.buyerAddress}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="buyerRegistrationType">
            Buyer Registration Type
          </label>
          <select
            id="buyerRegistrationType"
            name="buyerRegistrationType"
            value={formData.buyerRegistrationType}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Registration Type</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="partnership">Partnership</option>
            <option value="sole_proprietorship">Sole Proprietorship</option>
          </select>
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/users')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 
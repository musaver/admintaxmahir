'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditOrder() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [formData, setFormData] = useState({
    status: ''
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const [orderResponse, usersResponse, coursesResponse] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch('/api/users'),
          fetch('/api/courses')
        ]);
        
        if (!orderResponse.ok) {
          throw new Error('Failed to fetch order');
        }
        
        const orderData = await orderResponse.json();
        const users = await usersResponse.json();
        const courses = await coursesResponse.json();
        
        setFormData({
          status: orderData.status || 'pending',
        });
        
        // Find user and course details
        const user = users.find((u: any) => u.id === orderData.userId);
        const course = courses.find((c: any) => c.id === orderData.courseId);
        
        setOrderDetails({
          ...orderData,
          user,
          course,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: formData.status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update order');
      }

      router.push('/admin/orders');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Order</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {orderDetails && (
        <div className="mb-6 bg-gray-50 p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Order Details</h2>
          <p><strong>Order ID:</strong> {orderDetails.id}</p>
          <p><strong>User:</strong> {orderDetails.user?.name || 'Unknown'} ({orderDetails.user?.email || 'No email'})</p>
          <p><strong>Course:</strong> {orderDetails.course?.title || 'Unknown'}</p>
          <p><strong>Created:</strong> {new Date(orderDetails.createdAt).toLocaleString()}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
            onClick={() => router.push('/admin/orders')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 
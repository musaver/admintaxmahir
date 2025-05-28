'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

export default function EditOrder() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [formData, setFormData] = useState({
    status: '',
    batchId: ''
  });
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const [orderResponse, usersResponse, coursesResponse, batchesResponse] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch('/api/users'),
          fetch('/api/courses'),
          fetch('/api/batches')
        ]);
        
        if (!orderResponse.ok) {
          throw new Error('Failed to fetch order');
        }
        
        const orderData = await orderResponse.json();
        const users = await usersResponse.json();
        const courses = await coursesResponse.json();
        const batchesData = await batchesResponse.json();
        
        setFormData({
          status: orderData.status || 'pending',
          batchId: orderData.batchId || '',
        });
        
        setBatches(batchesData);
        
        // Find user, course, and batch details
        const user = users.find((u: any) => u.id === orderData.userId);
        const course = courses.find((c: any) => c.id === orderData.courseId);
        const batch = batchesData.find((b: any) => b.batch.id === orderData.batchId);
        
        setOrderDetails({
          ...orderData,
          user,
          course,
          batch: batch?.batch,
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
        body: JSON.stringify({ 
          status: formData.status, 
          batchId: formData.batchId || null 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update order');
      }

      router.push('/orders');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Order Information</h3>
              <p><strong>Order ID:</strong> {orderDetails.id}</p>
              <p><strong>Status:</strong> {orderDetails.status}</p>
              <p><strong>Created:</strong> {new Date(orderDetails.createdAt).toLocaleString()}</p>
              <p><strong>Updated:</strong> {new Date(orderDetails.updatedAt).toLocaleString()}</p>
              <p><strong>Transaction ID:</strong> {orderDetails.transactionId || 'N/A'}</p>
              
              <h3 className="font-medium text-gray-700 mt-4 mb-2">Course Information</h3>
              <p><strong>Course:</strong> {orderDetails.course?.title || 'Unknown'}</p>
              <p><strong>Batch:</strong> {orderDetails.batch?.batchName || 'No Batch'}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">User Information</h3>
              <p><strong>Name:</strong> {orderDetails.user?.name || 'Unknown'}</p>
              <p><strong>First Name:</strong> {orderDetails.user?.firstName || orderDetails.firstName || 'N/A'}</p>
              <p><strong>Last Name:</strong> {orderDetails.user?.lastName || orderDetails.lastName || 'N/A'}</p>
              <p><strong>Email:</strong> {orderDetails.user?.email || orderDetails.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {orderDetails.user?.phone || orderDetails.phone || 'N/A'}</p>
              <p><strong>Username:</strong> {orderDetails.user?.username || 'N/A'}</p>
              <p><strong>Display Name:</strong> {orderDetails.user?.displayName || 'N/A'}</p>
              <p><strong>Skill:</strong> {orderDetails.user?.skill || 'N/A'}</p>
              <p><strong>Occupation:</strong> {orderDetails.user?.occupation || 'N/A'}</p>
              <p><strong>Country:</strong> {orderDetails.user?.country || orderDetails.country || 'N/A'}</p>
              <p><strong>City:</strong> {orderDetails.user?.city || orderDetails.city || 'N/A'}</p>
              <p><strong>State:</strong> {orderDetails.user?.state || orderDetails.state || 'N/A'}</p>
              <p><strong>Address:</strong> {orderDetails.user?.address || orderDetails.address || 'N/A'}</p>
            </div>
          </div>
          
          {orderDetails.transactionScreenshot && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-2">Transaction Screenshot</h3>
              <div className="border rounded p-2 max-w-md">
                <Image 
                  src={orderDetails.transactionScreenshot} 
                  alt="Transaction Screenshot" 
                  width={500} 
                  height={300}
                  className="w-full object-contain"
                />
              </div>
            </div>
          )}
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
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="batchId">
            Batch (Optional)
          </label>
          <select
            id="batchId"
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">No Batch</option>
            {batches.map((item: any) => (
              <option key={item.batch.id} value={item.batch.id}>
                {item.batch.batchName} - {item.course?.title}
              </option>
            ))}
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
            onClick={() => router.push('/orders')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BatchesList() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this batch?')) {
      try {
        await fetch(`/api/batches/${id}`, { method: 'DELETE' });
        setBatches(batches.filter((batch: any) => batch.batch.id !== id));
      } catch (error) {
        console.error('Error deleting batch:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Not set';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Batches</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchBatches}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <Link 
            href="/batches/add" 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add New Batch
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Image</th>
              <th className="border p-2 text-left">Batch Name</th>
              <th className="border p-2 text-left">Course</th>
              <th className="border p-2 text-left">Start Date</th>
              <th className="border p-2 text-left">End Date</th>
              <th className="border p-2 text-left">Capacity</th>
              <th className="border p-2 text-left">Created At</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.length > 0 ? (
              batches.map((item: any) => (
                <tr key={item.batch.id}>
                  <td className="border p-2">
                    {item.batch.image ? (
                      <img 
                        src={item.batch.image} 
                        alt={item.batch.batchName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="border p-2">{item.batch.batchName}</td>
                  <td className="border p-2">{item.course?.title || 'Unknown'}</td>
                  <td className="border p-2">{formatDate(item.batch.startDate)}</td>
                  <td className="border p-2">{formatDate(item.batch.endDate)}</td>
                  <td className="border p-2">{item.batch.capacity || 'Not set'}</td>
                  <td className="border p-2">{new Date(item.batch.createdAt).toLocaleString()}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <Link 
                        href={`/batches/edit/${item.batch.id}`}
                        className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.batch.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border p-2 text-center">No batches found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditRecording() {
  const router = useRouter();
  const params = useParams();
  const recordingId = params.id as string;
  
  const [formData, setFormData] = useState({
    recordingTitle: '',
    batchId: '',
    recordingDateTime: '',
    recordingUrl: '',
    showToAllUsers: true
  });
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recordingResponse, batchesResponse] = await Promise.all([
          fetch(`/api/recordings/${recordingId}`),
          fetch('/api/batches')
        ]);
        
        if (!recordingResponse.ok) {
          throw new Error('Failed to fetch recording');
        }
        
        const recordingData = await recordingResponse.json();
        const batchesData = await batchesResponse.json();
        
        // Format datetime for input field - keep local time without timezone conversion
        const recordingDateTime = new Date(recordingData.recordingDateTime);
        
        // Get local date/time components to avoid timezone conversion
        const year = recordingDateTime.getFullYear();
        const month = String(recordingDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(recordingDateTime.getDate()).padStart(2, '0');
        const hours = String(recordingDateTime.getHours()).padStart(2, '0');
        const minutes = String(recordingDateTime.getMinutes()).padStart(2, '0');
        
        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        setFormData({
          recordingTitle: recordingData.recordingTitle || '',
          batchId: recordingData.batchId || '',
          recordingDateTime: formattedDateTime,
          recordingUrl: recordingData.recordingUrl || '',
          showToAllUsers: recordingData.showToAllUsers !== undefined ? recordingData.showToAllUsers : true,
        });
        
        setBatches(batchesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recordingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update recording');
      }

      router.push('/recordings');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Recording</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="recordingTitle">
            Recording Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="recordingTitle"
            name="recordingTitle"
            value={formData.recordingTitle}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="batchId">
            Batch <span className="text-red-500">*</span>
          </label>
          <select
            id="batchId"
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select a batch</option>
            {batches.map((item: any) => (
              <option key={item.batch.id} value={item.batch.id}>
                {item.batch.batchName} - {item.course?.title}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="recordingDateTime">
            Recording Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="recordingDateTime"
            name="recordingDateTime"
            value={formData.recordingDateTime}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="recordingUrl">
            Recording URL
          </label>
          <input
            type="url"
            id="recordingUrl"
            name="recordingUrl"
            value={formData.recordingUrl}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com/recording"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="showToAllUsers"
              checked={formData.showToAllUsers}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-gray-700">Show recording to all users</span>
          </label>
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/recordings')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';

interface Batch {
  id: string;
  batchName: string;
}

interface ZoomLinkData {
  zoomLink: {
    id: number;
    url: string;
    batchId: string;
  };
  batch: {
    id: string;
    batchName: string;
  };
}

export default function ZoomLinkForm() {
  const [url, setUrl] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [existingZoomLink, setExistingZoomLink] = useState<ZoomLinkData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBatches();
    fetchExistingZoomLink();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/batches');
      const data = await response.json();
      // Extract batches from the response format
      const batchData = data.map((item: any) => ({
        id: item.batch.id,
        batchName: item.batch.batchName
      }));
      setBatches(batchData);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingZoomLink = async () => {
    try {
      const response = await fetch('/api/zoom-links');
      const data = await response.json();
      
      if (data && data.zoomLink) {
        setExistingZoomLink(data);
        setUrl(data.zoomLink.url);
        setSelectedBatchId(data.zoomLink.batchId);
        setIsEditing(true);
      } else {
        setExistingZoomLink(null);
        setUrl('');
        setSelectedBatchId('');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error fetching existing zoom link:', error);
      setExistingZoomLink(null);
      setUrl('');
      setSelectedBatchId('');
      setIsEditing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url || !selectedBatchId) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch('/api/zoom-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          batchId: selectedBatchId,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        //alert(result.message);
        // Refresh the zoom link data
        await fetchExistingZoomLink();
      } else {
        alert(result.error || 'Failed to save zoom link');
      }
    } catch (error) {
      console.error('Error submitting zoom link:', error);
      alert('Error submitting zoom link');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this zoom link?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/zoom-links', {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok) {
        //alert(result.message);
        // Reset form after successful deletion
        setUrl('');
        setSelectedBatchId('');
        setExistingZoomLink(null);
        setIsEditing(false);
      } else {
        alert(result.error || 'Failed to delete zoom link');
      }
    } catch (error) {
      console.error('Error deleting zoom link:', error);
      alert('Error deleting zoom link');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isBatchDisabled = (batchId: string) => {
    // If editing, only allow the current batch or if no zoom link exists, allow all
    if (isEditing) {
      return batchId !== selectedBatchId;
    }
    return false;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">
        {isEditing ? 'Edit Zoom Link' : 'Add Zoom Link'}
      </h2>
      
      {isEditing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            ℹ️ Only one zoom link can exist at a time. You can update the batch or URL, or delete the link.
          </p>
        </div>
      )}

      {!isEditing && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            ℹ️ No zoom link exists. You can create one for any batch.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
            Select Batch
          </label>
          {loading ? (
            <div className="text-gray-500">Loading batches...</div>
          ) : (
            <select
              id="batch"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a batch...</option>
              {batches.map((batch) => (
                <option 
                  key={batch.id} 
                  value={batch.id}
                  disabled={isBatchDisabled(batch.id)}
                  className={isBatchDisabled(batch.id) ? 'text-gray-400 bg-gray-100' : ''}
                >
                  {batch.batchName}
                  {isBatchDisabled(batch.id) ? ' (Disabled - Zoom link exists for another batch)' : ''}
                  {isEditing && batch.id === selectedBatchId ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Zoom URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitLoading || !selectedBatchId}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitLoading ? 'Saving...' : (isEditing ? 'Update Zoom Link' : 'Add Zoom Link')}
          </button>
          
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 
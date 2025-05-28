'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RecordingsList() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recordings')
      .then(res => res.json())
      .then(data => {
        setRecordings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recording?')) {
      try {
        await fetch(`/api/recordings/${id}`, { method: 'DELETE' });
        setRecordings(recordings.filter((recording: any) => recording.recording.id !== id));
      } catch (error) {
        console.error('Error deleting recording:', error);
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recordings</h1>
        <Link 
          href="/recordings/add" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Recording
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Recording Title</th>
              <th className="border border-gray-300 p-2 text-left">Batch</th>
              <th className="border border-gray-300 p-2 text-left">Course</th>
              <th className="border border-gray-300 p-2 text-left">Recording Date & Time</th>
              <th className="border border-gray-300 p-2 text-left">Recording URL</th>
              <th className="border border-gray-300 p-2 text-left">Show to All Users</th>
              <th className="border border-gray-300 p-2 text-left">Created At</th>
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recordings.length > 0 ? (
              recordings.map((item: any) => (
                <tr key={item.recording.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">{item.recording.recordingTitle}</td>
                  <td className="border border-gray-300 p-2">{item.batch?.batchName || 'Unknown Batch'}</td>
                  <td className="border border-gray-300 p-2">{item.course?.title || 'Unknown Course'}</td>
                  <td className="border border-gray-300 p-2">{formatDateTime(item.recording.recordingDateTime)}</td>
                  <td className="border border-gray-300 p-2">
                    {item.recording.recordingUrl ? (
                      <a 
                        href={item.recording.recordingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 underline break-all"
                      >
                        {item.recording.recordingUrl.length > 50 
                          ? item.recording.recordingUrl.substring(0, 50) + '...' 
                          : item.recording.recordingUrl}
                      </a>
                    ) : (
                      <span className="text-gray-400">No URL</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      item.recording.showToAllUsers 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.recording.showToAllUsers ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2">{formatDateTime(item.recording.createdAt)}</td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex gap-2">
                      <Link 
                        href={`/recordings/edit/${item.recording.id}`}
                        className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.recording.id)}
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
                <td colSpan={8} className="border border-gray-300 p-4 text-center text-gray-500">
                  No recordings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
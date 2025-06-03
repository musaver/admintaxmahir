'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Batch {
  id: string;
  batchName: string;
  courseName: string;
}

export default function BatchSelectionPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/batches');
      const data = await response.json();
      
      if (response.ok) {
        // Extract batches from the response format
        const batchData = data.map((item: any) => ({
          id: item.batch.id,
          batchName: item.batch.batchName,
          courseName: item.course?.courseName || 'Unknown Course'
        }));
        setBatches(batchData);
      } else {
        console.error('Error fetching batches:', data.error);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch => 
    batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateToBatchAttendance = (batchId: string, batchName: string) => {
    router.push(`/attendance/batch/${batchId}?name=${encodeURIComponent(batchName)}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Select Batch</h1>
            <p className="text-gray-600 mt-1">Choose a batch to view its attendance records</p>
          </div>
          <button
            onClick={() => router.push('/attendance')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            ← Back to All Attendance
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search batches by name or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading batches...</div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {searchTerm ? `Found ${filteredBatches.length} batch(es) matching "${searchTerm}"` : `${batches.length} total batches`}
          </div>

          {filteredBatches.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-gray-500 text-lg">
                {searchTerm ? 'No batches found matching your search' : 'No batches found'}
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-3 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => (
                <div 
                  key={batch.id} 
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border hover:border-blue-300"
                  onClick={() => navigateToBatchAttendance(batch.id, batch.batchName)}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{batch.batchName}</h3>
                    <p className="text-sm text-gray-600">{batch.courseName}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Batch ID: {batch.id.slice(0, 8)}...
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToBatchAttendance(batch.id, batch.batchName);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-colors"
                    >
                      View Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 
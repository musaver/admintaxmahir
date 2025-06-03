'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import DateFilter from '../../../components/DateFilter';

interface AttendanceRecord {
  attendance: {
    id: string;
    userId: string;
    batchId: string;
    date: string;
    time: string;
    createdAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  batch: {
    id: string;
    batchName: string;
  };
}

interface AttendanceStats {
  totalAttendance: number;
  uniqueBatches: number;
  attendanceByBatch: Record<string, number>;
}

export default function UserAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const userName = searchParams.get('name') || 'Unknown User';
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState<AttendanceStats>({
    totalAttendance: 0,
    uniqueBatches: 0,
    attendanceByBatch: {}
  });

  useEffect(() => {
    if (userId) {
      fetchUserAttendance();
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    calculateStats();
  }, [attendanceRecords]);

  const fetchUserAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setAttendanceRecords(data);
      } else {
        console.error('Error fetching user attendance:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const uniqueBatches = new Set(attendanceRecords.map(record => record.batch.id)).size;
    const attendanceByBatch = attendanceRecords.reduce((acc, record) => {
      const batchName = record.batch.batchName;
      acc[batchName] = (acc[batchName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalAttendance: attendanceRecords.length,
      uniqueBatches,
      attendanceByBatch
    });
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString();
  };

  const navigateToBatchAttendance = (batchId: string, batchName: string) => {
    router.push(`/attendance/batch/${batchId}?name=${encodeURIComponent(batchName)}`);
  };

  // Group attendance by batch for better visualization
  const groupedByBatch = attendanceRecords.reduce((acc, record) => {
    const batchName = record.batch.batchName;
    if (!acc[batchName]) {
      acc[batchName] = [];
    }
    acc[batchName].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance for {userName}
            </h1>
            <p className="text-gray-600 mt-1">View attendance history across all batches</p>
          </div>
          <button
            onClick={() => router.push('/attendance')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            ← Back to All Attendance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-blue-600">{stats.totalAttendance}</div>
          <div className="text-sm text-gray-600">Total Attendance</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-green-600">{stats.uniqueBatches}</div>
          <div className="text-sm text-gray-600">Unique Batches</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-purple-600">
            {attendanceRecords.length > 0 
              ? Math.round((attendanceRecords.length / 30) * 100) / 100 // Rough monthly average
              : 0
            }
          </div>
          <div className="text-sm text-gray-600">Avg per Month</div>
        </div>
      </div>

      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClearFilter={handleClearFilter}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading attendance records...</div>
        </div>
      ) : (
        <>
          {Object.keys(groupedByBatch).length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-gray-500 text-lg">No attendance records found</div>
              <p className="text-gray-400 mt-2">
                {startDate || endDate 
                  ? 'Try adjusting your date filter' 
                  : 'This user has no attendance records yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByBatch)
                .sort(([, a], [, b]) => b.length - a.length) // Sort by attendance count
                .map(([batchName, records]) => (
                  <div key={batchName} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{batchName}</h3>
                          <p className="text-sm text-gray-600">{records.length} attendance record(s)</p>
                        </div>
                        <button
                          onClick={() => navigateToBatchAttendance(records[0].batch.id, batchName)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                        >
                          View Batch Details
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Day of Week
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {records
                            .sort((a, b) => new Date(b.attendance.date).getTime() - new Date(a.attendance.date).getTime())
                            .map((record) => (
                              <tr key={record.attendance.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDate(record.attendance.date)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatTime(record.attendance.time)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(record.attendance.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Attendance Summary by Batch */}
          {Object.keys(stats.attendanceByBatch).length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Attendance Summary by Batch</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.attendanceByBatch).map(([batchName, count]) => (
                  <div key={batchName} className="p-3 bg-gray-50 rounded-md">
                    <div className="font-medium text-gray-900">{batchName}</div>
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-sm text-gray-500">sessions attended</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
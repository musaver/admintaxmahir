'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DateFilter from '../components/DateFilter';

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

export default function AttendancePage() {
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setAttendanceRecords(data);
      } else {
        console.error('Error fetching attendance:', data.error);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString();
  };

  const navigateToUserAttendance = (userId: string, userName: string) => {
    router.push(`/attendance/user/${userId}?name=${encodeURIComponent(userName)}`);
  };

  const navigateToBatchAttendance = (batchId: string, batchName: string) => {
    router.push(`/attendance/batch/${batchId}?name=${encodeURIComponent(batchName)}`);
  };

  // Group attendance by date for better visualization
  const groupedAttendance = attendanceRecords.reduce((acc, record) => {
    const date = formatDate(record.attendance.date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-gray-600 mt-1">View and manage student attendance across all batches</p>
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
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total Records: {attendanceRecords.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/attendance/user')}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                View by User
              </button>
              <button
                onClick={() => router.push('/attendance/batch')}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                View by Batch
              </button>
            </div>
          </div>

          {Object.keys(groupedAttendance).length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-gray-500 text-lg">No attendance records found</div>
              <p className="text-gray-400 mt-2">
                {startDate || endDate 
                  ? 'Try adjusting your date filter' 
                  : 'No attendance has been recorded yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAttendance)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, records]) => (
                  <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">{date}</h3>
                      <p className="text-sm text-gray-600">{records.length} attendance record(s)</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Batch
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {records.map((record) => (
                            <tr key={record.attendance.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {record.user?.name || 'Unknown User'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {record.user?.email || 'No email'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {record.batch?.batchName || 'Unknown Batch'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatTime(record.attendance.time)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => navigateToUserAttendance(record.user.id, record.user.name)}
                                    className="text-blue-600 hover:text-blue-900 hover:underline"
                                  >
                                    View User
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => navigateToBatchAttendance(record.batch.id, record.batch.batchName)}
                                    className="text-green-600 hover:text-green-900 hover:underline"
                                  >
                                    View Batch
                                  </button>
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
        </>
      )}
    </div>
  );
} 
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
  uniqueStudents: number;
  attendanceByStudent: Record<string, { count: number; name: string; email: string }>;
  attendanceByDate: Record<string, number>;
}

export default function BatchAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const batchId = params.batchId as string;
  const batchName = searchParams.get('name') || 'Unknown Batch';
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState<AttendanceStats>({
    totalAttendance: 0,
    uniqueStudents: 0,
    attendanceByStudent: {},
    attendanceByDate: {}
  });

  useEffect(() => {
    if (batchId) {
      fetchBatchAttendance();
    }
  }, [batchId, startDate, endDate]);

  useEffect(() => {
    calculateStats();
  }, [attendanceRecords]);

  const fetchBatchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('batchId', batchId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/attendance?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setAttendanceRecords(data);
      } else {
        console.error('Error fetching batch attendance:', data.error);
      }
    } catch (error) {
      console.error('Error fetching batch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const uniqueStudents = new Set(attendanceRecords.map(record => record.user.id)).size;
    
    const attendanceByStudent = attendanceRecords.reduce((acc, record) => {
      const userId = record.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          count: 0,
          name: record.user.name,
          email: record.user.email
        };
      }
      acc[userId].count += 1;
      return acc;
    }, {} as Record<string, { count: number; name: string; email: string }>);

    const attendanceByDate = attendanceRecords.reduce((acc, record) => {
      const date = new Date(record.attendance.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalAttendance: attendanceRecords.length,
      uniqueStudents,
      attendanceByStudent,
      attendanceByDate
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

  const navigateToUserAttendance = (userId: string, userName: string) => {
    router.push(`/attendance/user/${userId}?name=${encodeURIComponent(userName)}`);
  };

  // Group attendance by date for better visualization
  const groupedByDate = attendanceRecords.reduce((acc, record) => {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance for {batchName}
            </h1>
            <p className="text-gray-600 mt-1">View student attendance for this batch</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-blue-600">{stats.totalAttendance}</div>
          <div className="text-sm text-gray-600">Total Attendance</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-green-600">{stats.uniqueStudents}</div>
          <div className="text-sm text-gray-600">Unique Students</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(stats.attendanceByDate).length}
          </div>
          <div className="text-sm text-gray-600">Session Days</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-orange-600">
            {stats.uniqueStudents > 0 
              ? Math.round((stats.totalAttendance / stats.uniqueStudents) * 100) / 100 
              : 0
            }
          </div>
          <div className="text-sm text-gray-600">Avg per Student</div>
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
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-gray-500 text-lg">No attendance records found</div>
              <p className="text-gray-400 mt-2">
                {startDate || endDate 
                  ? 'Try adjusting your date filter' 
                  : 'No students have attended this batch yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Attendance by Date */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Attendance by Session</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students Present
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Day of Week
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(groupedByDate)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .map(([date, records]) => (
                          <tr key={date} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{date}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{records.length}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(records[0].attendance.date).toLocaleDateString('en-US', { weekday: 'long' })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <details className="cursor-pointer">
                                <summary className="text-blue-600 hover:text-blue-900">View Students</summary>
                                <div className="mt-2 p-2 bg-gray-50 rounded">
                                  {records.map((record) => (
                                    <div key={record.attendance.id} className="flex justify-between items-center py-1">
                                      <span className="text-sm">{record.user.name}</span>
                                      <span className="text-xs text-gray-500">{formatTime(record.attendance.time)}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Attendance Summary */}
              {Object.keys(stats.attendanceByStudent).length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Student Attendance Summary</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sessions Attended
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendance Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(stats.attendanceByStudent)
                          .sort(([, a], [, b]) => b.count - a.count)
                          .map(([userId, studentData]) => {
                            const attendanceRate = Math.round((studentData.count / Object.keys(stats.attendanceByDate).length) * 100);
                            return (
                              <tr key={userId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {studentData.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{studentData.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-bold text-blue-600">{studentData.count}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`text-sm font-medium ${
                                    attendanceRate >= 80 ? 'text-green-600' :
                                    attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {attendanceRate}%
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => navigateToUserAttendance(userId, studentData.name)}
                                    className="text-blue-600 hover:text-blue-900 hover:underline"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 
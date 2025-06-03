'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function UserSelectionPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        // Extract users from the response format
        const userData = data.map((item: any) => ({
          id: item.user.id,
          name: item.user.name,
          email: item.user.email
        }));
        setUsers(userData);
      } else {
        console.error('Error fetching users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateToUserAttendance = (userId: string, userName: string) => {
    router.push(`/attendance/user/${userId}?name=${encodeURIComponent(userName)}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Select User</h1>
            <p className="text-gray-600 mt-1">Choose a user to view their attendance records</p>
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
            placeholder="Search users by name or email..."
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
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {searchTerm ? `Found ${filteredUsers.length} user(s) matching "${searchTerm}"` : `${users.length} total users`}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="text-gray-500 text-lg">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigateToUserAttendance(user.id, user.name)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToUserAttendance(user.id, user.name);
                            }}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            View Attendance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ResponsiveTable from '../components/ResponsiveTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  PlusIcon, 
  MoreVerticalIcon, 
  EditIcon, 
  TrashIcon,
  RefreshCwIcon,
  UsersIcon,
  DownloadIcon,
  UploadIcon
} from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  createdAt: string;
  loyaltyPoints?: {
    availablePoints: number;
    pendingPoints: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    pointsExpiringSoon: number;
  };
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('API returned non-array data:', data);
        setUsers([]); // Fallback to empty array
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]); // Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        setUsers(users.filter((user) => user.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const exportUsers = async () => {
    setExporting(true);
    try {
      // Convert users data to CSV format
      const csvHeaders = [
        'ID', 'Name', 'Email', 'Phone', 'Country', 'City', 'Address', 'Created At',
        'Available Points', 'Pending Points', 'Total Earned', 'Total Redeemed', 'Expiring Soon'
      ];
      const csvData = users.map((user) => [
        user.id || '',
        user.name || '',
        user.email || '',
        user.phone || '',
        user.country || '',
        user.city || '',
        user.address || '',
        user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
        user.loyaltyPoints?.availablePoints || 0,
        user.loyaltyPoints?.pendingPoints || 0,
        user.loyaltyPoints?.totalPointsEarned || 0,
        user.loyaltyPoints?.totalPointsRedeemed || 0,
        user.loyaltyPoints?.pointsExpiringSoon || 0
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Failed to export users');
    } finally {
      setExporting(false);
    }
  };

  const getStats = () => {
    // Ensure users is an array
    const userArray = Array.isArray(users) ? users : [];
    
    const totalUsers = userArray.length;
    const usersWithPhone = userArray.filter(user => user.phone).length;
    const usersWithAddress = userArray.filter(user => user.address).length;
    
    // Loyalty points stats
    const usersWithPoints = userArray.filter(user => user.loyaltyPoints && user.loyaltyPoints.availablePoints > 0).length;
    const totalAvailablePoints = userArray.reduce((sum, user) => sum + (user.loyaltyPoints?.availablePoints || 0), 0);
    const totalPointsEarned = userArray.reduce((sum, user) => sum + (user.loyaltyPoints?.totalPointsEarned || 0), 0);
    const totalPointsRedeemed = userArray.reduce((sum, user) => sum + (user.loyaltyPoints?.totalPointsRedeemed || 0), 0);
    const usersWithExpiring = userArray.filter(user => user.loyaltyPoints && user.loyaltyPoints.pointsExpiringSoon > 0).length;
    
    return { 
      totalUsers, 
      usersWithPhone, 
      usersWithAddress,
      usersWithPoints,
      totalAvailablePoints,
      totalPointsEarned,
      totalPointsRedeemed,
      usersWithExpiring
    };
  };

  const stats = getStats();

  const columns = [
    {
      key: 'name',
      title: 'User',
      render: (_: any, user: User) => (
        <div>
          <div className="font-medium">{user.name || 'No Name'}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (_: any, user: User) => (
        <div className="text-sm">
          {user.phone || 'No phone'}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'location',
      title: 'Location',
      render: (_: any, user: User) => (
        <div className="text-sm">
          {user.city && user.country 
            ? `${user.city}, ${user.country}`
            : user.country || user.city || 'No location'
          }
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'loyaltyPoints',
      title: 'Loyalty Points',
      render: (_: any, user: User) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                (user.loyaltyPoints?.availablePoints || 0) > 0 
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {user.loyaltyPoints?.availablePoints || 0} available
            </Badge>
            {user.loyaltyPoints && user.loyaltyPoints.pendingPoints > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                {user.loyaltyPoints.pendingPoints} pending
              </Badge>
            )}
            {user.loyaltyPoints && user.loyaltyPoints.pointsExpiringSoon > 0 && (
              <Badge variant="destructive" className="text-xs">
                {user.loyaltyPoints.pointsExpiringSoon} expiring
              </Badge>
            )}
          </div>
          {user.loyaltyPoints && (user.loyaltyPoints.totalPointsEarned > 0 || user.loyaltyPoints.totalPointsRedeemed > 0) && (
            <div className="text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Earned: {user.loyaltyPoints.totalPointsEarned}</span>
                <span>Redeemed: {user.loyaltyPoints.totalPointsRedeemed}</span>
              </div>
            </div>
          )}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'address',
      title: 'Address',
      render: (_: any, user: User) => (
        <div className="text-sm max-w-xs truncate">
          {user.address || 'No address'}
        </div>
      ),
      mobileHidden: true
    },
    {
      key: 'createdAt',
      title: 'Joined',
      render: (_: any, user: User) => (
        <div className="text-sm">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      )
    }
  ];

  const renderActions = (user: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/users/edit/${user.id}`} className="flex items-center">
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/users/${user.id}/points-history`} className="flex items-center">
            <Badge className="h-4 w-4 mr-2 bg-purple-600" />
            Points History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleDelete(user.id)}
          className="text-red-600 focus:text-red-600"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage customer accounts and information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={exportUsers} 
            disabled={exporting || users.length === 0} 
            variant="outline" 
            size="sm"
          >
            <DownloadIcon className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/users/bulk-upload">
              <UploadIcon className="h-4 w-4 mr-2" /> 
              Bulk Import
            </Link>
          </Button>
          <Button onClick={fetchUsers} disabled={loading} variant="outline" size="sm">
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/users/add">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.usersWithPhone}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.usersWithAddress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.usersWithPoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalAvailablePoints.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.usersWithExpiring}</div>
            <p className="text-xs text-muted-foreground">users affected</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <ResponsiveTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
        actions={renderActions}
      />
    </div>
  );
} 
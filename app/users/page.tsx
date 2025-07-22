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
  DownloadIcon
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
      setUsers(data);
    } catch (err) {
      console.error(err);
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
      const csvHeaders = ['ID', 'Name', 'Email', 'Phone', 'Country', 'City', 'Address', 'Created At'];
      const csvData = users.map((user) => [
        user.id || '',
        user.name || '',
        user.email || '',
        user.phone || '',
        user.country || '',
        user.city || '',
        user.address || '',
        user.createdAt ? new Date(user.createdAt).toLocaleString() : ''
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
    const totalUsers = users.length;
    const usersWithPhone = users.filter(user => user.phone).length;
    const usersWithAddress = users.filter(user => user.address).length;
    
    return { totalUsers, usersWithPhone, usersWithAddress };
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
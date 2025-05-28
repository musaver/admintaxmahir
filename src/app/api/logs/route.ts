import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminLogs, adminUsers } from '@/lib/db/schema';

export async function GET() {
  try {
    const logs = await db
      .select({
        log: adminLogs,
        admin: {
          id: adminUsers.id,
          name: adminUsers.name,
          email: adminUsers.email
        }
      })
      .from(adminLogs)
      .leftJoin(adminUsers, adminLogs.adminId, adminUsers.id)
      .orderBy(adminLogs.createdAt, 'desc');
      
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
} 
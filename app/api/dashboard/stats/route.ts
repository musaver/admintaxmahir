import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, courses, orders, adminUsers, attendance } from '@/lib/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    // Get counts for all entities
    const [
      usersCount,
      coursesCount,
      ordersCount,
      adminUsersCount,
      attendanceCount
    ] = await Promise.all([
      db.select({ count: count() }).from(user),
      db.select({ count: count() }).from(courses),
      db.select({ count: count() }).from(orders),
      db.select({ count: count() }).from(adminUsers),
      db.select({ count: count() }).from(attendance)
    ]);

    const stats = {
      users: usersCount[0]?.count || 0,
      courses: coursesCount[0]?.count || 0,
      orders: ordersCount[0]?.count || 0,
      adminUsers: adminUsersCount[0]?.count || 0,
      attendance: attendanceCount[0]?.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
} 
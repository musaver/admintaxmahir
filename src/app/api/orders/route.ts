import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, users, courses } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const allOrders = await db
      .select({
        order: orders,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        },
        course: {
          id: courses.id,
          title: courses.title
        }
      })
      .from(orders)
      .leftJoin(users, orders.userId, users.id)
      .leftJoin(courses, orders.courseId, courses.id);
      
    return NextResponse.json(allOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, courseId, status } = await request.json();
    
    const newOrder = {
      id: uuidv4(),
      userId,
      courseId,
      status: status || 'pending',
    };
    
    await db.insert(orders).values(newOrder);
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
} 
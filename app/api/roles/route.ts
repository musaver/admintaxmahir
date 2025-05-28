import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminRoles } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const allRoles = await db.select().from(adminRoles);
    return NextResponse.json(allRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, permissions } = await request.json();
    
    const newRole = {
      id: uuidv4(),
      name,
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
    };
    
    await db.insert(adminRoles).values(newRole);
    
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
} 
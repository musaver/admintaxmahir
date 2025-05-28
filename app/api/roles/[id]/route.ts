import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminRoles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const role = await db.select().from(adminRoles).where(eq(adminRoles.id, params.id));
    
    if (role.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(role[0]);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, permissions } = await request.json();
    
    await db.update(adminRoles)
      .set({
        name,
        permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      })
      .where(eq(adminRoles.id, params.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(adminRoles).where(eq(adminRoles.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
} 
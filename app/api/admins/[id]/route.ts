import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { adminUsers } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
      with: {
        role: true
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Don't return password
    const { password, ...adminWithoutPassword } = admin;

    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get admin' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await req.json();
    
    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    await db
      .update(adminUsers)
      .set(data)
      .where(eq(adminUsers.id, id));

    const updatedAdmin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
      with: { role: true }
    });

    if (!updatedAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Don't return password
    const { password, ...adminWithoutPassword } = updatedAdmin;

    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, id));

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { batches } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await db.select().from(batches).where(eq(batches.id, params.id));
    
    if (batch.length === 0) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json(batch[0]);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ error: 'Failed to fetch batch' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { batchName, courseId, startDate, endDate, capacity, description, image } = await request.json();
    
    await db.update(batches)
      .set({
        batchName,
        courseId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        capacity: capacity ? Number(capacity) : null,
        description: description || null,
        image: image || null,
        updatedAt: new Date(),
      })
      .where(eq(batches.id, params.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(batches).where(eq(batches.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
} 
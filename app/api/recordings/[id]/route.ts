import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recording = await db.select().from(recordings).where(eq(recordings.id, params.id));
    
    if (recording.length === 0) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    return NextResponse.json(recording[0]);
  } catch (error) {
    console.error('Error fetching recording:', error);
    return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { recordingTitle, batchId, recordingDateTime, recordingUrl, showToAllUsers } = await request.json();
    
    // Fix datetime handling - create proper Date object from local datetime input
    const dateTimeWithSeconds = recordingDateTime.includes(':00') ? recordingDateTime : recordingDateTime + ':00';
    const recordingDate = new Date(dateTimeWithSeconds);
    
    await db.update(recordings)
      .set({
        recordingTitle,
        batchId,
        recordingDateTime: recordingDate,
        recordingUrl: recordingUrl || null,
        showToAllUsers: showToAllUsers !== undefined ? showToAllUsers : true,
        updatedAt: new Date(),
      })
      .where(eq(recordings.id, params.id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating recording:', error);
    return NextResponse.json({ error: 'Failed to update recording' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(recordings).where(eq(recordings.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
  }
} 
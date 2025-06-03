import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, id),
    });

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    return NextResponse.json(recording);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get recording' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    await db
      .update(recordings)
      .set(data)
      .where(eq(recordings.id, id));

    const updatedRecording = await db.query.recordings.findFirst({
      where: eq(recordings.id, id),
    });

    if (!updatedRecording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRecording);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update recording' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db
      .delete(recordings)
      .where(eq(recordings.id, id));

    return NextResponse.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
  }
} 
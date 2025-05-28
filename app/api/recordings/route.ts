import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordings, batches, courses } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allRecordings = await db
      .select({
        recording: recordings,
        batch: {
          id: batches.id,
          batchName: batches.batchName
        },
        course: {
          id: courses.id,
          title: courses.title
        }
      })
      .from(recordings)
      .leftJoin(batches, eq(recordings.batchId, batches.id))
      .leftJoin(courses, eq(batches.courseId, courses.id));
      
    return NextResponse.json(allRecordings);
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { recordingTitle, batchId, recordingDateTime, recordingUrl, showToAllUsers } = await request.json();
    
    // Fix datetime handling - create proper Date object from local datetime input
    // datetime-local gives us "YYYY-MM-DDTHH:MM" format
    const dateTimeWithSeconds = recordingDateTime.includes(':00') ? recordingDateTime : recordingDateTime + ':00';
    const recordingDate = new Date(dateTimeWithSeconds);
    
    const newRecording = {
      id: uuidv4(),
      recordingTitle,
      batchId,
      recordingDateTime: recordingDate,
      recordingUrl: recordingUrl || null,
      showToAllUsers: showToAllUsers !== undefined ? showToAllUsers : true,
    };
    
    await db.insert(recordings).values(newRecording);
    
    return NextResponse.json(newRecording, { status: 201 });
  } catch (error) {
    console.error('Error creating recording:', error);
    return NextResponse.json({ error: 'Failed to create recording' }, { status: 500 });
  }
} 
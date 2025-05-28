import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { zoomLinks, batches } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Always get the single zoom link record if it exists
    const zoomLink = await db
      .select({
        zoomLink: zoomLinks,
        batch: {
          id: batches.id,
          batchName: batches.batchName
        }
      })
      .from(zoomLinks)
      .leftJoin(batches, eq(zoomLinks.batchId, batches.id))
      .limit(1);
      
    return NextResponse.json(zoomLink[0] || null);
  } catch (error) {
    console.error('Error fetching zoom link:', error);
    return NextResponse.json({ error: 'Failed to fetch zoom link' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url, batchId } = await request.json();
    
    // Check if any zoom link exists in the database
    const existingLink = await db
      .select()
      .from(zoomLinks)
      .limit(1);
    
    if (existingLink.length > 0) {
      // Update the existing zoom link record
      await db
        .update(zoomLinks)
        .set({ 
          url,
          batchId,
          updatedAt: new Date()
        })
        .where(eq(zoomLinks.id, existingLink[0].id));
        
      return NextResponse.json({ message: 'Zoom link updated successfully' }, { status: 200 });
    } else {
      // Create the first zoom link record
      const newZoomLink = {
        url,
        batchId,
      };
      
      await db.insert(zoomLinks).values(newZoomLink);
      
      return NextResponse.json({ message: 'Zoom link created successfully' }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating zoom link:', error);
    return NextResponse.json({ error: 'Failed to create/update zoom link' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Delete the single zoom link record
    await db.delete(zoomLinks);
    
    return NextResponse.json({ message: 'Zoom link deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting zoom link:', error);
    return NextResponse.json({ error: 'Failed to delete zoom link' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { importJobs } from '@/lib/schema';
import { inngest } from '@/lib/inngest';
import { v4 as uuidv4 } from 'uuid';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const POST = withTenant(async (request: NextRequest, context) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;
    
    if (!file) {
      return ErrorResponses.invalidInput('No file provided');
    }

    // Validate file type (CSV only for now)
    if (!file.name.endsWith('.csv')) {
      return ErrorResponses.invalidInput('Please upload a CSV file');
    }

    // Validate file size (100MB limit for bulk imports)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return ErrorResponses.invalidInput('File too large. Maximum size is 100MB.');
    }

    // Generate unique job ID
    const jobId = uuidv4();
    
    // Upload file to Vercel Blob with public access
    const timestamp = Date.now();
    const fileName = `product-imports/${context.tenantId}/${timestamp}-${file.name}`;
    
    const blob = await put(fileName, file, {
      access: 'public', // Public access required for Vercel Blob
      addRandomSuffix: true,
    });

    // Create import job record
    const importJob = {
      id: jobId,
      tenantId: context.tenantId,
      type: 'products',
      fileName: file.name,
      blobUrl: blob.url,
      status: 'pending',
      createdBy: uploadedBy || 'unknown',
      createdAt: new Date(),
    };

    await db.insert(importJobs).values(importJob);
    console.log('✅ Import job record created:', { jobId, tenantId: context.tenantId, fileName: file.name });

    // Trigger Inngest background job
    console.log('🚀 Sending Inngest event:', {
      name: 'product/bulk-import',
      jobId,
      tenantId: context.tenantId,
      fileName: file.name
    });
    
    const inngestResult = await inngest.send({
      name: 'product/simple-import',
      data: {
        jobId,
        blobUrl: blob.url,
        tenantId: context.tenantId,
        fileName: file.name,
        uploadedBy: uploadedBy || 'unknown',
      },
    });
    
    console.log('✅ Inngest event sent:', inngestResult);

    return NextResponse.json({ 
      jobId,
      message: 'Product import job started. You will receive progress updates.',
      fileName: file.name,
      fileSize: file.size,
      estimatedProducts: Math.floor(file.size / 800), // Rough estimate: 800 bytes per product
    });

  } catch (error: any) {
    console.error('Error starting bulk product import:', error);
    return ErrorResponses.serverError(`Failed to start import: ${error.message}`);
  }
}); 
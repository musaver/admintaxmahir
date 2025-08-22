import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importJobs } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return ErrorResponses.badRequest('Job ID is required');
    }

    // Get import job details
    const [job] = await db.select()
      .from(importJobs)
      .where(eq(importJobs.id, jobId))
      .limit(1);

    if (!job) {
      return ErrorResponses.notFound('Import job not found');
    }

    // Calculate progress percentage
    const progressPercent = job.totalRecords > 0 
      ? Math.round((job.processedRecords / job.totalRecords) * 100) 
      : 0;

    // Estimate time remaining (rough calculation)
    let estimatedTimeRemaining: number | null = null;
    if (job.status === 'processing' && job.processedRecords > 0 && job.startedAt) {
      const elapsedTime = Date.now() - new Date(job.startedAt).getTime();
      const processingRate = job.processedRecords / (elapsedTime / 1000); // records per second
      const remainingRecords = job.totalRecords - job.processedRecords;
      estimatedTimeRemaining = Math.ceil(remainingRecords / processingRate);
    }

    // Format response
    const response = {
      id: job.id,
      fileName: job.fileName,
      status: job.status,
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      successfulRecords: job.successfulRecords,
      failedRecords: job.failedRecords,
      progressPercent,
      estimatedTimeRemaining,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errors: job.errors || [],
      results: job.results || null,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching import job status:', error);
    return ErrorResponses.serverError('Failed to fetch import status');
  }
}

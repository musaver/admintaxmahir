import { inngest } from '@/lib/inngest';
import { db } from '@/lib/db';
import { importJobs, user, userLoyaltyPoints } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface UserImportRow {
  name: string;
  email: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
}

interface ProcessingResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    message: string;
  }>;
  successfulUsers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

// Utility function to parse CSV
function parseCSV(csvText: string): UserImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain header and at least one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim());
  
  // Expected columns (case-insensitive)
  const columnMap = {
    'name': ['name', 'full name', 'user name'],
    'email': ['email', 'email address'],
    'buyerNTNCNIC': ['buyer ntn or cnic', 'ntn', 'cnic', 'buyer ntn/cnic'],
    'buyerBusinessName': ['buyer business name', 'business name'],
    'buyerProvince': ['buyer province', 'province'],
    'buyerAddress': ['buyer address', 'address'],
    'buyerRegistrationType': ['buyer registration type', 'registration type']
  };

  // Map header indices
  const headerMap: Record<string, number> = {};
  Object.entries(columnMap).forEach(([key, variants]) => {
    const index = header.findIndex(h => 
      variants.some(variant => h.toLowerCase() === variant.toLowerCase())
    );
    if (index !== -1) {
      headerMap[key] = index;
    }
  });

  // Validate required columns
  if (headerMap.name === undefined || headerMap.email === undefined) {
    throw new Error('Required columns missing: Name and Email are required');
  }

  // Parse data rows
  const users: UserImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    // Simple CSV parser (handles basic quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    // Extract user data
    const userData: UserImportRow = {
      name: values[headerMap.name] || '',
      email: values[headerMap.email] || '',
      buyerNTNCNIC: values[headerMap.buyerNTNCNIC] || '',
      buyerBusinessName: values[headerMap.buyerBusinessName] || '',
      buyerProvince: values[headerMap.buyerProvince] || '',
      buyerAddress: values[headerMap.buyerAddress] || '',
      buyerRegistrationType: values[headerMap.buyerRegistrationType] || '',
    };

    users.push(userData);
  }

  return users;
}

// Validate user data
function validateUser(userData: UserImportRow, rowIndex: number): string | null {
  if (!userData.name?.trim()) {
    return 'Name is required';
  }
  
  if (!userData.email?.trim()) {
    return 'Email is required';
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    return 'Invalid email format';
  }

  return null;
}

// Process users in chunks
async function processUserChunk(
  users: UserImportRow[], 
  tenantId: string, 
  startIndex: number
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    successful: 0,
    failed: 0,
    errors: [],
    successfulUsers: []
  };

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    const globalRowIndex = startIndex + i + 1; // +1 for header row

    try {
      // Validate user data
      const validationError = validateUser(userData, globalRowIndex);
      if (validationError) {
        result.errors.push({
          row: globalRowIndex,
          email: userData.email || 'N/A',
          message: validationError
        });
        result.failed++;
        continue;
      }

      // Check if user already exists in this tenant
      const existingUser = await db.select({ id: user.id })
        .from(user)
        .where(eq(user.email, userData.email.toLowerCase().trim()))
        .limit(1);

      if (existingUser.length > 0) {
        result.errors.push({
          row: globalRowIndex,
          email: userData.email,
          message: 'User with this email already exists'
        });
        result.failed++;
        continue;
      }

      // Create new user
      const newUserId = uuidv4();
      const newUser = {
        id: newUserId,
        tenantId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        userType: 'customer',
        buyerNTNCNIC: userData.buyerNTNCNIC?.trim() || null,
        buyerBusinessName: userData.buyerBusinessName?.trim() || null,
        buyerProvince: userData.buyerProvince?.trim() || null,
        buyerAddress: userData.buyerAddress?.trim() || null,
        buyerRegistrationType: userData.buyerRegistrationType?.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert user
      await db.insert(user).values(newUser);

      // Initialize loyalty points for the user
      await db.insert(userLoyaltyPoints).values({
        id: uuidv4(),
        userId: newUserId,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        availablePoints: 0,
        pendingPoints: 0,
        pointsExpiringSoon: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      result.successful++;
      result.successfulUsers.push({
        id: newUserId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim()
      });

    } catch (error: any) {
      result.errors.push({
        row: globalRowIndex,
        email: userData.email || 'N/A',
        message: error.message || 'Unknown error occurred'
      });
      result.failed++;
    }
  }

  return result;
}

// Main Inngest function
export const bulkUserImport = inngest.createFunction(
  { 
    id: 'user-bulk-import',
    concurrency: {
      limit: 10, // Allow up to 10 concurrent import jobs
    }
  },
  { event: 'user/bulk-import' },
  async ({ event, step }) => {
    const { jobId, blobUrl, tenantId, fileName } = event.data;

    // Step 1: Update job status to processing
    await step.run('update-job-status-processing', async () => {
      await db.update(importJobs)
        .set({ 
          status: 'processing',
          startedAt: new Date()
        })
        .where(eq(importJobs.id, jobId));
    });

    try {
      // Step 2: Download and parse file
      const users = await step.run('parse-file', async () => {
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        const csvText = await response.text();
        return parseCSV(csvText);
      });

      // Step 3: Update total records count
      await step.run('update-total-records', async () => {
        await db.update(importJobs)
          .set({ totalRecords: users.length })
          .where(eq(importJobs.id, jobId));
      });

      // Step 4: Process users in chunks of 50
      const CHUNK_SIZE = 50;
      const chunks: UserImportRow[][] = [];
      for (let i = 0; i < users.length; i += CHUNK_SIZE) {
        chunks.push(users.slice(i, i + CHUNK_SIZE));
      }

      let totalResults: ProcessingResult = {
        successful: 0,
        failed: 0,
        errors: [],
        successfulUsers: []
      };

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const startIndex = chunkIndex * CHUNK_SIZE;

        const chunkResult = await step.run(`process-chunk-${chunkIndex}`, async () => {
          return processUserChunk(chunk, tenantId, startIndex);
        });

        // Merge results
        totalResults.successful += chunkResult.successful;
        totalResults.failed += chunkResult.failed;
        totalResults.errors.push(...chunkResult.errors);
        totalResults.successfulUsers.push(...chunkResult.successfulUsers);

        // Update progress
        await step.run(`update-progress-${chunkIndex}`, async () => {
          await db.update(importJobs)
            .set({ 
              processedRecords: totalResults.successful + totalResults.failed,
              successfulRecords: totalResults.successful,
              failedRecords: totalResults.failed
            })
            .where(eq(importJobs.id, jobId));
        });
      }

      // Step 5: Mark job as completed
      await step.run('mark-job-completed', async () => {
        await db.update(importJobs)
          .set({ 
            status: 'completed',
            completedAt: new Date(),
            errors: totalResults.errors,
            results: {
              successful: totalResults.successful,
              failed: totalResults.failed,
              successfulUsers: totalResults.successfulUsers.slice(0, 100) // Limit stored results
            }
          })
          .where(eq(importJobs.id, jobId));
      });

      return { 
        success: true, 
        totalProcessed: totalResults.successful + totalResults.failed,
        successful: totalResults.successful,
        failed: totalResults.failed
      };

    } catch (error: any) {
      // Mark job as failed
      await step.run('mark-job-failed', async () => {
        await db.update(importJobs)
          .set({ 
            status: 'failed',
            completedAt: new Date(),
            errors: [{ row: 0, email: 'N/A', message: error.message }]
          })
          .where(eq(importJobs.id, jobId));
      });

      throw error;
    }
  }
);

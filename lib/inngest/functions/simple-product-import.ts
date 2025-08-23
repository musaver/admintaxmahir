import { inngest } from '@/lib/inngest';
import { db } from '@/lib/db';
import { importJobs, products } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface SimpleProductRow {
  name: string;
  price: string;
  description?: string;
  sku?: string;
}

// Simple CSV parser (same as user import)
function parseCSV(csvText: string): SimpleProductRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data: SimpleProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase().replace(/\s+/g, '')] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

// Simple product processing function
async function processProducts(
  products: SimpleProductRow[], 
  tenantId: string
): Promise<{ successful: number; failed: number; errors: string[] }> {
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    try {
      // Basic validation
      if (!product.name || !product.price) {
        errors.push(`Row ${i + 2}: Missing required fields (name, price)`);
        failed++;
        continue;
      }

      const price = parseFloat(product.price);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${i + 2}: Invalid price: ${product.price}`);
        failed++;
        continue;
      }

      // Create simple product record
      const productRecord = {
        id: uuidv4(),
        tenant_id: tenantId, // Use snake_case to match database schema
        name: product.name,
        price: price.toString(),
        slug: product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: product.description || '',
        sku: product.sku || '',
        is_active: true, // Use snake_case to match database schema
        created_at: new Date(), // Use snake_case to match database schema
      };

      await db.insert(products).values(productRecord);
      successful++;
      
    } catch (error: any) {
      console.error(`Error processing product ${i + 1}:`, error);
      errors.push(`Row ${i + 2}: ${error.message}`);
      failed++;
    }
  }

  return { successful, failed, errors };
}

// Production-ready Inngest function (matches user import pattern)
export const simpleProductImport = inngest.createFunction(
  { 
    id: 'simple-product-import',
    name: 'Simple Product Import (Production)',
    concurrency: {
      limit: 10, // Match user import concurrency
    }
  },
  { event: 'product/simple-import' },
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
      const productData = await step.run('parse-file', async () => {
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
          .set({ totalRecords: productData.length })
          .where(eq(importJobs.id, jobId));
      });

      // Step 4: Process products
      const result = await step.run('process-products', async () => {
        return await processProducts(productData, tenantId);
      });

      // Step 5: Mark job as completed (match user import format)
      await step.run('mark-job-completed', async () => {
        await db.update(importJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            processedRecords: productData.length,
            successfulRecords: result.successful,
            failedRecords: result.failed,
            errors: result.errors.length > 0 ? result.errors : null,
            results: {
              successful: result.successful,
              failed: result.failed,
              successfulProducts: [] // Match user import structure
            }
          })
          .where(eq(importJobs.id, jobId));
      });

      return { 
        success: true, 
        totalProcessed: productData.length,
        successful: result.successful,
        failed: result.failed
      };

    } catch (error: any) {
      // Mark job as failed (match user import error handling)
      await step.run('mark-job-failed', async () => {
        await db.update(importJobs)
          .set({ 
            status: 'failed',
            completedAt: new Date(),
            errors: [{
              message: `Import failed: ${error.message}` 
            }]
          })
          .where(eq(importJobs.id, jobId));
      });

      throw error;
    }
  }
);

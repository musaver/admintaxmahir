import { inngest } from '@/lib/inngest';
import { db } from '@/lib/db';
import { importJobs, user, userLoyaltyPoints, products } from '@/lib/schema';
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

interface ProductImportRow {
  sku: string;
  title: string;
  price: string;
  description: string;
}

interface ProcessingResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email?: string;
    identifier?: string; // Generic identifier (email for users, SKU for products)
    message: string;
  }>;
  successfulUsers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  successfulProducts?: Array<{
    id: string;
    name: string;
    sku: string;
  }>;
}

// Utility function to parse CSV for users
function parseUserCSV(csvText: string): UserImportRow[] {
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

// Utility function to parse CSV for products
function parseProductCSV(csvText: string): ProductImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain header and at least one data row');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim());
  
  // Expected columns (case-insensitive)
  const columnMap = {
    'sku': ['product sku', 'sku', 'product_sku'],
    'title': ['product title', 'title', 'name', 'product name'],
    'price': ['product price', 'price'],
    'description': ['product description', 'description']
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
  if (headerMap.sku === undefined || headerMap.title === undefined || headerMap.price === undefined) {
    throw new Error('Required columns missing: Product SKU, Product Title, and Product Price are required');
  }

  // Parse data rows
  const products: ProductImportRow[] = [];
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

    // Extract product data
    const productData: ProductImportRow = {
      sku: values[headerMap.sku] || '',
      title: values[headerMap.title] || '',
      price: values[headerMap.price] || '',
      description: values[headerMap.description] || '',
    };

    products.push(productData);
  }

  return products;
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

// Validate product data
function validateProduct(productData: ProductImportRow, rowIndex: number): string | null {
  if (!productData.sku?.trim()) {
    return 'Product SKU is required';
  }
  
  if (!productData.title?.trim()) {
    return 'Product Title is required';
  }

  if (!productData.price?.trim()) {
    return 'Product Price is required';
  }

  // Validate price is a valid number
  const price = parseFloat(productData.price);
  if (isNaN(price) || price < 0) {
    return 'Product Price must be a valid positive number';
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

// Process products in chunks
async function processProductChunk(
  products: ProductImportRow[], 
  tenantId: string, 
  startIndex: number
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    successful: 0,
    failed: 0,
    errors: [],
    successfulProducts: []
  };

  for (let i = 0; i < products.length; i++) {
    const productData = products[i];
    const globalRowIndex = startIndex + i + 1; // +1 for header row

    try {
      // Validate product data
      const validationError = validateProduct(productData, globalRowIndex);
      if (validationError) {
        result.errors.push({
          row: globalRowIndex,
          identifier: productData.sku || 'N/A',
          message: validationError
        });
        result.failed++;
        continue;
      }

      // Check if product with same SKU already exists in this tenant
      const existingProduct = await db.select({ id: products.id })
        .from(products)
        .where(eq(products.sku, productData.sku.trim()))
        .limit(1);

      if (existingProduct.length > 0) {
        result.errors.push({
          row: globalRowIndex,
          identifier: productData.sku,
          message: 'Product with this SKU already exists'
        });
        result.failed++;
        continue;
      }

      // Create new product
      const newProductId = uuidv4();
      const price = parseFloat(productData.price);
      
      const newProduct = {
        id: newProductId,
        tenantId,
        name: productData.title.trim(),
        sku: productData.sku.trim(),
        price: price.toString(),
        description: productData.description?.trim() || null,
        slug: `${productData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`,
        shortDescription: null,
        comparePrice: null,
        costPrice: null,
        images: null,
        banner: null,
        categoryId: null,
        subcategoryId: null,
        supplierId: null,
        tags: null,
        weight: null,
        dimensions: null,
        isFeatured: false,
        isActive: true,
        isDigital: false,
        requiresShipping: true,
        taxable: true,
        taxAmount: '0.00',
        taxPercentage: '0.00',
        priceIncludingTax: '0.00',
        priceExcludingTax: price.toString(),
        extraTax: '0.00',
        furtherTax: '0.00',
        fedPayableTax: '0.00',
        discount: '0.00',
        metaTitle: null,
        metaDescription: null,
        hsCode: null,
        productType: 'simple',
        variationAttributes: null,
        stockManagementType: 'quantity',
        pricePerUnit: null,
        baseWeightUnit: 'grams',
        thc: null,
        cbd: null,
        difficulty: null,
        floweringTime: null,
        yieldAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert product
      await db.insert(products).values(newProduct);

      result.successful++;
      result.successfulProducts!.push({
        id: newProductId,
        name: productData.title.trim(),
        sku: productData.sku.trim()
      });

    } catch (error: any) {
      result.errors.push({
        row: globalRowIndex,
        identifier: productData.sku || 'N/A',
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
    name: 'User Bulk Import (Production)',
    concurrency: {
      limit: 10, // Allow up to 10 concurrent import jobs
    }
  },
  { event: 'user/bulk-import' },
  async ({ event, step }) => {
    const { jobId, blobUrl, tenantId, fileName, importType = 'users' } = event.data;

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
      const parsedData = await step.run('parse-file', async () => {
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        const csvText = await response.text();
        
        if (importType === 'products') {
          return { type: 'products', data: parseProductCSV(csvText) };
        } else {
          return { type: 'users', data: parseUserCSV(csvText) };
        }
      });

      // Step 3: Update total records count
      await step.run('update-total-records', async () => {
        await db.update(importJobs)
          .set({ totalRecords: parsedData.data.length })
          .where(eq(importJobs.id, jobId));
      });

      // Step 4: Process data in chunks of 50
      const CHUNK_SIZE = 50;
      const chunks: (UserImportRow[] | ProductImportRow[])[] = [];
      for (let i = 0; i < parsedData.data.length; i += CHUNK_SIZE) {
        chunks.push(parsedData.data.slice(i, i + CHUNK_SIZE));
      }

      let totalResults: ProcessingResult = {
        successful: 0,
        failed: 0,
        errors: [],
        successfulUsers: importType === 'users' ? [] : undefined,
        successfulProducts: importType === 'products' ? [] : undefined
      };

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const startIndex = chunkIndex * CHUNK_SIZE;

        const chunkResult = await step.run(`process-chunk-${chunkIndex}`, async () => {
          if (importType === 'products') {
            return processProductChunk(chunk as ProductImportRow[], tenantId, startIndex);
          } else {
            return processUserChunk(chunk as UserImportRow[], tenantId, startIndex);
          }
        });

        // Merge results
        totalResults.successful += chunkResult.successful;
        totalResults.failed += chunkResult.failed;
        totalResults.errors.push(...chunkResult.errors);
        
        if (importType === 'users' && chunkResult.successfulUsers) {
          totalResults.successfulUsers!.push(...chunkResult.successfulUsers);
        } else if (importType === 'products' && chunkResult.successfulProducts) {
          totalResults.successfulProducts!.push(...chunkResult.successfulProducts);
        }

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
              successfulUsers: totalResults.successfulUsers?.slice(0, 100), // Limit stored results
              successfulProducts: totalResults.successfulProducts?.slice(0, 100) // Limit stored results
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

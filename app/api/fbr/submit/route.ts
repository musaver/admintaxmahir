/**
 * FBR Invoice Submission API Route
 * 
 * This endpoint handles the two-step FBR flow:
 * 1. Validate invoice data with FBR
 * 2. If valid, post invoice data to FBR
 * 
 * Returns both validation and post responses for complete audit trail.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInvoice, postInvoice } from '@/lib/fbr/client';
import { mapOrderToFbrInvoice, validateOrderForFbr } from '@/lib/fbr/mapper';
import type { Order, FbrApiResponse } from '@/lib/fbr/types';

export async function POST(req: NextRequest) {
  try {
    // Get tenant context for FBR settings
    const { getTenantContext } = await import('@/lib/api-helpers');
    const tenantContext = await getTenantContext(req);
    
    const body = await req.json();
    
    // Check if we received an FBR invoice directly or an order to convert
    let fbrInvoice;
    let customToken: string | undefined;
    
    if (body.invoiceType && body.scenarioId && body.items && 
        body.sellerNTNCNIC && body.buyerRegistrationType && 
        body.items[0]?.hsCode && body.items[0]?.rate) {
      // Direct FBR invoice payload (has all required FBR fields)
      fbrInvoice = body;
      customToken = body.fbrSandboxToken;
      console.log('📄 Received direct FBR invoice payload');
    } else {
      // Order object that needs to be converted
      const order: Order = body;
      customToken = order.fbrSandboxToken;
      const customBaseUrl = order.fbrBaseUrl;
      console.log('🔄 Converting order to FBR invoice format');
      
      // Validate order data first
      const validation = validateOrderForFbr(order);
      if (!validation.isValid) {
        return NextResponse.json({
          step: 'validation',
          ok: false,
          error: `Order validation failed: ${validation.errors.join(', ')}`,
          response: { validationResponse: { status: 'Invalid', error: validation.errors.join(', ') } },
        } as FbrApiResponse, { status: 400 });
      }
      
      // Convert order to FBR format
      try {
        fbrInvoice = await mapOrderToFbrInvoice(order);
        console.log('✅ Order converted to FBR format successfully');
      } catch (mappingError) {
        return NextResponse.json({
          step: 'mapping',
          ok: false,
          error: `Failed to convert order to FBR format: ${mappingError instanceof Error ? mappingError.message : String(mappingError)}`,
          response: { validationResponse: { status: 'Invalid', error: mappingError instanceof Error ? mappingError.message : String(mappingError) } },
        } as FbrApiResponse, { status: 400 });
      }
    }
    
    console.log('🔍 Starting FBR validation for invoice:', {
      invoiceType: fbrInvoice.invoiceType,
      scenarioId: fbrInvoice.scenarioId,
      buyerType: fbrInvoice.buyerRegistrationType,
      itemCount: fbrInvoice.items?.length || 0,
    });
    
    // Step 1: Validate invoice with FBR
    const customBaseUrl = (body as any).fbrBaseUrl;
    const validateResp = await validateInvoice(fbrInvoice, customToken, tenantContext?.tenantId, customBaseUrl);
    const validationStatus = validateResp?.validationResponse?.status;
    
    if (validationStatus !== 'Valid') {
      console.error('❌ FBR validation failed:', {
        status: validationStatus,
        error: validateResp?.validationResponse?.error,
        details: validateResp?.validationResponse?.details,
      });
      
      return NextResponse.json({
        step: 'validate',
        ok: false,
        response: validateResp,
      } as FbrApiResponse, { status: 400 });
    }
    
    console.log('✅ FBR validation successful, proceeding to post invoice');
    
    // Step 2: Post invoice to FBR
    const postResp = await postInvoice(fbrInvoice, customToken, tenantContext?.tenantId, customBaseUrl);
    
    console.log('📤 FBR post completed:', {
      success: postResp.success,
      invoiceNumber: postResp.invoiceNumber,
      message: postResp.message,
    });
    
    // Return both responses for complete audit trail
    return NextResponse.json({
      step: 'post',
      ok: true,
      response: postResp,
      validation: validateResp, // Include validation response for reference
      fbrInvoice, // Include the final FBR payload for debugging
    } as FbrApiResponse & { validation: any; fbrInvoice: any });
    
  } catch (error) {
    console.error('❌ FBR submission error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({
      step: 'error',
      ok: false,
      error: errorMessage,
      response: { validationResponse: { status: 'Invalid', error: errorMessage } },
    } as FbrApiResponse, { status: 500 });
  }
}

/**
 * GET endpoint for testing FBR connection and configuration
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const test = searchParams.get('test');
    
    if (test === 'config') {
      // Test configuration
      const { validateFbrConfig } = await import('@/lib/fbr/client');
      const config = validateFbrConfig();
      
      return NextResponse.json({
        configured: config.isValid,
        errors: config.errors,
      });
    }
    
    if (test === 'connection') {
      // Test FBR connection
      const { testFbrConnection } = await import('@/lib/fbr/client');
      const result = await testFbrConnection();
      
      return NextResponse.json(result);
    }
    
    if (test === 'sample') {
      // Generate a sample FBR invoice for testing
      const scenarioId = (searchParams.get('scenario') || 'SN026') as any;
      const { createTestFbrInvoice } = await import('@/lib/fbr/mapper');
      
      const testInvoice = await createTestFbrInvoice(scenarioId);
      
      return NextResponse.json({
        scenario: scenarioId,
        invoice: testInvoice,
      });
    }
    
    return NextResponse.json({
      message: 'FBR Submit API',
      endpoints: {
        'POST /': 'Submit invoice to FBR (validate + post)',
        'GET /?test=config': 'Test FBR configuration',
        'GET /?test=connection': 'Test FBR connection',
        'GET /?test=sample&scenario=SN026': 'Generate sample invoice',
      },
    });
    
  } catch (error) {
    console.error('❌ FBR GET endpoint error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    // Verify this is an internal request (for security)
    const isInternalRequest = request.headers.get('X-Internal-Request') === 'true';
    const userAgent = request.headers.get('User-Agent');
    
    if (!isInternalRequest || !userAgent?.includes('middleware-tenant-lookup')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }
    
    console.log('Database tenant lookup for slug:', slug);
    
    // Query the database for the tenant
    const result = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        email: tenants.email,
        phone: tenants.phone,
        plan: tenants.plan,
        status: tenants.status,
        logo: tenants.logo,
        primaryColor: tenants.primaryColor,
        settings: tenants.settings,
        maxUsers: tenants.maxUsers,
        maxProducts: tenants.maxProducts,
        maxOrders: tenants.maxOrders,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    
    const tenant = result[0] || null;
    
    console.log('Database lookup result:', {
      slug,
      found: !!tenant,
      name: tenant?.name,
      status: tenant?.status,
    });
    
    return NextResponse.json({
      tenant,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in tenant lookup API:', error);
    return NextResponse.json({
      error: 'Database lookup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      tenant: null,
    }, { status: 500 });
  }
}

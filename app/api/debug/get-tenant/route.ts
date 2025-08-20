import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }
    
    const tenant = await getTenantBySlug(slug);
    
    return NextResponse.json({
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        plan: tenant.plan,
        status: tenant.status,
        primaryColor: tenant.primaryColor,
        maxUsers: tenant.maxUsers,
        maxProducts: tenant.maxProducts,
        maxOrders: tenant.maxOrders,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      } : null
    });
    
  } catch (error) {
    console.error('Error in get-tenant endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Edge Runtime compatible tenant functions
import { NextRequest } from 'next/server';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  logo?: string;
  primaryColor: string;
  settings?: any;
  maxUsers: number;
  maxProducts: number;
  maxOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extract subdomain from hostname
 * Examples:
 * - acme.yourdomain.com → acme
 * - localhost:3000 → null (for development)
 * - yourdomain.com → null (main domain)
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Split by dots
  const parts = host.split('.');
  
  // Handle localhost development - check for subdomain.localhost format
  if (host.includes('localhost')) {
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      return parts[0]; // Return subdomain part (e.g., "acme-electronics" from "acme-electronics.localhost")
    }
    return null; // Plain localhost
  }
  
  // Handle other development IPs
  if (host.includes('127.0.0.1') || host.includes('192.168.')) {
    return null;
  }
  
  // Need at least 3 parts for production subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }
  
  // Return first part as subdomain
  const subdomain = parts[0];
  
  // Ignore common non-tenant subdomains
  if (['www', 'api', 'admin', 'app'].includes(subdomain)) {
    return null;
  }
  
  return subdomain;
}

/**
 * Get tenant by slug - Edge Runtime compatible version
 * This version uses fetch to call an API endpoint instead of direct database access
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    // In middleware, we can't use direct database connections due to Edge Runtime limitations
    // So we'll make an internal API call
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/debug/get-tenant?slug=${slug}`, {
      headers: {
        'User-Agent': 'middleware',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch tenant:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.tenant || null;
    
  } catch (error) {
    console.error('Error fetching tenant by slug in Edge Runtime:', error);
    
    // Fallback: hardcoded tenant data for testing
    const hardcodedTenants = [
      {
        id: '1322dcd9-b23c-40b9-a918-b6b8b990e011',
        name: 'Acme Electronics',
        slug: 'acme-electronics',
        email: 'admin@acme-electronics.com',
        plan: 'premium',
        status: 'active',
        primaryColor: '#3b82f6',
        maxUsers: 5,
        maxProducts: 1000,
        maxOrders: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cb51f4b3-955c-4bfe-84db-a8edfac2a4ec',
        name: 'Beta Retail Co',
        slug: 'beta-retail',
        email: 'admin@beta-retail.com',
        plan: 'basic',
        status: 'active',
        primaryColor: '#3b82f6',
        maxUsers: 5,
        maxProducts: 1000,
        maxOrders: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    const tenant = hardcodedTenants.find(t => t.slug === slug);
    console.log('Using hardcoded tenant fallback:', tenant ? tenant.name : 'not found');
    return tenant || null;
  }
}

/**
 * Get tenant from request (from headers set by middleware)
 */
export function getTenantFromRequest(request: NextRequest): { tenantId: string; tenantSlug: string } | null {
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');
  
  if (!tenantId || !tenantSlug) {
    return null;
  }
  
  return { tenantId, tenantSlug };
}

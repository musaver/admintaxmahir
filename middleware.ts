import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSubdomain, getTenantBySlug } from "@/lib/tenant";

export async function middleware(request: NextRequest) {
  // Get the pathname and hostname
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

  // Skip middleware for API routes, static files, and NextAuth routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/test') ||
    pathname.startsWith('/api/debug') ||
    pathname.startsWith('/api/loyalty') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // Extract subdomain from hostname
  const subdomain = extractSubdomain(hostname);
  
  console.log('Middleware Debug:', {
    hostname,
    subdomain,
    pathname,
    isSubdomainRequest: !!subdomain
  });

  // Handle tenant subdomain requests
  if (subdomain) {
    console.log('Processing tenant request for subdomain:', subdomain);
    
    // Get tenant information
    const tenant = await getTenantBySlug(subdomain);
    
    if (!tenant) {
      console.log('Tenant not found for subdomain:', subdomain);
      // Redirect to main site with error
      return NextResponse.redirect(new URL(`https://${hostname.replace(subdomain + '.', '')}/tenant-not-found`));
    }
    
    if (tenant.status !== 'active') {
      console.log('Tenant not active:', tenant.status);
      // Redirect to suspended page
      return NextResponse.redirect(new URL(`https://${hostname.replace(subdomain + '.', '')}/tenant-suspended`));
    }
    
    console.log('Tenant found and active:', tenant.name);
    
    // Add tenant information to request headers
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-slug', tenant.slug);
    response.headers.set('x-tenant-name', tenant.name);
    
    // Continue with authentication check for tenant
    return await handleTenantAuthentication(request, response, tenant);
  }
  
  // Handle main domain requests (marketing site, tenant registration, etc.)
  console.log('Processing main domain request');
  return handleMainDomainRequest(request);
}

async function handleTenantAuthentication(request: NextRequest, response: NextResponse, tenant: any) {
  const pathname = request.nextUrl.pathname;

  try {
    // Get token with proper error handling for Vercel
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      secureCookie: process.env.NODE_ENV === 'production',
    });

    const isAuthPage = pathname === "/login";
    const isHomePage = pathname === "/";
    const isProtectedPage = !isAuthPage && !isHomePage;

    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("Tenant Auth Debug:", {
        tenant: tenant.slug,
        path: pathname,
        hasToken: !!token,
        tokenTenantId: token?.tenantId,
        isAuthPage,
        isProtectedPage,
      });
    }

    // Check if token belongs to this tenant
    if (token && token.tenantId !== tenant.id) {
      console.log("Token tenant mismatch, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is authenticated and trying to access login page
    if (token && isAuthPage) {
      console.log("Redirecting authenticated tenant user to dashboard");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If user is not authenticated and trying to access protected page
    if (!token && isProtectedPage) {
      console.log("Redirecting unauthenticated tenant user to login");
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/") {
        loginUrl.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Add tenant info to response headers for authenticated requests
    if (token) {
      response.headers.set('x-user-tenant-id', token.tenantId || '');
    }

    return response;

  } catch (error) {
    console.error("Tenant auth middleware error:", error);
    
    if (pathname !== "/login" && pathname !== "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    return response;
  }
}

function handleMainDomainRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow marketing pages, tenant registration, etc.
  const publicPaths = [
    '/',
    '/signup',
    '/pricing', 
    '/contact',
    '/about',
    '/features',
    '/demo',
    '/blog',
    '/help',
    '/privacy',
    '/terms',
    '/tenant-not-found',
    '/tenant-suspended',
    '/api/tenants/register',
    '/api/tenants/check-subdomain'
  ];
  
  // Allow all API routes and static files
  if (publicPaths.includes(pathname) || 
      pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // For admin login on main domain, redirect to a default tenant or show tenant selector
  if (pathname === '/login') {
    // You could redirect to a tenant selector page or handle differently
    return NextResponse.next();
  }
  
  // Redirect unknown paths to home
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, and other static assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};

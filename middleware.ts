import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  
  // Check if the path is any protected admin page (all pages except login, homepage, and public assets)
  const isProtectedPage = !isAuthPage && 
    !request.nextUrl.pathname.startsWith("/api/auth") &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.startsWith("/favicon.ico") &&
    request.nextUrl.pathname !== "/";

  // Debug logging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("Middleware Debug:", {
      path: request.nextUrl.pathname,
      hasToken: !!token,
      isAuthPage,
      isProtectedPage,
      token: token ? { id: token.id, email: token.email } : null
    });
  }

  if (token && isAuthPage) {
    // ✅ Logged in user trying to access /login → redirect to main page
    console.log("Redirecting authenticated user to main page");
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && isProtectedPage) {
    // ❌ Unauthenticated user trying to access protected page → redirect to /login
    console.log("Redirecting unauthenticated user to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

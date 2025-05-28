import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  
  // Check if the path is any of the protected admin pages
  const isProtectedPage = 
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/users") ||
    request.nextUrl.pathname.startsWith("/courses") ||
    request.nextUrl.pathname.startsWith("/orders") ||
    request.nextUrl.pathname.startsWith("/admins") ||
    request.nextUrl.pathname.startsWith("/roles") ||
    request.nextUrl.pathname.startsWith("/logs") ||
    request.nextUrl.pathname === "/";  // Also protect the root path

  if (token && isAuthPage) {
    // ✅ Logged in user trying to access /auth → redirect to /dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!token && isProtectedPage) {
    // ❌ Unauthenticated user trying to access protected page → redirect to /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login", 
    "/", 
    "/dashboard/:path*", 
    "/users/:path*", 
    "/courses/:path*", 
    "/orders/:path*", 
    "/admins/:path*", 
    "/roles/:path*", 
    "/logs/:path*"
  ],
};

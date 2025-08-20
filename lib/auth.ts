import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { adminUsers, tenants } from "@/lib/schema";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import { extractSubdomain } from "@/lib/tenant";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Don't set domain for Vercel - let it auto-detect
        domain: undefined
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          // Get tenant info from request
          const hostname = req?.headers?.host || '';
          const subdomain = extractSubdomain(hostname);
          
          let tenantId = null;
          let tenantSlug = null;
          
          if (subdomain) {
            // This is a tenant login - get tenant info
            const tenant = await db
              .select()
              .from(tenants)
              .where(eq(tenants.slug, subdomain))
              .limit(1);
            
            if (!tenant[0]) {
              console.log("Tenant not found for subdomain:", subdomain);
              return null;
            }
            
            if (tenant[0].status !== 'active') {
              console.log("Tenant not active:", tenant[0].status);
              return null;
            }
            
            tenantId = tenant[0].id;
            tenantSlug = tenant[0].slug;
            
            // Find admin user for this specific tenant
            const [user_cred] = await db
              .select({
                id: adminUsers.id,
                email: adminUsers.email,
                password: adminUsers.password,
                name: adminUsers.name,
                tenantId: adminUsers.tenantId,
                role: adminUsers.role,
                roleId: adminUsers.roleId,
              })
              .from(adminUsers)
              .where(and(
                eq(adminUsers.email, credentials.email),
                eq(adminUsers.tenantId, tenantId)
              ))
              .limit(1);

            if (!user_cred) {
              console.log("Tenant admin not found:", credentials.email, "for tenant:", subdomain);
              return null;
            }

            const isValid = await bcrypt.compare(credentials.password, user_cred.password ?? "");
            if (!isValid) {
              console.log("Invalid password for tenant admin:", credentials.email);
              return null;
            }

            console.log("Tenant admin authenticated successfully:", credentials.email, "for tenant:", subdomain);
            return {
              id: user_cred.id,
              name: user_cred.name,
              email: user_cred.email,
              tenantId: tenantId,
              tenantSlug: tenantSlug,
              role: user_cred.role,
              roleId: user_cred.roleId,
            };
          } else {
            // This is main domain login - could be super admin or tenant selection
            // For now, we'll handle tenant-specific logins only
            console.log("Main domain login not implemented yet");
            return null;
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.role = (user as any).role;
        token.roleId = (user as any).roleId;
        console.log("JWT callback - setting token data:", {
          id: user.id,
          tenantId: (user as any).tenantId,
          tenantSlug: (user as any).tenantSlug
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantSlug = token.tenantSlug;
        (session.user as any).role = token.role;
        (session.user as any).roleId = token.roleId;
        console.log("Session callback - setting session data:", {
          id: token.id,
          tenantId: token.tenantId,
          tenantSlug: token.tenantSlug
        });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl });
      
      // Handle callback URLs from login redirects
      if (url.includes('callbackUrl=')) {
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          return `${baseUrl}${callbackUrl}`;
        }
      }
      
      // Always redirect to main page (/) after login - which handles redirect logic
      if (url === "/login" || url === `${baseUrl}/login`) {
        return `${baseUrl}/`;
      }
      
      // If coming from base URL, go to main page
      if (url === baseUrl) {
        return `${baseUrl}/`;
      }
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Handle absolute URLs that match the base domain
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (e) {
        // Invalid URL, fallback to homepage
        console.warn("Invalid URL in redirect callback:", url);
      }
      
      // Default: redirect to main page (homepage handles further routing)
      return `${baseUrl}/`;
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("NextAuth Debug:", code, metadata);
      }
    },
  },
}; 
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Middleware to enforce sessionVersion-based session invalidation
 * Only applies to protected app routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect routes in the (app) group
  // Public routes: /, /signin, /signup, /dive-plans (public version), /api/auth/*, /api/dive-plans/preview
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/dive-logs") ||
    pathname.startsWith("/plan") || // Protected planner route (authenticated users redirected here from /dive-plans)
    pathname.startsWith("/gear") ||
    pathname.startsWith("/certifications") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/sites") ||
    pathname.startsWith("/trips") ||
    pathname.startsWith("/logbook");

  // Skip middleware for public routes
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Skip middleware for API routes (they handle auth themselves)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  try {
    // Get JWT token from cookies
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token, redirect to signin
    if (!token) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Extract userId and sessionVersion from token
    const userId = (token.id || token.sub) as string | undefined;
    const tokenSessionVersion = (token.sessionVersion as number | undefined);

    // If userId missing, treat as unauthenticated
    if (!userId) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If sessionVersion is missing (old token), treat as unauthenticated
    // This ensures old tokens without sessionVersion are invalidated
    if (tokenSessionVersion === undefined || tokenSessionVersion === null) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(signInUrl);
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }

    // Fetch current user.sessionVersion from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true },
    });

    // If user doesn't exist, redirect to signin
    if (!user) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      // Clear session cookie
      const response = NextResponse.redirect(signInUrl);
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }

    const dbSessionVersion = (user as any).sessionVersion ?? 0;

    // If sessionVersion mismatch, token is invalid - redirect to signin
    if (tokenSessionVersion !== dbSessionVersion) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Middleware] Session version mismatch for user ${userId}: token=${tokenSessionVersion}, db=${dbSessionVersion}`
        );
      }

      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      
      // Clear session cookies to force logout
      const response = NextResponse.redirect(signInUrl);
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }

    // Session is valid, allow request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Error checking session:", error);
    // On error, allow request to proceed (fail open)
    // Individual route handlers will handle auth
    return NextResponse.next();
  }
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/* (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


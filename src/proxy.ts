import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy to enforce lightweight authentication checks for protected routes
 * Only checks token presence and basic validity (no database queries)
 * DB-backed session invalidation is handled by NextAuth JWT callback in Node.js runtime
 */
export async function proxy(request: NextRequest) {
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

  // Skip proxy for public routes
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Skip proxy for API routes (they handle auth themselves)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  try {
    // Get JWT token from cookies (edge-safe operation)
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

    // Extract userId from token
    const userId = (token.id || token.sub) as string | undefined;

    // If userId missing, treat as unauthenticated
    if (!userId) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If token is marked as invalidated by JWT callback, redirect to signin
    // (JWT callback sets token.invalidated = true when sessionVersion mismatches)
    if ((token as any).invalidated) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(signInUrl);
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }

    // If sessionVersion is missing (old token), treat as unauthenticated
    // This ensures old tokens without sessionVersion are invalidated
    const tokenSessionVersion = (token.sessionVersion as number | undefined);
    if (tokenSessionVersion === undefined || tokenSessionVersion === null) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(signInUrl);
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }

    // Token is valid, allow request to proceed
    // Note: DB-backed sessionVersion validation happens in JWT callback (Node.js runtime)
    // which marks tokens as invalidated if sessionVersion mismatches
    return NextResponse.next();
  } catch (error) {
    console.error("[Proxy] Error checking session:", error);
    // On error, allow request to proceed (fail open)
    // Individual route handlers will handle auth
    return NextResponse.next();
  }
}

// Configure which routes this proxy runs on
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


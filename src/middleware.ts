import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ac_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

// Routes that require authentication
const protectedRoutes = ["/account", "/bookings", "/orders", "/checkout", "/book"];
// Routes only for admins
const adminRoutes = ["/admin"];
// Routes that logged-in users should not see
const authRoutes = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      session = payload as { userId: string; role: string };
    } catch {
      // Invalid/expired token — treat as logged out
    }
  }

  // Redirect logged-in users away from auth pages
  if (authRoutes.some((r) => pathname.startsWith(r)) && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Require login for protected customer routes
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Require admin role for /admin routes
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};

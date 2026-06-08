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
// Routes only for technicians (also used to scope them — see below)
const technicianRoutes = ["/technician"];
// Routes that logged-in users should not see
const authRoutes = ["/login", "/register", "/forgot-password"];
// Routes a technician is ALLOWED to access (everything else redirects them to
// their calendar). Keep this list tight — the technician portal is a closed app.
const technicianAllowedPrefixes = [
  "/technician",
  "/api",
  "/_next",
  "/favicon.ico",
];

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
    const dest =
      session.role === "admin"
        ? "/admin/dashboard"
        : session.role === "technician"
          ? "/technician/calendar"
          : "/";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── Technician scoping ─────────────────────────────────────────────────────
  // Technicians can only see /technician/* — anything else bounces to calendar.
  if (session?.role === "technician") {
    const allowed = technicianAllowedPrefixes.some((p) =>
      pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p)
    );
    if (!allowed) {
      return NextResponse.redirect(
        new URL("/technician/calendar", request.url)
      );
    }
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

  // Require technician role for /technician routes
  if (technicianRoutes.some((r) => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "technician") {
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

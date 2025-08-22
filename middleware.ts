import { NextRequest, NextResponse } from "next/server";

function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  // Skip middleware for Next.js internal routes, auth, and dashboard
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/" ||
    pathname.includes("favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // For all other routes, check if this might be a mock request
  // We'll redirect to the mock handler with the domain and path
  if (host) {
    const domain = host.split(":")[0];
    const url = request.nextUrl.clone();

    // Rewrite to the mock API handler
    url.pathname = `/api/mock${pathname}`;

    // Add the domain as a header so the mock handler knows which domain this is for
    const headers = new Headers(request.headers);
    headers.set("x-mock-domain", domain);

    return NextResponse.rewrite(url, {
      request: { headers },
    });
  }

  return NextResponse.next();
}

export { middleware };

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     * - dashboard (dashboard pages)
     * - / (home page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth|dashboard).*)",
  ],
};

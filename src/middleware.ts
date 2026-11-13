import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only route guard
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login?error=UnauthorizedAdmin", req.url));
      }
    }

    // Staff portal route guard
    if (path.startsWith("/staff")) {
      if (token?.role !== "STAFF" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login?error=UnauthorizedStaff", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Public paths that do not require auth
        if (
          path === "/" ||
          path.startsWith("/movies") ||
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/api/auth") ||
          path.startsWith("/api/movies") ||
          path.startsWith("/api/shows") ||
          path.startsWith("/api/cities") ||
          path.startsWith("/api/genres") ||
          path.startsWith("/api/languages") ||
          path.startsWith("/api/docs")
        ) {
          return true;
        }

        // Protected paths require a valid session token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
    "/customer/:path*",
    "/booking/:path*/payment",
  ],
};


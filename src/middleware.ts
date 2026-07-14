import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Ensure token exists before checking roles
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // RBAC Logic
    if (path.startsWith("/patient") && token.role !== "PATIENT") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    if (path.startsWith("/doctor") && token.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  },
  {
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET || "default_secret_for_development",
    callbacks: {
      authorized: ({ req, token }) => {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*"
  ],
};

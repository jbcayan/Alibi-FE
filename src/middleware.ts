import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("accessToken")?.value;
  const role = request.cookies.get("role")?.value;

  if (pathname === "/" && role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Define route categories
  const publicRoutes = ["/login", "/register", "/privacy-policy", "/terms-of-service"];
  const authRoutes = ["/reset-password"]; // Routes that should be accessible to authenticated users
  const otpRoutes = ["/user/verify-otp"]; // OTP routes should be accessible during registration flow
  const adminRoutes = ["/admin"];
  const subscriptionRoutes = ["/subscription"];

  //  Handle OTP routes - these should be accessible even if user has some tokens
  // but not fully verified yet
  if (otpRoutes.some((route) => pathname.startsWith(route))) {
    // Allow access to OTP verification regardless of token status
    // This is needed for the registration flow
    return NextResponse.next();
  }

  // Handle public routes (login, register)
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    if (accessToken) {
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // Handle auth routes (reset-password) - allow authenticated users to access
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  //  Block unauthenticated users from protected routes
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin route guard
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  //  Let other routes pass
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

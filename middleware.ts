import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Roles that belong to the other, separate portals (user/doctor/clinic
// dashboards). Everything else — "admin", "manager", or any custom role
// label — is a valid Admin-model account and belongs on /adminDashboard.
const NON_ADMIN_PANEL_ROLES = ["user", "doctor", "clinic", "b2buser"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value?.toLowerCase();
  const { pathname } = req.nextUrl;
  const lowerPath = pathname.toLowerCase();

  // ================= ADMIN (your existing logic) =================
  if (
    (lowerPath.startsWith("/dashboard") ||
      lowerPath.startsWith("/admindashboard")) &&
    !token
  ) {
    return NextResponse.redirect(new URL("/adminlogin", req.url));
  }

  if (token) {
    if (lowerPath.startsWith("/adminlogin")) {
      if (role === "superadmin") {
        return NextResponse.redirect(new URL("/Dashboard", req.url));
      }
      if (role && !NON_ADMIN_PANEL_ROLES.includes(role)) {
        return NextResponse.redirect(new URL("/adminDashboard", req.url));
      }
    }

    if (lowerPath.startsWith("/dashboard") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/adminlogin", req.url));
    }

    if (lowerPath.startsWith("/admindashboard") && NON_ADMIN_PANEL_ROLES.includes(role || "")) {
      return NextResponse.redirect(new URL("/adminlogin", req.url));
    }
  }

  // ================= BUSINESS (CLINIC + DOCTOR + B2B USER) =================
  if (
    (lowerPath.startsWith("/clinicdashboard") ||
      lowerPath.startsWith("/doctordashboard") ||
      lowerPath.startsWith("/b2buserdashboard")) &&
    !token
  ) {
    return NextResponse.redirect(new URL("/businesslogin", req.url));
  }

  if (token) {
    if (lowerPath.startsWith("/businesslogin")) {
      if (role === "clinic") {
        return NextResponse.redirect(new URL("/ClinicDashboard", req.url));
      }
      if (role === "doctor") {
        return NextResponse.redirect(new URL("/DoctorDashboard", req.url));
      }
      if (role === "b2buser") {
        return NextResponse.redirect(new URL("/B2BUserDashboard", req.url));
      }
    }

    if (lowerPath.startsWith("/clinicdashboard") && role !== "clinic") {
      return NextResponse.redirect(new URL("/businesslogin", req.url));
    }

    if (lowerPath.startsWith("/doctordashboard") && role !== "doctor") {
      return NextResponse.redirect(new URL("/businesslogin", req.url));
    }

    if (lowerPath.startsWith("/b2buserdashboard") && role !== "b2buser") {
      return NextResponse.redirect(new URL("/businesslogin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/Dashboard/:path*",
    "/adminDashboard/:path*",
    "/adminlogin",
    "/ClinicDashboard/:path*",
    "/DoctorDashboard/:path*",
    "/B2BUserDashboard/:path*",
    "/businesslogin",
  ],
};

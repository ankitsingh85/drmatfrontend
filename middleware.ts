import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Roles that belong to the other, separate portals (user/doctor/clinic
// dashboards). Everything else — "admin", "manager", or any custom role
// label — is a valid Admin-model account and belongs on /adminDashboard.
const NON_ADMIN_PANEL_ROLES = ["user", "doctor", "clinic"];

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

  // ================= CLINIC =================
  if (lowerPath.startsWith("/clinicdashboard") && !token) {
    return NextResponse.redirect(new URL("/cliniclogin", req.url));
  }

  if (token) {
    if (lowerPath.startsWith("/cliniclogin") && role === "clinic") {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    if (lowerPath.startsWith("/clinicdashboard") && role !== "clinic") {
      return NextResponse.redirect(new URL("/cliniclogin", req.url));
    }
  }

  // ================= DOCTOR =================
  if (lowerPath.startsWith("/doctordashboard") && !token) {
    return NextResponse.redirect(new URL("/doctorlogin", req.url));
  }

  if (token) {
    if (lowerPath.startsWith("/doctorlogin") && role === "doctor") {
      return NextResponse.redirect(new URL("/DoctorDashboard", req.url));
    }

    if (lowerPath.startsWith("/doctordashboard") && role !== "doctor") {
      return NextResponse.redirect(new URL("/doctorlogin", req.url));
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
    "/cliniclogin",
    "/DoctorDashboard/:path*",
    "/doctorlogin",
  ],
};

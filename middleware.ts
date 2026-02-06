import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
      if (role === "admin") {
        return NextResponse.redirect(new URL("/adminDashboard", req.url));
      }
    }

    if (lowerPath.startsWith("/dashboard") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/adminlogin", req.url));
    }

    if (lowerPath.startsWith("/admindashboard") && role !== "admin") {
      return NextResponse.redirect(new URL("/adminlogin", req.url));
    }
  }

  // ================= CLINIC =================
  if (lowerPath.startsWith("/clinicdashboard") && !token) {
    return NextResponse.redirect(new URL("/cliniclogin", req.url));
  }

  if (token) {
    if (lowerPath.startsWith("/cliniclogin") && role === "clinic") {
      return NextResponse.redirect(new URL("/ClinicDashboard", req.url));
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

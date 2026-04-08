import React, { useEffect, useState } from "react";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import CourseListing from "@/components/Layout/CourseListing";
import Cookies from "js-cookie";
import { useRouter } from "next/router";

const CourseListingPage = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isClinicRole, setIsClinicRole] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const role = Cookies.get("role")?.toLowerCase();
    const allowed = role === "clinic";
    setIsClinicRole(allowed);
    if (!allowed) {
      router.replace("/home");
    }
  }, [isHydrated, router]);

  if (!isHydrated || !isClinicRole) {
    return null;
  }

  return (
    <>
      <Topbar />
      <CourseListing />
      <Footer />
    </>
  );
};

export default CourseListingPage;

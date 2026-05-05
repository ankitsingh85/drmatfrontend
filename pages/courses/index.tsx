"use client";

import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import CourseListing from "@/components/Layout/CourseListing";

const CoursesPage = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBusinessRole, setIsBusinessRole] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const role = Cookies.get("role")?.toLowerCase();
    const allowed = role === "clinic" || role === "doctor";
    setIsBusinessRole(allowed);

    if (!allowed) {
      router.replace("/home");
    }
  }, [isHydrated, router]);

  if (!isHydrated || !isBusinessRole) {
    return null;
  }

  return (
    <>
      <Topbar />
      <main style={{ backgroundColor: "#ffffff" }}>
        <CourseListing showAll title="All Courses" showSeeMore={false} />
      </main>
      <Footer />
    </>
  );
};

export default CoursesPage;

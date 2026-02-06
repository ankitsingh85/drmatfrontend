"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import styles from "@/styles/dashboard.module.css";
import { FiUsers, FiUserPlus, FiLogOut, FiMenu, FiX } from "react-icons/fi";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import ListOfAppointments from "@/components/DoctorAdmin/ListOfAppointments";
import ProfileEdit from "@/components/DoctorAdmin/ProfileEdit";
import Ratings from "@/components/DoctorAdmin/Ratings";
import { API_URL } from "@/config/api";

// ✅ Use environment variable for API base URL
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const DoctorDashboard = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashBoard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [doctor, setDoctor] = useState<{ name?: string; email?: string }>({});

  // ✅ Check auth + fetch doctor profile
  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");

    if (!token || role !== "doctor") {
      router.replace("/doctorlogin");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDoctor(data);
        }
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
      }
    };

    fetchProfile();
  }, [router]);

  // ✅ Logout
  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    router.replace("/doctorlogin");
  };

  // ✅ Responsive check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Prevent background scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen && isMobile ? "hidden" : "auto";
  }, [sidebarOpen, isMobile]);

  return (
    <>
      <Topbar hideHamburgerOnMobile />

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <div className={styles.mobileTopbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      )}

      <div className={styles.wrapper}>
        <div className={styles.mainArea}>
          {/* Sidebar */}
          <aside
            className={`${styles.sidebar} ${
              isMobile
                ? sidebarOpen
                  ? styles.sidebarMobile
                  : styles.sidebarHidden
                : ""
            }`}
          >
            <p className={styles.sectionTitle}>Menu</p>
            <ul className={styles.menu}>
              <li
                onClick={() => {
                  setActiveSection("dashBoardlist");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUsers className={styles.icon} />
                  <span className={styles.label}>Dashboard</span>
                </span>
              </li>

              <p className={styles.sectionTitle}>List</p>
              <li
                onClick={() => {
                  setActiveSection("appointmentlist");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Appointments List</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("profileedit");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Profile Edit</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("ratings");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Ratings</span>
                </span>
              </li>
            </ul>

            {/* ✅ Logout Button */}
            <button className={styles.logoutButton} onClick={handleLogout}>
              <span className={styles.iconLabel}>
                <FiLogOut className={styles.icon} />
                <span className={styles.label}>Logout</span>
              </span>
            </button>
          </aside>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* ✅ Welcome Section */}
            <div className={styles.welcomeBox}>
              <h2>Welcome, {doctor.name || "Doctor"} 👋</h2>
              <p>{doctor.email}</p>
            </div>

            {activeSection === "appointmentlist" && <ListOfAppointments />}
            {activeSection === "profileedit" && <ProfileEdit />}
            {activeSection === "ratings" && <Ratings />}
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
};

export default DoctorDashboard;

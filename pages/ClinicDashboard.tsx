"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import styles from "@/styles/dashboard.module.css";
import { FiUsers, FiUserPlus, FiLogOut, FiMenu, FiX } from "react-icons/fi";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";

import Appointment from "@/components/ClinicAdmin/Appointment";
import Doctors from "@/components/ClinicAdmin/Doctors";
import ProfileSection from "@/components/ClinicAdmin/EditClinic";
import ClinicServices from "@/components/ClinicAdmin/CreateServices";
import ListOfAppointments from "@/components/ClinicAdmin/ListOfAppointments";
import ListOfDoctors from "@/components/ClinicAdmin/ListOfDoctors";
import ListOfServices from "@/components/ClinicAdmin/ListOfServices";
import ClinicDasboardList from "@/components/ClinicAdmin/ClinicDashboardList";
import PurchasedServices from "@/components/ClinicAdmin/PurchasedServices";

const ClinicDashboard = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashBoard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Check token on mount
  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");
    if (!token || role !== "clinic") {
      router.replace("/cliniclogin");
    }
  }, [router]);

  // ✅ Handle logout → clear cookies
  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    router.replace("/cliniclogin");
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

              <p className={styles.sectionTitle}>Create</p>
              <li
                onClick={() => {
                  setActiveSection("appointment");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Appointments</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("doctors");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Doctors</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("profilesection");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Edit Clinic</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("clinicsecrvies");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Create Services</span>
                </span>
              </li>

              <p className={styles.sectionTitle}>List</p>
              <li
                onClick={() => {
                  setActiveSection("listofappointments");
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
                  setActiveSection("listofdoctors");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Doctors List</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("serviceslist");
                  setSidebarOpen(false);
                }}
                className={styles.menuItem}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Services List</span>
                </span>
              </li>



              <li
  onClick={() => {
    setActiveSection("purchasedservices");
    setSidebarOpen(false);
  }}
  className={styles.menuItem}
>
  <span className={styles.iconLabel}>
    <FiUsers className={styles.icon} />
    <span className={styles.label}>Purchased Services</span>
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
            {activeSection === "dashBoardlist" && <ClinicDasboardList />}
            {activeSection === "appointment" && <Appointment />}
            {activeSection === "doctors" && <Doctors />}
            {activeSection === "profilesection" && <ProfileSection />}
            {activeSection === "clinicsecrvies" && <ClinicServices />}
            {activeSection === "listofappointments" && <ListOfAppointments />}
            {activeSection === "listofdoctors" && <ListOfDoctors />}
            {activeSection === "serviceslist" && <ListOfServices />}
            {activeSection === "purchasedservices" && <PurchasedServices />}

          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
};

export default ClinicDashboard;

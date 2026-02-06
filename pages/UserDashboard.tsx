"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import styles from "@/styles/userdashboard.module.css";
import {
  FiUsers,
  FiUserPlus,
  FiLogOut,
  FiMenu,
  FiX,
  FiClipboard,
} from "react-icons/fi";
import ServiceHistory from "@/components/UserPanel/ServiceHistory";
import { API_URL } from "@/config/api";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import UserProfile from "@/components/UserPanel/UserProfile";
import OrderHistory from "@/components/UserPanel/OrderHistory";
import AppointmentHistory from "@/components/UserPanel/AppointmentHistory";
import Prescription from "@/components/UserPanel/Prescription";

interface User {
  name?: string;
  email?: string;
}

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const UserDashboard: React.FC = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User>({});
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  // ✅ Fetch user info & profile check
  useEffect(() => {
    const token = Cookies.get("token");
    const username = Cookies.get("username");
    const email = Cookies.get("email");

    if (!token) {
      router.replace("/Login");
      return;
    }

    const checkProfile = async (userEmail: string) => {
      try {
        const res = await fetch(`${API_URL}/userprofile/${userEmail}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data._id) {
            setHasProfile(true);
            Cookies.set("userId", data._id);
          } else {
            setHasProfile(false);
          }
        } else {
          setHasProfile(false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
        setHasProfile(false);
      }
    };

    if (username && email) {
      setUser({ name: username, email });
      checkProfile(email);
      setLoading(false);
    } else {
      const fetchFromToken = async () => {
        try {
          const res = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser({ name: data.name, email: data.email });
            Cookies.set("username", data.name || "");
            Cookies.set("email", data.email || "");
            checkProfile(data.email);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchFromToken();
    }
  }, [router]);

  // ✅ Logout
  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("username");
    Cookies.remove("email");
    Cookies.remove("userId");
    router.replace("/Login");
  };

  // ✅ Responsive sidebar
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen && isMobile ? "hidden" : "auto";
  }, [sidebarOpen, isMobile]);

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Topbar hideHamburgerOnMobile />

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
                  setActiveSection("dashboard");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${
                  activeSection === "dashboard" ? styles.active : ""
                }`}
              >
                <FiUsers className={styles.icon} />
                <span className={styles.label}>Dashboard</span>
              </li>

              <p className={styles.sectionTitle}>List</p>

              <li
                onClick={() => {
                  setActiveSection("userprofile");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${
                  activeSection === "userprofile" ? styles.active : ""
                }`}
              >
                <FiUserPlus className={styles.icon} />
                <span className={styles.label}>User Profile</span>
              </li>

              <li
                onClick={() => {
                  setActiveSection("orderhistory");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${
                  activeSection === "orderhistory" ? styles.active : ""
                }`}
              >
                <FiClipboard className={styles.icon} />
                <span className={styles.label}>Order History</span>
              </li>

              <li
                onClick={() => {
                  setActiveSection("appointmenthistory");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${
                  activeSection === "appointmenthistory" ? styles.active : ""
                }`}
              >
                <FiClipboard className={styles.icon} />
                <span className={styles.label}>Appointment History</span>
              </li>



<li
  onClick={() => {
    setActiveSection("servicehistory");
    setSidebarOpen(false);
  }}
  className={`${styles.menuItem} ${
    activeSection === "servicehistory" ? styles.active : ""
  }`}
>
  <FiClipboard className={styles.icon} />
  <span className={styles.label}>Service History</span>
</li>


<li
  onClick={() => {
    setActiveSection("prescription");
    setSidebarOpen(false);
  }}
  className={`${styles.menuItem} ${
    activeSection === "prescription" ? styles.active : ""
  }`}
>
  <FiClipboard className={styles.icon} />
  <span className={styles.label}>Prescription</span>
</li>



            </ul>

            <button className={styles.logoutButton} onClick={handleLogout}>
              <FiLogOut className={styles.icon} />
              <span className={styles.label}>Logout</span>
            </button>
          </aside>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {activeSection === "dashboard" && (
              <div className={styles.welcomeBox}>
                <h2>Welcome, {user.name || "User"} 👋</h2>

                {/* If profile not filled */}
                {!hasProfile && (
                  <p className={styles.fillDetails}>
                    It looks like you haven’t filled your profile details yet.{" "}
                    <button
                      className={styles.linkButton}
                      onClick={() => setActiveSection("userprofile")}
                    >
                      Click here to fill your details
                    </button>
                  </p>
                )}
              </div>
            )}

            {activeSection === "userprofile" && (
              <UserProfile
                showFormInitially={!hasProfile}
                userEmail={user.email || ""}
                onProfileSaved={() => setHasProfile(true)} // ✅ update dashboard
              />
            )}

            {activeSection === "orderhistory" && <OrderHistory />}
            {activeSection === "appointmenthistory" && <AppointmentHistory />}
            {activeSection === "servicehistory" && <ServiceHistory />}
{activeSection === "prescription" && <Prescription />}

          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
};

export default UserDashboard;

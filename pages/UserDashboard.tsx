"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import styles from "@/styles/userdashboard.module.css";
import {
  FiHome,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronRight,
  FiHelpCircle,
  FiSettings,
  FiStar,
  FiActivity,
  FiUser,
} from "react-icons/fi";

import ServiceHistory from "@/components/UserPanel/ServiceHistory";
import OrderHistory from "@/components/UserPanel/OrderHistory";
import TreatmentOrderHistory from "@/components/UserPanel/TreatmentOrderHistory";
import AppointmentHistory from "@/components/UserPanel/AppointmentHistory";
import UserProfile from "@/components/UserPanel/UserProfile";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { API_URL } from "@/config/api";
import { useTopbarProfile } from "@/context/TopbarProfileContext";

const normalizeProfileImage = (img?: string | null) => {
  if (!img) return null;
  if (/^data:image\//i.test(img)) return img;
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("/")) return `${API_URL}${img}`;
  return `${API_URL}/${img}`;
};

interface User {
  name?: string;
  email?: string;
  contactNo?: string;
  profileImage?: string;
}

const UserDashboard: React.FC = () => {
  const router = useRouter();
  const profile = useTopbarProfile();

  const [activeSection, setActiveSection] = useState("orderhistory");
  const [activeSectionTitle, setActiveSectionTitle] = useState("Orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User>({});
  const [loading, setLoading] = useState(true);
  const [profileKey, setProfileKey] = useState(0);

  /* ================= FETCH USER ================= */
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.replace("/Login");
      return;
    }

    const fetchUser = async () => {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // 🔐 token expired or invalid
      if (res.status === 401 || res.status === 403) {
        Cookies.remove("token");
        router.replace("/Login");
        return;
      }

      console.error("Failed to load user:", res.status);
      setLoading(false);
      return;
    }

    const data = await res.json();

    setUser({
      name: data.name,
      email: data.email,
      contactNo: data.contactNo,
      profileImage: normalizeProfileImage(data.profileImage) || data.profileImage || undefined,
    });

    Cookies.set("username", data.name || "");
    Cookies.set("email", data.email || "");
    Cookies.set("contactNo", data.contactNo || "");
  } catch (err) {
    console.error("User fetch error:", err);
  } finally {
    setLoading(false);
  }
};

    fetchUser();
  }, [router]);

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("username");
    Cookies.remove("clinicName");
    Cookies.remove("clinicId");
    Cookies.remove("email");
    Cookies.remove("userId");
    Cookies.remove("location");
    Cookies.remove("contactNo");
    Cookies.remove("profileImage");
    Cookies.remove("role");

    localStorage.removeItem("userId");
    localStorage.removeItem("clinicId");
    localStorage.removeItem("profileImage");

    profile?.clearProfile();
    window.dispatchEvent(new CustomEvent("user-logged-out"));

    router.replace("/Login");
  };

  /* ================= RESPONSIVE ================= */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen && isMobile ? "hidden" : "auto";
  }, [sidebarOpen, isMobile]);

  /* ================= MENU ================= */
  const menuItems = [
    { id: "orderhistory", label: "Orders", icon: <FiHome /> },
    { id: "treatmentorders", label: "Treatment Orders", icon: <FiHome /> },
    { id: "yourresult", label: "Your Result", icon: <FiActivity /> },
    { id: "appointmenthistory", label: "Appointments", icon: <FiActivity /> },
    { id: "servicehistory", label: "My Consultation", icon: <FiUser /> },
    { id: "helpcenter", label: "Help Center", icon: <FiHelpCircle /> },
    { id: "settings", label: "Settings", icon: <FiSettings /> },
    { id: "rating", label: "Like Us? Give us 5 Stars", icon: <FiStar /> },
  ];

  /* ================= CONTENT ================= */
  const renderSection = () => {
    if (activeSection === "userprofile") {
      return (
        <UserProfile
          key={profileKey} // 🔥 ALWAYS REMOUNT
          userEmail={user.email || ""}
          onProfileSaved={(updatedUser) => {
            if (!updatedUser) return;
            setUser((prev) => ({ ...prev, ...updatedUser }));
          }}
        />
      );
    }

    if (activeSection === "orderhistory") return <OrderHistory mode="all" />;
    if (activeSection === "treatmentorders") return ;
    if (activeSection === "yourresult") return (
      <div className={styles.comingSoonCard}>
        <h3>{activeSectionTitle}</h3>
        <p>Your treatment results will appear here soon.</p>
      </div>
    );
    if (activeSection === "appointmenthistory") return <AppointmentHistory />;
    if (activeSection === "servicehistory") return <ServiceHistory />;

    return (
      <div className={styles.comingSoonCard}>
        <h3>{activeSectionTitle}</h3>
        <p>This section is coming soon.</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  /* ================= UI ================= */
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
          <aside
            className={`${styles.sidebar} ${
              isMobile
                ? sidebarOpen
                  ? styles.sidebarMobile
                  : styles.sidebarHidden
                : ""
            }`}
          >
            {/* ===== PROFILE ===== */}
            <div className={styles.sidebarProfile}>
              <div className={styles.avatarCircle}>
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    className={styles.avatarImage}
                    alt="Profile"
                  />
                ) : (
                  user.name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className={styles.profileMeta}>
                <p className={styles.profileName}>{user.name}</p>
                <p className={styles.profilePhone}>
                  {user.contactNo || user.email}
                </p>
              </div>
            </div>

            <button
              className={styles.editProfileBtn}
              onClick={() => {
                setActiveSection("userprofile");
                setActiveSectionTitle("Edit Profile");
                setProfileKey((k) => k + 1); // 🔥 ALWAYS OPENS
                setSidebarOpen(false);
              }}
            >
              Edit Profile
            </button>

            <ul className={styles.menu}>
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setActiveSectionTitle(item.label);
                    setSidebarOpen(false);
                  }}
                  className={`${styles.menuItem} ${
                    activeSection === item.id ? styles.active : ""
                  }`}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                  <FiChevronRight className={styles.chevron} />
                </li>
              ))}
            </ul>

            <button className={styles.logoutButton} onClick={handleLogout}>
              <FiLogOut className={styles.icon} />
              <span className={styles.label}>Logout</span>
            </button>
          </aside>

          <div className={styles.mainContent}>{renderSection()}</div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
};

export default UserDashboard;

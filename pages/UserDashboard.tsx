"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import styles from "@/styles/userdashboard.module.css";
import {
  FiHome,
  FiCalendar,
  FiEdit2,
  FiLogOut,
  FiMenu,
  FiX,
  FiFileText,
  FiChevronRight,
  FiCreditCard,
  FiHelpCircle,
  FiSettings,
  FiStar,
  FiActivity,
  FiBookOpen,
  FiUser,
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
  contactNo?: string;
  profileImage?: string;
}

const UserDashboard: React.FC = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("orderhistory");
  const [activeSectionTitle, setActiveSectionTitle] = useState("My Orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User>({});
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    const username = Cookies.get("username");
    const email = Cookies.get("email");
    const contactNo = Cookies.get("contactNo");
    const profileImage = Cookies.get("profileImage");

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
      } catch {
        setHasProfile(false);
      }
    };

    if (username && email) {
      setUser({ name: username, email, contactNo: contactNo || "", profileImage: profileImage || "" });
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
            setUser({
              name: data.name,
              email: data.email,
              contactNo: data.contactNo,
              profileImage: data.profileImage,
            });
            Cookies.set("username", data.name || "");
            Cookies.set("email", data.email || "");
            Cookies.set("contactNo", data.contactNo || "");
            Cookies.set("profileImage", data.profileImage || "");
            checkProfile(data.email);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchFromToken();
    }
  }, [router]);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("username");
    Cookies.remove("email");
    Cookies.remove("userId");
    Cookies.remove("contactNo");
    Cookies.remove("profileImage");
    router.replace("/Login");
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen && isMobile ? "hidden" : "auto";
  }, [sidebarOpen, isMobile]);

  const menuItems = [
    { id: "orderhistory", label: "My Orders", icon: <FiHome /> },
    { id: "labtest", label: "My Lab Test", icon: <FiCalendar /> },
    { id: "testbooking", label: "Test Booking", icon: <FiEdit2 /> },
    { id: "appointmenthistory", label: "Orders", icon: <FiActivity /> },
    { id: "servicehistory", label: "My Consultation", icon: <FiUser /> },
    { id: "medicalrecords", label: "Medical Records", icon: <FiFileText /> },
    { id: "payments", label: "Manage Payment Methods", icon: <FiCreditCard /> },
    { id: "health", label: "Read About Health", icon: <FiBookOpen /> },
    { id: "helpcenter", label: "Help Center", icon: <FiHelpCircle /> },
    { id: "settings", label: "Settings", icon: <FiSettings /> },
    { id: "rating", label: "Like Us? Give us 5 Stars", icon: <FiStar /> },
    { id: "prescription", label: "Prescription", icon: <FiFileText /> },
  ];

  const renderSection = () => {
    if (activeSection === "userprofile") {
      return (
        <UserProfile
          showFormInitially={true}
          userEmail={user.email || ""}
          onProfileSaved={(updatedUser) => {
            setHasProfile(true);
            if (!updatedUser) return;
            setUser((prev) => ({
              ...prev,
              ...updatedUser,
            }));
          }}
        />
      );
    }
    if (activeSection === "orderhistory") return <OrderHistory />;
    if (activeSection === "appointmenthistory") return <AppointmentHistory />;
    if (activeSection === "servicehistory") return <ServiceHistory />;
    if (activeSection === "prescription") return <Prescription />;

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

  return (
    <>
      <Topbar hideHamburgerOnMobile />

      {isMobile && (
        <div className={styles.mobileTopbar}>
          <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      )}

      <div className={styles.wrapper}>
        <div className={styles.mainArea}>
          <aside
            className={`${styles.sidebar} ${
              isMobile ? (sidebarOpen ? styles.sidebarMobile : styles.sidebarHidden) : ""
            }`}
          >
            <div className={styles.sidebarProfile}>
              <div className={styles.avatarCircle}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt="User" className={styles.avatarImage} />
                ) : (
                  user.name?.slice(0, 1).toUpperCase() || "U"
                )}
              </div>
              <div className={styles.profileMeta}>
                <p className={styles.profileName}>{user.name || "Jane Doe"}</p>
                <p className={styles.profilePhone}>{user.contactNo ? `+91 ${user.contactNo}` : user.email}</p>
              </div>
            </div>

            <button
              className={styles.editProfileBtn}
              onClick={() => {
                setActiveSection("userprofile");
                setActiveSectionTitle("Edit Profile");
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
                  className={`${styles.menuItem} ${activeSection === item.id ? styles.active : ""}`}
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

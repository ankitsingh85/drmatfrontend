"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import CreateCategory from "@/components/AdminPanel/CreateProductCategory";
import CreateClinic from "@/components/AdminPanel/CreateClinic";
import CreateProduct from "@/components/AdminPanel/CreateProduct";
import Dashboard from "@/components/AdminPanel/Dashboard";
import ListOfCategory from "@/components/AdminPanel/ListOfCategory";
import ListOfClinic from "@/components/AdminPanel/ListOfClinic";
import ListOfProduct from "@/components/AdminPanel/ListOfProduct";

import styles from "@/styles/dashboard.module.css";
import { FiUsers, FiUserPlus, FiList, FiMenu, FiX, FiLogOut } from "react-icons/fi";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import CreateDoctor from "@/components/AdminPanel/CreateDoctor";
import ListOfDoctor from "@/components/AdminPanel/ListOfDoctor";
import Test from "@/components/AdminPanel/Test";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("dashBoard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ Auth check using role cookie
  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role")?.toLowerCase();

    if (!token || role !== "admin") {
      Cookies.remove("token");
      Cookies.remove("role");
      router.replace("/adminlogin");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

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

  // ✅ Logout
  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    router.replace("/adminlogin");
  };

  if (checkingAuth) {
    return (
      <div className={styles.loading}>
        <p>Loading dashboard…</p>
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
          {/* Sidebar */}
          <aside
            className={`${styles.sidebar} ${
              isMobile ? (sidebarOpen ? styles.sidebarMobile : styles.sidebarHidden) : ""
            }`}
          >
            <p className={styles.sectionTitle}>Menu</p>
            <ul className={styles.menu}>
              <li
                onClick={() => {
                  setActiveSection("dashBoard");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "dashBoard" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiUsers className={styles.icon} />
                  <span className={styles.label}>Dashboard</span>
                </span>
              </li>

              <p className={styles.sectionTitle}>Create</p>
              <li
                onClick={() => {
                  setActiveSection("createCategory");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "createCategory" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Create Category</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("createClinic");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "createClinic" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Create Clinic</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("createProduct");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "createProduct" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Create Product</span>
                </span>
              </li>


              <li
                onClick={() => {
                  setActiveSection("createdoctor");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "createdoctor" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiUserPlus className={styles.icon} />
                  <span className={styles.label}>Create Doctor</span>
                </span>
              </li>


              <p className={styles.sectionTitle}>List</p>
              <li
                onClick={() => {
                  setActiveSection("listOfCategory");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "listOfCategory" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiList className={styles.icon} />
                  <span className={styles.label}>List of Category</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("listOfClinic");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "listOfClinic" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiList className={styles.icon} />
                  <span className={styles.label}>List of Clinic</span>
                </span>
              </li>
              <li
                onClick={() => {
                  setActiveSection("listOfProduct");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "listOfProduct" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiList className={styles.icon} />
                  <span className={styles.label}>List of Product</span>
                </span>
              </li>


<li
                onClick={() => {
                  setActiveSection("listofdoctor");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "listofdoctor" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiList className={styles.icon} />
                  <span className={styles.label}>List of Doctor</span>
                </span>
              </li>


              <li
                onClick={() => {
                  setActiveSection("test");
                  setSidebarOpen(false);
                }}
                className={`${styles.menuItem} ${activeSection === "test" ? styles.active : ""}`}
              >
                <span className={styles.iconLabel}>
                  <FiList className={styles.icon} />
                  <span className={styles.label}>Create Quiz</span>
                </span>
              </li>

            </ul>

            <button className={styles.logoutButton} onClick={handleLogout}>
              <span className={styles.iconLabel}>
                <FiLogOut className={styles.icon} />
                <span className={styles.label}>Logout</span>
              </span>
            </button>
          </aside>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {activeSection === "dashBoard" && <Dashboard />}
            {activeSection === "createCategory" && <CreateCategory />}
            {activeSection === "createClinic" && <CreateClinic />}
            {activeSection === "createProduct" && <CreateProduct />}

            {activeSection === "listOfCategory" && <ListOfCategory />}
            {activeSection === "listOfClinic" && <ListOfClinic />}
            {activeSection === "listOfProduct" && <ListOfProduct />}
            {activeSection === "createdoctor" && <CreateDoctor/>}
            {activeSection === "listofdoctor" && <ListOfDoctor/>}

                       {activeSection === "test" && <Test/>}
          </div>
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}

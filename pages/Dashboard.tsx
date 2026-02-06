"use client";
import Image from "next/image";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import CreateAdmin from "@/components/AdminPanel/CreateAdmin";
import CreateCategory from "@/components/AdminPanel/CreateProductCategory";
import CreateClinicCategory from "@/components/AdminPanel/CreateClinicCategory";
import CreateClinic from "@/components/AdminPanel/CreateClinic";
import CreateProduct from "@/components/AdminPanel/CreateProduct";
import Dashboard from "@/components/AdminPanel/Dashboard";
import ListOfAdmin from "@/components/AdminPanel/ListOfAdmin";
import ListOfCategory from "@/components/AdminPanel/ListOfCategory";
import ListOfClinicCategory from "@/components/AdminPanel/ListOfClinicCategory";
import ListOfClinic from "@/components/AdminPanel/ListOfClinic";
import ListOfProduct from "@/components/AdminPanel/ListOfProduct";
import CreateServiceCategory from "@/components/AdminPanel/CreateServiceCategory";
import ListOfServiceCategory from "@/components/AdminPanel/ListOfServiceCategory";
import ListOfTopProduct from "@/components/AdminPanel/ListOfTopProduct";
import UpdateOffer from "@/components/AdminPanel/UpdateOffer";
import LatestUpdateOffer from "@/components/AdminPanel/LatestUpdateOffer";
import LatestShorts from "@/components/AdminPanel/LatestShorts";
import TreatmentShorts from "@/components/AdminPanel/TreatmentShorts";
import CreateTreatment from "@/components/AdminPanel/CreateTreatment";
import CreatePatient from "@/components/AdminPanel/CreatePatient";
import CreateTestResult from "@/components/AdminPanel/CreateTestResult";
import CreateOnlineDoctor from "@/components/AdminPanel/CreateOnlineDoctor";
import CreateB2BProduct from "@/components/AdminPanel/CreateB2BProduct";
import CreateSupport from "@/components/AdminPanel/CreateSupport";
import UserOrderHistory from "@/components/AdminPanel/UserOrderHistory";

import CreateUser from "@/components/AdminPanel/CreateUser";
import ListOfUser from "@/components/AdminPanel/ListOfUser";
import ListOfB2BProduct from "@/components/AdminPanel/ListOfB2BProduct";

/* ✅ DOCTOR */
import CreateDoctor from "@/components/AdminPanel/CreateDoctor";
import ListOfDoctor from "@/components/AdminPanel/ListOfDoctor";

import styles from "@/styles/dashboard.module.css";
import {
  FiUsers,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import CreateB2BCategory from "@/components/AdminPanel/CreateB2BCategory";
import ListofB2BCategory from "@/components/AdminPanel/ListofB2BCategory";

type JwtPayload = { id: string; role: string; exp: number };

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("dashBoard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setCheckingAuth(false);
      router.replace("/adminlogin");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (
        decoded.exp * 1000 < Date.now() ||
        decoded.role?.toLowerCase() !== "superadmin"
      ) {
        Cookies.remove("token");
        Cookies.remove("role");
        router.replace("/adminlogin");
        return;
      }
      setCheckingAuth(false);
    } catch {
      Cookies.remove("token");
      Cookies.remove("role");
      router.replace("/adminlogin");
    }
  }, [router]);

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

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    router.replace("/adminlogin");
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  if (checkingAuth) {
    return <div className={styles.loading}>Loading dashboard.......</div>;
  }

  return (
    <>
      {/* ORIGINAL TOPBAR – KEPT BUT HIDDEN */}
      <div style={{ display: "none" }}>
        <Topbar hideHamburgerOnMobile />
      </div>

      {/* HEADER */}
      <div
        style={{
          height: "84px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Image
          className={styles.logo}
          src="/logo.jpeg"
          alt="Logo"
          width={100}
          height={90}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 600, color: "#334155" }}>
            Super Admin
          </span>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobile && (
        <div className={styles.mobileTopbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      )}

      {/* BODY */}
      <div className={styles.wrapper}>
        <aside
          className={`${styles.sidebar} ${
            isMobile
              ? sidebarOpen
                ? styles.sidebarMobile
                : styles.sidebarHidden
              : ""
          }`}
        >
          <p className={styles.sectionTitle}>Dashboard</p>

          <li
            className={styles.menuItem}
            onClick={() => handleSectionChange("dashBoard")}
          >
            <FiUsers /> Dashboard
          </li>

          {[
            { key: "ADMIN", create: "createAdmin", list: "listOfAdmin" },
            { key: "USER", create: "createUser", list: "listOfUser" },

            { key: "DOCTOR", create: "createDoctor", list: "listOfDoctor" },
            {
              key: "CLINIC CATEGORY",
              create: "createClinicCategory",
              list: "listOfClinicCategory",
            },

            { key: "CLINIC", create: "createClinic", list: "listOfClinic" },
            
            {
              key: "PRODUCT CATEGORY",
              create: "createProductCategory",
              list: "listOfProductCategory",
            },
            { key: "PRODUCT", create: "createProduct", list: "listOfProduct" },
            
{
              key: "B2B PRODUCT CATEGORY",
              create: "createB2BProductCategory",
              list: "listOfB2BProductCategory",
            },

            {
              key: "B2B PRODUCT",
              create: "createB2Bproduct",
              list: "listOfB2Bproduct",
            },
            {
              key: "SERVICE CATEGORY",
              create: "createServiceCategory",
              list: "listOfServiceCategory",
            },
          ].map((cat) => (
            <div key={cat.key}>
              <li
                className={styles.menuItem}
                onClick={() =>
                  setOpenCategory(openCategory === cat.key ? null : cat.key)
                }
              >
                {cat.key}
                {openCategory === cat.key ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </li>

              {openCategory === cat.key && (
                <ul className={styles.inlineDropdown}>
                  <li onClick={() => handleSectionChange(cat.create)}>
                    Create
                  </li>
                  <li onClick={() => handleSectionChange(cat.list)}>List</li>
                </ul>
              )}
            </div>
          ))}

          <li
            className={styles.menuItem}
            onClick={() =>
              setOpenCategory(openCategory === "OTHERS" ? null : "OTHERS")
            }
          >
            OTHERS
            {openCategory === "OTHERS" ? (
              <FiChevronDown />
            ) : (
              <FiChevronRight />
            )}
          </li>

          {openCategory === "OTHERS" && (
            <ul className={styles.inlineDropdown}>
              <li onClick={() => handleSectionChange("listOfTopProduct")}>
                List Top Product
              </li>
              <li onClick={() => handleSectionChange("offerupdate")}>
                Offer Update
              </li>
              <li onClick={() => handleSectionChange("latestshorts")}>
                Latest Shorts
              </li>
              <li onClick={() => handleSectionChange("latestofferupdate")}>
                Latest Offer Update
              </li>
              <li onClick={() => handleSectionChange("treatmentshorts")}>
                Treatment Shorts
              </li>
              <li onClick={() => handleSectionChange("userorderhistory")}>
                User Order History
              </li>
            </ul>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <div className={styles.mainContent}>
          {activeSection === "dashBoard" && <Dashboard />}
          {activeSection === "createAdmin" && <CreateAdmin />}
          {activeSection === "listOfAdmin" && <ListOfAdmin />}
          {activeSection === "createUser" && <CreateUser />}
          {activeSection === "listOfUser" && <ListOfUser />}

          {activeSection === "createDoctor" && <CreateDoctor />}
          {activeSection === "listOfDoctor" && <ListOfDoctor />}

          {activeSection === "createClinic" && <CreateClinic />}
          {activeSection === "listOfClinic" && <ListOfClinic />}
          {activeSection === "createClinicCategory" && <CreateClinicCategory />}
          {activeSection === "listOfClinicCategory" && <ListOfClinicCategory />}
          {activeSection === "createProduct" && <CreateProduct />}
          {activeSection === "listOfProduct" && <ListOfProduct />}
          {activeSection === "createProductCategory" && <CreateCategory />}
          {activeSection === "listOfProductCategory" && <ListOfCategory />}
          {activeSection === "createB2Bproduct" && <CreateB2BProduct />}
          {activeSection === "listOfB2Bproduct" && <ListOfB2BProduct />}
          {activeSection === "createServiceCategory" && (
            <CreateServiceCategory />
          )}
          {activeSection === "listOfServiceCategory" && (
            <ListOfServiceCategory />
          )}
          {activeSection === "listOfTopProduct" && <ListOfTopProduct />}
          {activeSection === "offerupdate" && <UpdateOffer />}
          {activeSection === "latestshorts" && <LatestShorts />}
          {activeSection === "latestofferupdate" && <LatestUpdateOffer />}
          {activeSection === "treatmentshorts" && <TreatmentShorts />}
          {activeSection === "userorderhistory" && <UserOrderHistory />}
          {activeSection === "createPatient" && <CreatePatient />}
          {activeSection === "createTestResult" && <CreateTestResult />}
          {activeSection === "createOnlineDoctor" && <CreateOnlineDoctor />}
          {activeSection === "createSupport" && <CreateSupport />}
          {activeSection === "createTreatment" && <CreateTreatment />}

          {activeSection === "listOfB2BProductCategory" && <ListofB2BCategory/>}

          {activeSection === "createB2BProductCategory" && <CreateB2BCategory/>}
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}

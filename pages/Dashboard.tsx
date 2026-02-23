"use client";
import Image from "next/image";
import { API_URL } from "@/config/api";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import CreateAdmin from "@/components/AdminPanel/CreateAdmin";
import CreateCategory from "@/components/AdminPanel/CreateProductCategory";
import CreateClinicCategory from "@/components/AdminPanel/CreateClinicCategory";
import CreateClinic from "@/components/AdminPanel/CreateClinic";
import CreateProduct from "@/components/AdminPanel/CreateProduct";
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
  FiUserCheck,
  FiUser,
  FiHome,
  FiBox,
  FiGrid,
  FiLayers,
  FiBriefcase,
  FiMenu,
  FiX,
  FiLogOut,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";

import CreateB2BCategory from "@/components/AdminPanel/CreateB2BCategory";
import ListofB2BCategory from "@/components/AdminPanel/ListofB2BCategory";
import ListOfTreatment from "@/components/AdminPanel/ListOfTreatment";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";

type JwtPayload = { id: string; role: string; exp: number };
type BasicItem = { _id?: string; name?: string; createdAt?: string };

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("dashBoard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [adminName, setAdminName] = useState("");
  const [summaryData, setSummaryData] = useState({
    admins: [] as any[],
    users: [] as any[],
    doctors: [] as any[],
    clinics: [] as any[],
    productCategories: [] as any[],
    clinicCategories: [] as any[],
    serviceCategories: [] as any[],
    products: [] as any[],
    b2bCategories: [] as any[],
    b2bProducts: [] as any[],
  });

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

      const storedName =
        Cookies.get("adminName") ||
        Cookies.get("name") ||
        Cookies.get("username") ||
        (decoded as any).name ||
        (decoded as any).fullName ||
        (decoded as any).firstName ||
        (decoded as any).username ||
        (decoded as any).email ||
        "";

      setAdminName(storedName || "Super Admin");
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

  const menuSections = [
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
    {
      key: "TREATMENT PLANS",
      create: "createTreatment",
      list: "listOfTreatment",
    },
  ];

  const fetchDashboardSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");

    const endpoints = [
      { key: "admins", url: `${API_URL}/admins` },
      { key: "users", url: `${API_URL}/users` },
      { key: "doctors", url: `${API_URL}/doctoradmin` },
      { key: "clinics", url: `${API_URL}/clinics` },
      { key: "productCategories", url: `${API_URL}/categories` },
      { key: "clinicCategories", url: `${API_URL}/clinic-categories` },
      { key: "serviceCategories", url: `${API_URL}/service-categories` },
      { key: "products", url: `${API_URL}/products` },
      { key: "b2bCategories", url: `${API_URL}/b2b-categories` },
      { key: "b2bProducts", url: `${API_URL}/b2b-products` },
    ] as const;

    try {
      const settled = await Promise.allSettled(
        endpoints.map((entry) => fetch(entry.url))
      );

      const resolved = await Promise.all(
        settled.map(async (entry) => {
          if (entry.status !== "fulfilled" || !entry.value.ok) return [];
          try {
            const data = await entry.value.json();
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })
      );

      const nextData = endpoints.reduce(
        (acc, endpoint, index) => {
          acc[endpoint.key] = resolved[index];
          return acc;
        },
        {
          admins: [] as any[],
          users: [] as any[],
          doctors: [] as any[],
          clinics: [] as any[],
          productCategories: [] as any[],
          clinicCategories: [] as any[],
          serviceCategories: [] as any[],
          products: [] as any[],
          b2bCategories: [] as any[],
          b2bProducts: [] as any[],
        }
      );

      setSummaryData(nextData);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setSummaryError("Unable to fetch dashboard overview right now.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (!checkingAuth && activeSection === "dashBoard") {
      fetchDashboardSummary();
    }
  }, [checkingAuth, activeSection]);

  const sortByCreatedDesc = <T extends BasicItem>(items: T[]) =>
    [...items].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const recentAdmins = sortByCreatedDesc(summaryData.admins).slice(0, 2);
  const recentDoctors = sortByCreatedDesc(summaryData.doctors).slice(0, 2);
  const recentClinics = sortByCreatedDesc(summaryData.clinics).slice(0, 2);
  const recentProducts = sortByCreatedDesc(summaryData.products).slice(0, 2);
  const recentCategories = sortByCreatedDesc(summaryData.productCategories).slice(
    0,
    2
  );

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
            {adminName || "Super Admin"}
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

          {menuSections.map((cat) => (
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
          {activeSection === "dashBoard" && (
            <div className={styles.premiumDashboard}>
              <div className={styles.dashboardHero}>
                <div>
                  <h2 className={styles.heroTitle}>
                    {adminName || "Super Admin"}
                  </h2>
                  <p className={styles.heroSubtitle}>
                    Real-time snapshot of all critical modules across your
                    platform.
                  </p>
                </div>
                <div className={styles.heroActions}>
                  <p className={styles.lastUpdatedText}>
                    Last updated: {lastUpdated || "Not synced yet"}
                  </p>
                  <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={fetchDashboardSummary}
                    disabled={summaryLoading}
                  >
                    <FiRefreshCw />
                    {summaryLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              {summaryError && <p className={styles.summaryError}>{summaryError}</p>}

              <div className={styles.statGrid}>
                {[
                  {
                    label: "Admins",
                    value: summaryData.admins.length,
                    icon: <FiUserCheck />,
                    tone: styles.toneAdmins,
                  },
                  {
                    label: "Users",
                    value: summaryData.users.length,
                    icon: <FiUsers />,
                    tone: styles.toneUsers,
                  },
                  {
                    label: "Doctors",
                    value: summaryData.doctors.length,
                    icon: <FiUser />,
                    tone: styles.toneDoctors,
                  },
                  {
                    label: "Clinics",
                    value: summaryData.clinics.length,
                    icon: <FiHome />,
                    tone: styles.toneClinics,
                  },
                  {
                    label: "Products",
                    value: summaryData.products.length,
                    icon: <FiBox />,
                    tone: styles.toneProducts,
                  },
                  {
                    label: "B2B Products",
                    value: summaryData.b2bProducts.length,
                    icon: <FiBriefcase />,
                    tone: styles.toneB2BProducts,
                  },
                  {
                    label: "Product Categories",
                    value: summaryData.productCategories.length,
                    icon: <FiGrid />,
                    tone: styles.toneProductCategories,
                  },
                  {
                    label: "Clinic Categories",
                    value: summaryData.clinicCategories.length,
                    icon: <FiLayers />,
                    tone: styles.toneClinicCategories,
                  },
                  {
                    label: "Service Categories",
                    value: summaryData.serviceCategories.length,
                    icon: <FiLayers />,
                    tone: styles.toneServiceCategories,
                  },
                  {
                    label: "B2B Categories",
                    value: summaryData.b2bCategories.length,
                    icon: <FiLayers />,
                    tone: styles.toneB2BCategories,
                  },
                ].map((item) => (
                  <div key={item.label} className={`${styles.statCard} ${item.tone}`}>
                    <div className={styles.statIcon}>{item.icon}</div>
                    <div>
                      <p className={styles.statValue}>{item.value}</p>
                      <p className={styles.statLabel}>{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.insightGrid}>
                <div className={styles.insightCard}>
                  <h3>Recent Admins</h3>
                  <ul>
                    {recentAdmins.length > 0 ? (
                      recentAdmins.map((a: any) => (
                        <li key={a._id || a.email || a.name}>
                          <span>{a.name || "Unnamed Admin"}</span>
                          <small>{a.email || "-"}</small>
                        </li>
                      ))
                    ) : (
                      <li className={styles.emptyItem}>No admin records</li>
                    )}
                  </ul>
                </div>

                <div className={styles.insightCard}>
                  <h3>Recent Doctors</h3>
                  <ul>
                    {recentDoctors.length > 0 ? (
                      recentDoctors.map((d: any) => (
                        <li key={d._id || d.email || d.firstName}>
                          <span>
                            {d.firstName || ""} {d.lastName || ""}
                          </span>
                          <small>{d.specialist || "-"}</small>
                        </li>
                      ))
                    ) : (
                      <li className={styles.emptyItem}>No doctor records</li>
                    )}
                  </ul>
                </div>

                <div className={styles.insightCard}>
                  <h3>Recent Clinics</h3>
                  <ul>
                    {recentClinics.length > 0 ? (
                      recentClinics.map((c: any) => (
                        <li key={c._id || c.email || c.clinicName}>
                          <span>{c.clinicName || "Unnamed Clinic"}</span>
                          <small>{c.email || "-"}</small>
                        </li>
                      ))
                    ) : (
                      <li className={styles.emptyItem}>No clinic records</li>
                    )}
                  </ul>
                </div>

                <div className={styles.insightCard}>
                  <h3>Recent Products</h3>
                  <ul>
                    {recentProducts.length > 0 ? (
                      recentProducts.map((p: any) => (
                        <li key={p._id || p.productName}>
                          <span>{p.productName || "Unnamed Product"}</span>
                          <small>{p.brandName || "-"}</small>
                        </li>
                      ))
                    ) : (
                      <li className={styles.emptyItem}>No product records</li>
                    )}
                  </ul>
                </div>

                <div className={styles.insightCard}>
                  <h3>Recent Product Categories</h3>
                  <ul>
                    {recentCategories.length > 0 ? (
                      recentCategories.map((cat: any) => (
                        <li key={cat._id || cat.id || cat.name}>
                          <span>{cat.name || "Unnamed Category"}</span>
                          <small>{cat.id || "-"}</small>
                        </li>
                      ))
                    ) : (
                      <li className={styles.emptyItem}>No category records</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
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
          {activeSection === "listOfTreatment" && <ListOfTreatment />}
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

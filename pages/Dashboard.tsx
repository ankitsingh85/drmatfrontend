"use client";
import Image from "next/image";
import { API_URL } from "@/config/api";

import { useCallback, useEffect, useState, type ComponentType } from "react";
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
import Offer1 from "@/components/AdminPanel/ListofOffer1";
import Offer2 from "@/components/AdminPanel/ListofOffer2";
import Offer3 from "@/components/AdminPanel/ListofOffer3";
import Offer4 from "@/components/AdminPanel/ListofOffer4";
import LatestShorts from "@/components/AdminPanel/LatestShorts";
import TreatmentShorts from "@/components/AdminPanel/TreatmentShorts";
import CreateTreatment from "@/components/AdminPanel/CreateTreatment";
import CreatePatient from "@/components/AdminPanel/CreatePatient";
import CreateTestResult from "@/components/AdminPanel/CreateTestResult";
import CreateOnlineDoctor from "@/components/AdminPanel/CreateOnlineDoctor";
import CreateB2BProduct from "@/components/AdminPanel/CreateB2BProduct";
import CreateSupport from "@/components/AdminPanel/CreateSupport";
import CreateCourse from "@/components/AdminPanel/CreateCourse";
import CreateCourseType from "@/components/AdminPanel/CreateCourseType";
// import UserOrderHistory from "@/components/AdminPanel/UserOrderHistory";

import CreateUser from "@/components/AdminPanel/CreateUser";
import ListOfUser from "@/components/AdminPanel/ListOfUser";
import ListOfB2BProduct from "@/components/AdminPanel/ListOfB2BProduct";
import ListOfCourse from "@/components/AdminPanel/ListOfCourse";
import ListOfCourseType from "@/components/AdminPanel/ListOfCourseType";

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
type ModuleSectionConfig = {
  id: string;
  label: string;
  listLabel: string;
  createLabel: string;
  ListComponent: ComponentType<any>;
  CreateComponent: ComponentType<any>;
};

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("dashBoard");
  const [sectionMode, setSectionMode] = useState<"list" | "create">("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [othersOpen, setOthersOpen] = useState(false);
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
    courseTypes: [] as any[],
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

  const dashboardModules: ModuleSectionConfig[] = [
    {
      id: "admin",
      label: "ADMIN",
      listLabel: "List of Admin",
      createLabel: "Create Admin",
      ListComponent: ListOfAdmin,
      CreateComponent: CreateAdmin,
    },
    {
      id: "user",
      label: "USER",
      listLabel: "List of User",
      createLabel: "Create User",
      ListComponent: ListOfUser,
      CreateComponent: CreateUser,
    },
    {
      id: "productCategory",
      label: "PRODUCT CATEGORY",
      listLabel: "List of Product Category",
      createLabel: "Create Product Category",
      ListComponent: ListOfCategory,
      CreateComponent: CreateCategory,
    },
    {
      id: "product",
      label: "PRODUCT",
      listLabel: "List of Product",
      createLabel: "Create Product",
      ListComponent: ListOfProduct,
      CreateComponent: CreateProduct,
    },
      {
      id: "courseType",
      label: "COURSE TYPE",
      listLabel: "List of Course Type",
      createLabel: "Create Course Type",
      ListComponent: ListOfCourseType,
      CreateComponent: CreateCourseType,
    },
    {
      id: "course",
      label: "COURSE",
      listLabel: "List of Course",
      createLabel: "Create Course",
      ListComponent: ListOfCourse,
      CreateComponent: CreateCourse,
    },
    {
      id: "doctor",
      label: "DOCTOR",
      listLabel: "List of Doctor",
      createLabel: "Create Doctor",
      ListComponent: ListOfDoctor,
      CreateComponent: CreateDoctor,
    },
    {
      id: "clinicCategory",
      label: "CLINIC CATEGORY",
      listLabel: "List of Clinic Category",
      createLabel: "Create Clinic Category",
      ListComponent: ListOfClinicCategory,
      CreateComponent: CreateClinicCategory,
    },
    {
      id: "clinic",
      label: "CLINIC",
      listLabel: "List of Clinic",
      createLabel: "Create Clinic",
      ListComponent: ListOfClinic,
      CreateComponent: CreateClinic,
    },
    
    
    {
      id: "b2bProductCategory",
      label: "B2B PRODUCT CATEGORY",
      listLabel: "List of B2B Product Category",
      createLabel: "Create B2B Product Category",
      ListComponent: ListofB2BCategory,
      CreateComponent: CreateB2BCategory,
    },
    {
      id: "b2bProduct",
      label: "B2B PRODUCT",
      listLabel: "List of B2B Product",
      createLabel: "Create B2B Product",
      ListComponent: ListOfB2BProduct,
      CreateComponent: CreateB2BProduct,
    },
    {
      id: "serviceCategory",
      label: "TREATMENT CATEGORY",
      listLabel: "List of Service Category",
      createLabel: "Create Service Category",
      ListComponent: ListOfServiceCategory,
      CreateComponent: CreateServiceCategory,
    },
    {
      id: "treatment",
      label: "TREATMENT PLANS",
      listLabel: "List of Treatment",
      createLabel: "Create Treatment",
      ListComponent: ListOfTreatment,
      CreateComponent: CreateTreatment,
    },
  
  ];

  const activeModule = dashboardModules.find((module) => module.id === activeSection);
  const ActiveListComponent = activeModule?.ListComponent;
  const ActiveCreateComponent = activeModule?.CreateComponent;

  const handleModuleChange = (moduleId: string) => {
    setActiveSection(moduleId);
    setSectionMode("list");
    setOthersOpen(false);
    setSidebarOpen(false);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSectionMode("list");
    setOthersOpen(false);
    setSidebarOpen(false);
  };

  const fetchDashboardSummary = useCallback(async () => {
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
      { key: "courseTypes", url: `${API_URL}/course-types` },
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
          courseTypes: [] as any[],
        }
      );

      setSummaryData(nextData);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setSummaryError("Unable to fetch dashboard overview right now.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleCreateSuccess = () => {
      setSectionMode("list");
      void fetchDashboardSummary();
    };

    window.addEventListener("admin-dashboard:create-success", handleCreateSuccess);

    return () => {
      window.removeEventListener(
        "admin-dashboard:create-success",
        handleCreateSuccess
      );
    };
  }, [fetchDashboardSummary]);

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
          height: "130px",
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
            className={`${styles.menuItem} ${
              activeSection === "dashBoard" ? styles.menuItemActive : ""
            }`}
            onClick={() => handleSectionChange("dashBoard")}
          >
            <span className={styles.iconLabel}>
              <FiUsers />
              <span className={styles.label}>Dashboard</span>
            </span>
          </li>

          {dashboardModules.map((module) => (
            <li
              key={module.id}
              className={`${styles.menuItem} ${
                activeSection === module.id ? styles.menuItemActive : ""
              }`}
              onClick={() => handleModuleChange(module.id)}
            >
              <span className={styles.iconLabel}>
                <FiGrid />
                <span className={styles.label}>{module.label}</span>
              </span>
            </li>
          ))}

          <li
            className={styles.menuItem}
            onClick={() => setOthersOpen((prev) => !prev)}
          >
            <span className={styles.iconLabel}>
              <FiLayers />
              <span className={styles.label}>OTHERS</span>
            </span>
            {othersOpen ? <FiChevronDown /> : <FiChevronRight />}
          </li>

          {othersOpen && (
            <ul className={styles.inlineDropdown}>
              <li onClick={() => handleSectionChange("listOfTopProduct")}>
                List Top Product
              </li>
              <li onClick={() => handleSectionChange("offer1")}>
                Offer 1
              </li>
              <li onClick={() => handleSectionChange("offer2")}>
                Offer 2
              </li>
              <li onClick={() => handleSectionChange("offer3")}>
                Offer 3
              </li>
              <li onClick={() => handleSectionChange("offer4")}>
                Offer 4
              </li>
              <li onClick={() => handleSectionChange("latestshorts")}>
                Latest Shorts
              </li>
              <li onClick={() => handleSectionChange("treatmentshorts")}>
                Treatment Shorts
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
                  {
                    label: "Course Types",
                    value: summaryData.courseTypes.length,
                    icon: <FiLayers />,
                    tone: styles.toneCourseTypes,
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
          {activeModule ? (
            <div className={styles.moduleShell}>
              <div className={styles.moduleHeader}>
                <div>
                  <p className={styles.moduleKicker}>{activeModule.label}</p>
                  <h2 className={styles.moduleTitle}>
                    {sectionMode === "list"
                      ? activeModule.listLabel
                      : activeModule.createLabel}
                  </h2>
                </div>

                <div className={styles.moduleActions}>
                  {sectionMode === "list" ? (
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => setSectionMode("create")}
                    >
                      {activeModule.createLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.secondaryAction}
                      onClick={() => setSectionMode("list")}
                    >
                      Back to list
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.moduleBody}>
                {sectionMode === "list" ? (
                  ActiveListComponent ? <ActiveListComponent /> : null
                ) : (
                  ActiveCreateComponent ? <ActiveCreateComponent /> : null
                )}
              </div>
            </div>
          ) : (
            <>
              {activeSection === "listOfTopProduct" && <ListOfTopProduct />}
              {activeSection === "offer1" && <Offer1 />}
              {activeSection === "offer2" && <Offer2 />}
              {activeSection === "offer3" && <Offer3 />}
              {activeSection === "offer4" && <Offer4 />}
              {activeSection === "latestshorts" && <LatestShorts />}
              {activeSection === "treatmentshorts" && <TreatmentShorts />}
              {/* {activeSection === "userorderhistory" && <UserOrderHistory />} */}
              {activeSection === "createPatient" && <CreatePatient />}
              {activeSection === "createTestResult" && <CreateTestResult />}
              {activeSection === "createOnlineDoctor" && <CreateOnlineDoctor />}
              {activeSection === "createSupport" && <CreateSupport />}
            </>
          )}
        </div>
      </div>

      <Footer />
      <MobileNavbar />
    </>
  );
}

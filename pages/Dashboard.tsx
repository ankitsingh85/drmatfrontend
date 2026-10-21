"use client";
import Image from "next/image";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
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
import Offer1 from "@/components/AdminPanel/ListofProductOffer";
import Offer2 from "@/components/AdminPanel/ListofTreatmentOffer";
import Offer3 from "@/components/AdminPanel/ListofClinicOffer";
import FeaturedSectionManager from "@/components/AdminPanel/FeaturedSectionManager";
import LatestShorts from "@/components/AdminPanel/LatestShorts";
import TreatmentShorts from "@/components/AdminPanel/TreatmentShorts";
import CreateTreatment from "@/components/AdminPanel/CreateTreatment";
import CreatePatient from "@/components/AdminPanel/CreatePatient";
import CreateTestResult from "@/components/AdminPanel/CreateTestResult";
import CreateOnlineDoctor from "@/components/AdminPanel/CreateOnlineDoctor";
import CreateB2BProduct from "@/components/AdminPanel/CreateB2BProduct";
import CreateB2BUser from "@/components/AdminPanel/CreateB2BUser";
import CreateSupport from "@/components/AdminPanel/CreateSupport";
import CreateCourse from "@/components/AdminPanel/CreateCourse";
import CreateCourseType from "@/components/AdminPanel/CreateCourseType";
import CreateTrainingType from "@/components/AdminPanel/CreateTrainingType";
import CreateWorkshopTraning from "@/components/AdminPanel/CreateWorkshopTraning";
// import UserOrderHistory from "@/components/AdminPanel/UserOrderHistory";

import CreateUser from "@/components/AdminPanel/CreateUser";
import ListOfUser from "@/components/AdminPanel/ListOfUser";
import ListOfB2BUser from "@/components/AdminPanel/ListOfB2BUser";
import ListOfB2BProduct from "@/components/AdminPanel/ListOfB2BProduct";
import ListOfCourse from "@/components/AdminPanel/ListOfCourse";
import ListOfCourseType from "@/components/AdminPanel/ListOfCourseType";
import ListOfTrainingType from "@/components/AdminPanel/ListOfTrainingType";
import ListOfWorkshopTraning from "@/components/AdminPanel/ListOfWorkshopTraning";
import ListOfSupportTickets from "@/components/AdminPanel/ListOfSupportTickets";

/* ✅ DOCTOR */
import CreateDoctor from "@/components/AdminPanel/CreateDoctor";
import ListOfDoctor from "@/components/AdminPanel/ListOfDoctor";

/* ✅ COUPON */
import CreateCoupon from "@/components/AdminPanel/CreateCoupon";
import ListOfCoupon from "@/components/AdminPanel/ListOfCoupon";

/* ✅ CLINIC SUBSCRIPTION PLAN */
import ClinicPlanSettings from "@/components/AdminPanel/ClinicPlanSettings";
import ListOfClinicSubscriptions from "@/components/AdminPanel/ListOfClinicSubscriptions";

/* ✅ RECOMMENDED CLINICS */
import RecommendedClinics from "@/components/AdminPanel/RecommendedClinics";

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
  FiLock,
  FiTag,
  FiBookOpen,
  FiAward,
  FiBook,
  FiTool,
  FiClipboard,
  FiShield,
  FiActivity,
  FiVideo,
  FiUserPlus,
  FiDownload,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiLoader,
  FiAlertCircle,
  FiPercent,
  FiCreditCard,
  FiStar,
} from "react-icons/fi";
import {
  BULK_UPLOAD_CONFIG,
  downloadBulkUploadTemplate,
  formatFileSize,
  type BulkUploadResult,
  type BulkUploadTarget,
} from "@/lib/bulkUpload";

import CreateB2BCategory from "@/components/AdminPanel/CreateB2BCategory";
import ListofB2BCategory from "@/components/AdminPanel/ListofB2BCategory";
import ListOfTreatment from "@/components/AdminPanel/ListOfTreatment";
import CreateOnlineConsultationService from "@/components/AdminPanel/CreateOnlineConsultationService";
import ListOfOnlineConsultationService from "@/components/AdminPanel/ListOfOnlineConsultationService";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { useToast } from "@/context/ToastContext";

type JwtPayload = { id: string; role: string; exp: number };
type BasicItem = { _id?: string; name?: string; createdAt?: string };

type AdminPermission = {
  module: string;
  view: boolean;
  create: boolean;
  delete: boolean;
};

type ModuleSectionConfig = {
  id: string;
  label: string;
  listLabel: string;
  createLabel: string;
  icon: React.ReactNode;
  ListComponent: ComponentType<any>;
  CreateComponent: ComponentType<any>;
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const toast = useToast();

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
  const [bulkUploadTarget, setBulkUploadTarget] = useState<BulkUploadTarget | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploadError, setBulkUploadError] = useState("");
  const [bulkUploadResult, setBulkUploadResult] = useState<BulkUploadResult | null>(null);
  const [loadingBulkUpload, setLoadingBulkUpload] = useState(false);
  const [bulkDragActive, setBulkDragActive] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  /* ================= PERMISSIONS STATE =================
     Super Admin always bypasses the permission checks below. Every
     other role (System Admin / Manager / custom) only sees the
     sidebar modules and "Create" buttons it's been explicitly granted
     view/create access to.
  */
  const [adminRole, setAdminRole] = useState("");
  const [adminCustomRoleLabel, setAdminCustomRoleLabel] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const isSuperAdmin = adminRole === "superadmin";

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
    b2bUsers: [] as any[],
    courseTypes: [] as any[],
  });

  const permissionFor = useCallback(
    (moduleId: string): AdminPermission => {
      const found = permissions.find((p) => p.module === moduleId);
      return found || { module: moduleId, view: false, create: false, delete: false };
    },
    [permissions]
  );

  const canView = useCallback(
    (moduleId: string) => isSuperAdmin || permissionFor(moduleId).view,
    [isSuperAdmin, permissionFor]
  );

  const canCreate = useCallback(
    (moduleId: string) => isSuperAdmin || permissionFor(moduleId).create,
    [isSuperAdmin, permissionFor]
  );

  const canDelete = useCallback(
    (moduleId: string) => isSuperAdmin || permissionFor(moduleId).delete,
    [isSuperAdmin, permissionFor]
  );

  const resetBulkUpload = () => {
    setBulkFile(null);
    setBulkUploadError("");
    setBulkUploadResult(null);
    setBulkDragActive(false);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
  };

  const acceptBulkFile = (file: File | undefined) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isAllowedBulkFile =
      lowerName.endsWith(".csv") || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx");

    if (!isAllowedBulkFile) {
      setBulkFile(null);
      setBulkUploadResult(null);
      setBulkUploadError("Bulk upload file must be CSV, XLS, or XLSX");
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
      return;
    }

    setBulkUploadError("");
    setBulkUploadResult(null);
    setBulkFile(file);
  };

  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptBulkFile(e.target.files?.[0]);
  };

  const handleBulkDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setBulkDragActive(false);
    acceptBulkFile(e.dataTransfer.files?.[0]);
  };

  const handleBulkUpload = async () => {
    setBulkUploadError("");
    setBulkUploadResult(null);

    if (!bulkUploadTarget) return;
    const config = BULK_UPLOAD_CONFIG[bulkUploadTarget];

    if (!bulkFile) {
      setBulkUploadError("Please choose a CSV or Excel file to upload");
      return;
    }

    try {
      setLoadingBulkUpload(true);
      const formData = new FormData();
      formData.append("file", bulkFile);

      const res = await fetch(`${API_URL}/${config.endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const result: BulkUploadResult = {
        createdCount: data.createdCount || 0,
        skipped: Array.isArray(data.skipped) ? data.skipped : [],
      };

      if (!res.ok) {
        setBulkUploadError(data.message || "Bulk upload failed");
        if (result.skipped.length > 0) setBulkUploadResult(result);
        return;
      }

      setBulkUploadResult(result);
      toast.success(`${result.createdCount} ${config.noun} uploaded successfully.`);
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
      setBulkFile(null);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
    } catch (err: any) {
      setBulkUploadError(err.message || "Bulk upload failed");
    } finally {
      setLoadingBulkUpload(false);
    }
  };

  /* ================= AUTH =================
     Any admin role can now log in here (not just Super Admin). What
     they actually see inside is gated by their permissions, fetched
     right below.
  */
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setCheckingAuth(false);
      router.replace("/adminlogin");
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwtDecode<JwtPayload>(token);
    } catch {
      Cookies.remove("token");
      Cookies.remove("role");
      router.replace("/adminlogin");
      return;
    }

    if (decoded.exp * 1000 < Date.now()) {
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

    setAdminName(storedName || "Admin");

    // Fetch this admin's own record so we have their real role +
    // permissions (the JWT only carries a coarse role string).
    //
    // NOTE (security/TODO): GET /admins/:id is currently a public,
    // unauthenticated route — anyone who knows or guesses an admin's
    // _id could read their permissions. Once an admin-auth middleware
    // exists, this should instead hit a session-aware "/admins/me"
    // endpoint (the same pattern as userAuth + GET /users/me) rather
    // than trusting the id embedded in a client-readable JWT.
    const fetchOwnPermissions = async () => {
      try {
        const res = await fetch(`${API_URL}/admins/${decoded.id}`);
        const data = await res.json();
        if (!res.ok || !data?.admin) {
          throw new Error(data?.message || "Failed to load admin profile");
        }

        setAdminRole(String(data.admin.role || decoded.role || "").toLowerCase());
        setAdminCustomRoleLabel(data.admin.customRoleLabel || "");
        setPermissions(Array.isArray(data.admin.permissions) ? data.admin.permissions : []);
        setCheckingAuth(false);
      } catch (err) {
        console.error("Failed to load admin permissions:", err);
        // Fall back to the role embedded in the JWT so the dashboard
        // still loads (with no granted permissions) instead of being
        // stuck on a loader forever.
        setAdminRole(String(decoded.role || "").toLowerCase());
        setPermissions([]);
        setCheckingAuth(false);
      }
    };

    fetchOwnPermissions();
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
      icon: <FiUserCheck />,
      ListComponent: ListOfAdmin,
      CreateComponent: CreateAdmin,
    },
    {
      id: "user",
      label: "USER",
      listLabel: "List of User",
      createLabel: "Create User",
      icon: <FiUsers />,
      ListComponent: ListOfUser,
      CreateComponent: CreateUser,
    },
    {
      id: "productCategory",
      label: "PRODUCT CATEGORY",
      listLabel: "List of Product Category",
      createLabel: "Create Product Category",
      icon: <FiTag />,
      ListComponent: ListOfCategory,
      CreateComponent: CreateCategory,
    },
    {
      id: "product",
      label: "PRODUCT",
      listLabel: "List of Product",
      createLabel: "Create Product",
      icon: <FiBox />,
      ListComponent: ListOfProduct,
      CreateComponent: CreateProduct,
    },
    {
      id: "courseType",
      label: "COURSE TYPE",
      listLabel: "List of Course Type",
      createLabel: "Create Course Type",
      icon: <FiBookOpen />,
      ListComponent: ListOfCourseType,
      CreateComponent: CreateCourseType,
    },
    {
      id: "trainingType",
      label: "TRAINING TYPE",
      listLabel: "List of Training Type",
      createLabel: "Create Training Type",
      icon: <FiAward />,
      ListComponent: ListOfTrainingType,
      CreateComponent: CreateTrainingType,
    },
    {
      id: "course",
      label: "COURSE",
      listLabel: "List of Course",
      createLabel: "Create Course",
      icon: <FiBook />,
      ListComponent: ListOfCourse,
      CreateComponent: CreateCourse,
    },
    {
      id: "workshopTraining",
      label: "WORKSHOP TRAINING",
      listLabel: "List of Workshop Training",
      createLabel: "Create Workshop Training",
      icon: <FiTool />,
      ListComponent: ListOfWorkshopTraning,
      CreateComponent: CreateWorkshopTraning,
    },
    {
      id: "doctor",
      label: "DOCTOR",
      listLabel: "List of Doctor",
      createLabel: "Create Doctor",
      icon: <FiUser />,
      ListComponent: ListOfDoctor,
      CreateComponent: CreateDoctor,
    },
    {
      id: "clinicCategory",
      label: "CLINIC CATEGORY",
      listLabel: "List of Clinic Category",
      createLabel: "Create Clinic Category",
      icon: <FiLayers />,
      ListComponent: ListOfClinicCategory,
      CreateComponent: CreateClinicCategory,
    },
    {
      id: "clinic",
      label: "CLINIC",
      listLabel: "List of Clinic",
      createLabel: "Create Clinic",
      icon: <FiHome />,
      ListComponent: ListOfClinic,
      CreateComponent: CreateClinic,
    },
    {
      id: "recommendedClinic",
      label: "RECOMMENDED CLINIC",
      listLabel: "Recommended Clinics",
      createLabel: "Recommended Clinics",
      icon: <FiStar />,
      // Self-contained: the same component lists every clinic and lets the
      // admin toggle which ones are recommended, so there's no separate
      // "create" form for this module — both list and create point here.
      ListComponent: RecommendedClinics,
      CreateComponent: RecommendedClinics,
    },
    {
      id: "b2bUser",
      label: "B2B USER",
      listLabel: "List of B2B User",
      createLabel: "Create B2B User",
      icon: <FiUserPlus />,
      ListComponent: ListOfB2BUser,
      CreateComponent: CreateB2BUser,
    },
    {
      id: "b2bProductCategory",
      label: "B2B PRODUCT CATEGORY",
      listLabel: "List of B2B Product Category",
      createLabel: "Create B2B Product Category",
      icon: <FiClipboard />,
      ListComponent: ListofB2BCategory,
      CreateComponent: CreateB2BCategory,
    },
    {
      id: "b2bProduct",
      label: "B2B PRODUCT",
      listLabel: "List of B2B Product",
      createLabel: "Create B2B Product",
      icon: <FiBriefcase />,
      ListComponent: ListOfB2BProduct,
      CreateComponent: CreateB2BProduct,
    },
    {
      id: "serviceCategory",
      label: "TREATMENT CATEGORY",
      listLabel: "List of Service Category",
      createLabel: "Create Service Category",
      icon: <FiShield />,
      ListComponent: ListOfServiceCategory,
      CreateComponent: CreateServiceCategory,
    },
    {
      id: "treatment",
      label: "TREATMENT PLANS",
      listLabel: "List of Treatment",
      createLabel: "Create Treatment",
      icon: <FiActivity />,
      ListComponent: ListOfTreatment,
      CreateComponent: CreateTreatment,
    },
    {
      id: "onlineConsultationService",
      label: "ONLINE CONSULTATION",
      listLabel: "List of Online Consultation Services",
      createLabel: "Create Online Consultation Service",
      icon: <FiVideo />,
      ListComponent: ListOfOnlineConsultationService,
      CreateComponent: CreateOnlineConsultationService,
    },
    {
      id: "coupon",
      label: "COUPON",
      listLabel: "List of Coupons",
      createLabel: "Create Coupon",
      icon: <FiPercent />,
      ListComponent: ListOfCoupon,
      CreateComponent: CreateCoupon,
    },
    {
      id: "clinicSubscription",
      label: "CLINIC PLAN",
      listLabel: "Clinic Subscriptions",
      createLabel: "Plan Settings",
      icon: <FiCreditCard />,
      ListComponent: ListOfClinicSubscriptions,
      CreateComponent: ClinicPlanSettings,
    },
  ];

  // Only the modules this admin is permitted to VIEW show up in the
  // sidebar at all. Super Admin always sees the full list.
  const visibleModules = dashboardModules.filter((module) => canView(module.id));

  const activeModule = visibleModules.find((module) => module.id === activeSection);
  const ActiveListComponent = activeModule?.ListComponent;
  const ActiveCreateComponent = activeModule?.CreateComponent;
  const activeModuleCanCreate = activeModule ? canCreate(activeModule.id) : false;
  const activeModuleCanDelete = activeModule ? canDelete(activeModule.id) : false;
  const isProductCategoryList =
    activeModule?.id === "productCategory" ||
    activeModule?.label === "PRODUCT CATEGORY" ||
    activeModule?.listLabel === "List of Product Category";
  const isProductList =
    activeModule?.id === "product" ||
    activeModule?.label === "PRODUCT" ||
    activeModule?.listLabel === "List of Product";
  const isCourseTypeList =
    activeModule?.id === "courseType" ||
    activeModule?.listLabel === "List of Course Type";
  const isCourseList =
    activeModule?.id === "course" || activeModule?.listLabel === "List of Course";
  const isTrainingTypeList =
    activeModule?.id === "trainingType" ||
    activeModule?.listLabel === "List of Training Type";
  const isWorkshopTrainingList =
    activeModule?.id === "workshopTraining" ||
    activeModule?.listLabel === "List of Workshop Training";
  const isClinicCategoryList =
    activeModule?.id === "clinicCategory" ||
    activeModule?.listLabel === "List of Clinic Category";
  const isClinicList =
    activeModule?.id === "clinic" || activeModule?.listLabel === "List of Clinic";
  const isB2BCategoryList =
    activeModule?.id === "b2bProductCategory" ||
    activeModule?.listLabel === "List of B2B Product Category";
  const isB2BProductList =
    activeModule?.id === "b2bProduct" || activeModule?.listLabel === "List of B2B Product";
  const isServiceCategoryList =
    activeModule?.id === "serviceCategory" ||
    activeModule?.listLabel === "List of Service Category";
  const isTreatmentPlanList =
    activeModule?.id === "treatment" || activeModule?.listLabel === "List of Treatment";
  const isOnlineConsultationServiceList =
    activeModule?.id === "onlineConsultationService" ||
    activeModule?.listLabel === "List of Online Consultation Services";
  const activeBulkUploadTarget: BulkUploadTarget | null = isProductCategoryList
    ? "category"
    : isProductList
    ? "product"
    : isCourseTypeList
    ? "courseType"
    : isCourseList
    ? "course"
    : isTrainingTypeList
    ? "trainingType"
    : isWorkshopTrainingList
    ? "workshopTraining"
    : isClinicCategoryList
    ? "clinicCategory"
    : isClinicList
    ? "clinic"
    : isB2BCategoryList
    ? "b2bCategory"
    : isB2BProductList
    ? "b2bProduct"
    : isServiceCategoryList
    ? "serviceCategory"
    : isTreatmentPlanList
    ? "treatmentPlan"
    : isOnlineConsultationServiceList
    ? "onlineConsultationService"
    : null;

  // If permissions load (or change) and the admin is currently sitting
  // on a section they no longer have view access to, bounce them back
  // to the dashboard home instead of leaving them on a blank module.
  useEffect(() => {
    if (checkingAuth) return;
    if (activeSection === "dashBoard") return;
    const stillVisible = visibleModules.some((m) => m.id === activeSection);
    const othersSectionIds = [
      "listOfTopProduct",
      "offer1",
      "offer2",
      "offer3",
      "featuredSection",
      "latestshorts",
      "treatmentshorts",
      "supportTickets",
    ];
    const isOthersSection = othersSectionIds.includes(activeSection);
    if (!stillVisible && !(isOthersSection && canView("others"))) {
      setActiveSection("dashBoard");
      setSectionMode("list");
    }
  }, [checkingAuth, activeSection, visibleModules, canView]);

  const handleModuleChange = (moduleId: string) => {
    setActiveSection(moduleId);
    setSectionMode("list");
    setOthersOpen(false);
    setSidebarOpen(false);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSectionMode("list");
    // Deliberately NOT collapsing "Others" here — this handler is used by
    // its own sub-items, and collapsing on every click made the group feel
    // broken. It only collapses when the "OTHERS" header itself is clicked.
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
      { key: "b2bUsers", url: `${API_URL}/b2b-users` },
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
          b2bUsers: [] as any[],
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

  // Only show the stat cards for sections this admin can actually view
  // (Super Admin sees all of them, as before).
  const statCards = [
    {
      moduleId: "admin",
      label: "Admins",
      value: summaryData.admins.length,
      icon: <FiUserCheck />,
      tone: styles.toneAdmins,
    },
    {
      moduleId: "user",
      label: "Users",
      value: summaryData.users.length,
      icon: <FiUsers />,
      tone: styles.toneUsers,
    },
    {
      moduleId: "doctor",
      label: "Doctors",
      value: summaryData.doctors.length,
      icon: <FiUser />,
      tone: styles.toneDoctors,
    },
    {
      moduleId: "clinic",
      label: "Clinics",
      value: summaryData.clinics.length,
      icon: <FiHome />,
      tone: styles.toneClinics,
    },
    {
      moduleId: "b2bUser",
      label: "B2B Users",
      value: summaryData.b2bUsers.length,
      icon: <FiUserPlus />,
      tone: styles.toneUsers,
    },
    {
      moduleId: "b2bProduct",
      label: "B2B Products",
      value: summaryData.b2bProducts.length,
      icon: <FiBriefcase />,
      tone: styles.toneB2BProducts,
    },
    {
      moduleId: "productCategory",
      label: "Product Categories",
      value: summaryData.productCategories.length,
      icon: <FiGrid />,
      tone: styles.toneProductCategories,
    },
    {
      moduleId: "clinicCategory",
      label: "Clinic Categories",
      value: summaryData.clinicCategories.length,
      icon: <FiLayers />,
      tone: styles.toneClinicCategories,
    },
    {
      moduleId: "serviceCategory",
      label: "Service Categories",
      value: summaryData.serviceCategories.length,
      icon: <FiLayers />,
      tone: styles.toneServiceCategories,
    },
    {
      moduleId: "b2bProductCategory",
      label: "B2B Categories",
      value: summaryData.b2bCategories.length,
      icon: <FiLayers />,
      tone: styles.toneB2BCategories,
    },
    {
      moduleId: "courseType",
      label: "Course Types",
      value: summaryData.courseTypes.length,
      icon: <FiLayers />,
      tone: styles.toneCourseTypes,
    },
  ].filter((card) => canView(card.moduleId));

  const roleDisplayLabel = isSuperAdmin
    ? "Super Admin"
    : adminCustomRoleLabel || adminRole.charAt(0).toUpperCase() + adminRole.slice(1);

  const adminInitials =
    (adminName || "Admin")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (checkingAuth) {
    return <FullPageLoader />;
  }

  return (
    <>
      {/* ORIGINAL TOPBAR – KEPT BUT HIDDEN */}
      <div style={{ display: "none" }}>
        <Topbar hideHamburgerOnMobile />
      </div>

      {/* HEADER */}
      <div className={styles.adminHeader}>
        <Image
          className={styles.logo}
          src="/logo.jpeg"
          alt="Logo"
          width={100}
          height={90}
        />

        <div className={styles.adminHeaderRight}>
          <div className={styles.headerAvatar}>{adminInitials}</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
              {adminName || "Admin"}
            </div>
            <span className={styles.adminTitleBadge}>{roleDisplayLabel}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutTopBtn}>
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
              <FiGrid />
              <span className={styles.label}>Dashboard</span>
            </span>
          </li>

          {/* Only modules this admin can VIEW show up here at all. */}
          {visibleModules.map((module) => (
            <li
              key={module.id}
              className={`${styles.menuItem} ${
                activeSection === module.id ? styles.menuItemActive : ""
              }`}
              onClick={() => handleModuleChange(module.id)}
            >
              <span className={styles.iconLabel}>
                {module.icon}
                <span className={styles.label}>{module.label}</span>
              </span>
            </li>
          ))}

          {/* The whole "OTHERS" group is gated behind a single
              "others" permission toggle. */}
          {canView("others") && (
            <>
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
                    Product Offer
                  </li>
                  <li onClick={() => handleSectionChange("offer2")}>
                    Treatment Offer
                  </li>
                  <li onClick={() => handleSectionChange("offer3")}>
                    Clinic Offer
                  </li>
                  <li onClick={() => handleSectionChange("featuredSection")}>
                    Featured Section
                  </li>
                  <li onClick={() => handleSectionChange("latestshorts")}>
                    Latest Shorts
                  </li>
                  <li onClick={() => handleSectionChange("treatmentshorts")}>
                    Treatment Shorts
                  </li>
                  <li onClick={() => handleSectionChange("supportTickets")}>
                    Hiring &amp; Support Tickets
                  </li>
                </ul>
              )}
            </>
          )}

          {!isSuperAdmin && visibleModules.length === 0 && !canView("others") && (
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiLock /> No modules have been granted to your account yet.
            </p>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <div className={styles.mainContent}>
          {activeSection === "dashBoard" && (
            <div className={styles.premiumDashboard}>
              <div className={styles.dashboardHero}>
                <div>
                  <h2 className={styles.heroTitle}>
                    {greeting}, {adminName || "Admin"} 👋
                  </h2>
                  <p className={styles.heroSubtitle}>
                    Real-time snapshot of all critical modules across your
                    platform.
                  </p>
                  <span className={styles.heroRoleBadge}>
                    <FiShield /> {roleDisplayLabel}
                  </span>
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
                {statCards.map((item) => (
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
                {canView("admin") && (
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
                )}

                {canView("doctor") && (
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
                )}

                {canView("clinic") && (
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
                )}

                {canView("product") && (
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
                )}

                {canView("productCategory") && (
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
                )}
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
                    <>
                      {activeBulkUploadTarget && (
                        <button
                          type="button"
                          className={styles.bulkUploadAction}
                          onClick={() => {
                            resetBulkUpload();
                            setBulkUploadTarget(activeBulkUploadTarget);
                          }}
                        >
                          Bulk Upload
                        </button>
                      )}
                      {/* The "Create" button only shows if this admin has
                          create access for this specific module. */}
                      {activeModuleCanCreate && (
                        <button
                          type="button"
                          className={styles.primaryAction}
                          onClick={() => setSectionMode("create")}
                        >
                          {activeModule.createLabel}
                        </button>
                      )}
                    </>
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
                {sectionMode === "list" || !activeModuleCanCreate ? (
                  ActiveListComponent ? (
                    <ActiveListComponent
                      canEdit={activeModuleCanCreate}
                      canDelete={activeModuleCanDelete}
                    />
                  ) : null
                ) : (
                  ActiveCreateComponent ? <ActiveCreateComponent /> : null
                )}
              </div>

              {bulkUploadTarget && createPortal(
                <div className={styles.bulkModalOverlay}>
                  <div className={styles.bulkModal}>
                    <div className={styles.bulkModalHeader}>
                      <div>
                        <p className={styles.moduleKicker}>
                          {BULK_UPLOAD_CONFIG[bulkUploadTarget].kicker}
                        </p>
                        <h3 className={styles.bulkModalTitle}>
                          {BULK_UPLOAD_CONFIG[bulkUploadTarget].title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        className={styles.bulkCloseButton}
                        onClick={() => {
                          resetBulkUpload();
                          setBulkUploadTarget(null);
                        }}
                        aria-label="Close bulk upload"
                      >
                        <FiX />
                      </button>
                    </div>

                    <div className={styles.bulkTemplateRow}>
                      <p className={styles.bulkHint}>{BULK_UPLOAD_CONFIG[bulkUploadTarget].hint}</p>
                      <button
                        type="button"
                        className={styles.bulkTemplateBtn}
                        onClick={() => downloadBulkUploadTemplate(bulkUploadTarget)}
                      >
                        <FiDownload /> Download template
                      </button>
                    </div>

                    {bulkUploadError && (
                      <p className={styles.bulkError}>
                        <FiAlertCircle /> {bulkUploadError}
                      </p>
                    )}

                    {bulkUploadResult && (
                      <div className={styles.bulkResultBox}>
                        {bulkUploadResult.createdCount > 0 && (
                          <p className={styles.bulkSuccess}>
                            <FiCheckCircle /> {bulkUploadResult.createdCount}{" "}
                            {BULK_UPLOAD_CONFIG[bulkUploadTarget].noun} uploaded successfully.
                          </p>
                        )}
                        {bulkUploadResult.skipped.length > 0 && (
                          <div className={styles.bulkSkipped}>
                            <p className={styles.bulkSkippedTitle}>
                              {bulkUploadResult.skipped.length} row
                              {bulkUploadResult.skipped.length > 1 ? "s" : ""} skipped
                            </p>
                            <ul className={styles.bulkSkippedList}>
                              {bulkUploadResult.skipped.slice(0, 25).map((row, index) => (
                                <li key={`${row.row}-${index}`}>
                                  <span className={styles.bulkSkippedRowNum}>Row {row.row}</span>
                                  {row.reason}
                                </li>
                              ))}
                            </ul>
                            {bulkUploadResult.skipped.length > 25 && (
                              <p className={styles.bulkSkippedMore}>
                                +{bulkUploadResult.skipped.length - 25} more
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`${styles.bulkDropzone} ${
                        bulkDragActive ? styles.bulkDropzoneActive : ""
                      } ${bulkFile ? styles.bulkDropzoneHasFile : ""}`}
                      onClick={() => !loadingBulkUpload && bulkFileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setBulkDragActive(true);
                      }}
                      onDragLeave={() => setBulkDragActive(false)}
                      onDrop={handleBulkDrop}
                    >
                      {bulkFile ? (
                        <>
                          <FiFileText className={styles.bulkDropzoneIcon} />
                          <p className={styles.bulkDropzoneFileName}>{bulkFile.name}</p>
                          <span className={styles.bulkDropzoneFileSize}>
                            {formatFileSize(bulkFile.size)}
                          </span>
                          <button
                            type="button"
                            className={styles.bulkRemoveButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              resetBulkUpload();
                            }}
                            disabled={loadingBulkUpload}
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <FiUploadCloud className={styles.bulkDropzoneIcon} />
                          <p className={styles.bulkDropzoneText}>
                            Drag &amp; drop your file here, or click to browse
                          </p>
                          <span className={styles.bulkDropzoneHint}>CSV, XLS, or XLSX</span>
                        </>
                      )}
                    </div>

                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      hidden
                      onChange={handleBulkFile}
                    />

                    <div className={styles.bulkModalActions}>
                      <button
                        type="button"
                        className={styles.secondaryAction}
                        onClick={() => {
                          resetBulkUpload();
                          setBulkUploadTarget(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.primaryAction}
                        onClick={handleBulkUpload}
                        disabled={loadingBulkUpload || !bulkFile}
                      >
                        {loadingBulkUpload ? (
                          <>
                            <FiLoader className={styles.bulkSpinner} /> Uploading...
                          </>
                        ) : (
                          "Upload"
                        )}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          ) : (
            <>
              {canView("others") && activeSection === "listOfTopProduct" && (
                <ListOfTopProduct />
              )}
              {canView("others") && activeSection === "offer1" && <Offer1 />}
              {canView("others") && activeSection === "offer2" && <Offer2 />}
              {canView("others") && activeSection === "offer3" && <Offer3 />}
              {canView("others") && activeSection === "featuredSection" && (
                <FeaturedSectionManager />
              )}
              {canView("others") && activeSection === "latestshorts" && (
                <LatestShorts />
              )}
              {canView("others") && activeSection === "treatmentshorts" && (
                <TreatmentShorts />
              )}
              {canView("others") && activeSection === "supportTickets" && (
                <ListOfSupportTickets />
              )}
              {/* {activeSection === "userorderhistory" && <UserOrderHistory />} */}
              {activeSection === "createPatient" && <CreatePatient />}
              {activeSection === "createTestResult" && <CreateTestResult />}
              {activeSection === "createOnlineDoctor" && <CreateOnlineDoctor />}
              {activeSection === "createSupport" && <CreateSupport />}

            </>
          )}

          <Footer />
        </div>
      </div>

      <MobileNavbar />
    </>
  );
}

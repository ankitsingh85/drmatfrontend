"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiHelpCircle,
  FiSettings,
  FiStar,
  FiChevronRight,
  FiEdit3,
  FiMenu,
  FiX,
  FiLogOut,
} from "react-icons/fi";

import styles from "@/styles/clinicdashboard/clinicportal.module.css";
import { API_URL } from "@/config/api";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";

// import ClinicOverview from "@/components/ClinicAdmin/ClinicDashboardList";
// import Appointment from "@/components/ClinicAdmin/Appointment";
import Lead from "@/components/ClinicAdmin/Lead";
import EditClinic from "@/components/ClinicAdmin/EditClinic";


type JwtPayload = {
  id: string;
  role: string;
  exp: number;
  contactNo?: string;
};

type ClinicRecord = {
  _id: string;
  clinicName?: string;
  contactNumber?: string;
  email?: string;
  clinicLogo?: string;
  doctors?: any[];
  photos?: string[];
  specialOffers?: string[];
  certifications?: string[];
  website?: string;
  dermaCategory?: { _id?: string; name?: string } | string;
};

type SectionId =
  | "dashboard"
  | "profile"
  | "appointments"
  | "lead"
  | "services"
  | "purchased"
  | "help"
  | "settings"
  | "rating";

const resolveMediaUrl = (value?: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("data:")) return value;
  return value.startsWith("/")
    ? `${API_URL.replace(/\/api$/, "")}${value}`
    : value;
};

const getInitials = (name?: string) => {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "C";
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const countFilledProfileFields = (clinic?: ClinicRecord | null) => {
  if (!clinic) return 0;
  const fields = [
    clinic.clinicName,
    clinic.contactNumber,
    clinic.email,
    clinic.website,
    clinic.clinicLogo,
    clinic.dermaCategory,
    clinic.doctors?.length ? "1" : "",
    clinic.photos?.length ? "1" : "",
    clinic.specialOffers?.length ? "1" : "",
    clinic.certifications?.length ? "1" : "",
  ];
  return fields.filter(Boolean).length;
};

export default function ClinicDashboard() {
  const router = useRouter();
  const [clinicId, setClinicId] = useState("");
  const [clinic, setClinic] = useState<ClinicRecord | null>(null);
  const [leadCount, setLeadCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<
    Array<{
      _id: string;
      actionType?: "call" | "whatsapp";
      userName?: string;
      createdAt?: string;
    }>
  >([]);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role")?.toLowerCase();

    if (!token || role !== "clinic") {
      setCheckingAuth(false);
      router.replace("/cliniclogin");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.exp * 1000 < Date.now() || decoded.role?.toLowerCase() !== "clinic") {
        Cookies.remove("token");
        Cookies.remove("role");
        router.replace("/cliniclogin");
        return;
      }

      setClinicId(decoded.id);
      setCheckingAuth(false);
    } catch {
      Cookies.remove("token");
      Cookies.remove("role");
      router.replace("/cliniclogin");
      setCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobile && sidebarOpen ? "hidden" : "auto";
  }, [isMobile, sidebarOpen]);

  const fetchClinic = async (id: string) => {
    if (!id) return;

    setLoadingClinic(true);
    try {
      const res = await fetch(`${API_URL}/clinics/${id}`);
      if (!res.ok) throw new Error("Failed to fetch clinic profile");
      const data = await res.json();
      setClinic(data);
    } catch (error) {
      console.error("Failed to load clinic profile:", error);
      setClinic(null);
    } finally {
      setLoadingClinic(false);
    }
  };

  const fetchLeadSummary = async (id: string) => {
    const token = Cookies.get("token");
    if (!id || !token) return;

    try {
      const res = await fetch(`${API_URL}/leads/clinic/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      setLeadCount(items.length);
      setRecentLeads(items.slice(0, 3));
    } catch {
      setLeadCount(0);
      setRecentLeads([]);
    }
  };

  useEffect(() => {
    if (clinicId) {
      fetchClinic(clinicId);
      void fetchLeadSummary(clinicId);
    }
  }, [clinicId]);

  const handleClinicSaved = (updatedClinic?: ClinicRecord) => {
    if (updatedClinic) {
      setClinic(updatedClinic);
    } else if (clinicId) {
      void fetchClinic(clinicId);
    }
    setActiveSection("dashboard");
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("username");
    Cookies.remove("clinicName");
    Cookies.remove("clinicId");
    Cookies.remove("email");
    Cookies.remove("contactNo");
    localStorage.removeItem("clinicId");
    router.replace("/cliniclogin");
  };

  const menuItems = useMemo(
    () => [
      { id: "dashboard" as const, label: "Dashboard", icon: FiHome },
      { id: "appointments" as const, label: "Appointments", icon: FiCalendar },
      { id: "lead" as const, label: "Lead", icon: FiUsers },
      // { id: "doctors" as const, label: "Doctors", icon: FiUsers },
      // { id: "services" as const, label: "Services", icon: FiClipboard },
      // { id: "purchased" as const, label: "Purchased Services", icon: FiClipboard },
      { id: "help" as const, label: "Help Center", icon: FiHelpCircle },
      { id: "settings" as const, label: "Settings", icon: FiSettings },
      { id: "rating" as const, label: "Like Us? Give us 5 Stars", icon: FiStar },
    ],
    []
  );

  const profileCompletion = Math.round(
    (countFilledProfileFields(clinic) / 10) * 100
  );

  const dashboardCards = [
    {
      label: "Profile completion",
      value: `${profileCompletion}%`,
      detail:
        profileCompletion >= 80
          ? "Your listing looks strong."
          : "Fill a few more details to improve visibility.",
    },
    {
      label: "Doctors added",
      value: String(clinic?.doctors?.length || 0),
      detail: "Team members listed in your clinic profile.",
    },
    {
      label: "Lead count",
      value: String(leadCount),
      detail: "Users who tapped Call or WhatsApp.",
    },
    {
      label: "Contact status",
      value: clinic?.contactNumber || clinic?.email || "Pending",
      detail: "Primary contact shown to patients.",
    },
  ];

  const profileChecklist = [
    { label: "Clinic name", done: Boolean(clinic?.clinicName) },
    { label: "Contact number", done: Boolean(clinic?.contactNumber) },
    { label: "Email", done: Boolean(clinic?.email) },
    { label: "Website", done: Boolean(clinic?.website) },
    { label: "Logo", done: Boolean(clinic?.clinicLogo) },
    { label: "Doctors", done: Boolean(clinic?.doctors?.length) },
    { label: "Photos", done: Boolean(clinic?.photos?.length) },
    { label: "Offers", done: Boolean(clinic?.specialOffers?.length) },
    { label: "Certifications", done: Boolean(clinic?.certifications?.length) },
  ];

  const quickActions = [
    {
      label: "Edit Profile",
      description: "Update clinic info",
      action: () => setActiveSection("profile"),
    },
    {
      label: "View Leads",
      description: "Open lead inbox",
      action: () => setActiveSection("lead"),
    },
  ];

  const renderDashboardOverview = () => (
    <div className={styles.sectionShell}>
      <div className={styles.heroTop}>
        <div>
          <p className={styles.kicker}>Business Workspace</p>
          <h2 className={styles.title}>{activeTitle}</h2>
          <p className={styles.subtitle}>
            Manage your clinic details, track user interest, and keep the
            profile complete from one place. Your dashboard now highlights the
            most useful signals first.
          </p>
        </div>

        <div>
          <button
            type="button"
            className={styles.editProfileBtn}
            onClick={() => setActiveSection("profile")}
          >
            <span className={styles.inlineCenter}>
              <FiEdit3 />
              Edit Profile
            </span>
          </button>
        </div>
      </div>

      <div className={styles.heroStats}>
        {dashboardCards.map((card) => (
          <div key={card.label} className={styles.statCard}>
            <p className={styles.statLabel}>{card.label}</p>
            <p className={styles.statValue}>{card.value}</p>
            <p className={styles.sectionSubtext}>{card.detail}</p>
          </div>
        ))}
      </div>

      <div className={styles.dashboardLayout}>
        <div className={styles.checklistPanel}>
          <div className={styles.heroTop}>
            <div>
              <h3 className={styles.sectionHeading}>Profile checklist</h3>
              <p className={styles.sectionSubtext}>
                These are the fields we use to build a stronger clinic profile.
              </p>
            </div>
            <span className={styles.completionBadge}>
              {profileCompletion}% complete
            </span>
          </div>

          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Profile progress</span>
              <span className={styles.progressHint}>
                Keep filling the missing items
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${
                  profileCompletion >= 80 ? styles.progressFillHigh : ""
                } ${
                  profileCompletion >= 90
                    ? styles.progress100
                    : profileCompletion >= 75
                    ? styles.progress75
                    : profileCompletion >= 50
                    ? styles.progress50
                    : profileCompletion >= 25
                    ? styles.progress25
                    : ""
                }`}
              />
            </div>
          </div>

          <div className={styles.checklistGrid}>
            {profileChecklist.map((item) => (
              <div key={item.label} className={styles.checklistItem}>
                <span>{item.label}</span>
                <span
                  className={
                    item.done ? styles.checklistStatusDone : styles.checklistStatusMissing
                  }
                >
                  {item.done ? "Done" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.leadPanel}>
          <h3 className={styles.sectionHeading}>Recent leads</h3>
          <p className={styles.sectionSubtext}>
            Latest user actions from your clinic card.
          </p>

          <div className={styles.quickActionsGrid}>
            {quickActions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className={styles.quickActionBtn}
              >
                <div className={styles.quickActionRow}>
                  <div>
                    <div className={styles.quickActionTitle}>{item.label}</div>
                    <div className={styles.quickActionDesc}>{item.description}</div>
                  </div>
                  <FiChevronRight color="#64748b" />
                </div>
              </button>
            ))}
          </div>

          <div className={styles.recentList}>
            {recentLeads.length === 0 ? (
              <div className={styles.leadEmptyState}>No lead activity yet.</div>
            ) : (
              recentLeads.map((item) => (
                <div key={item._id} className={styles.recentLeadCard}>
                  <div className={styles.recentLeadHeader}>
                    <strong className={styles.recentLeadTitle}>
                      {item.actionType === "whatsapp" ? "WhatsApp" : "Call"}
                    </strong>
                    <span className={styles.recentLeadDate}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <p className={styles.recentLeadUser}>
                    {item.userName || "Unknown user"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const activeTitle = {
    dashboard: "Clinic Dashboard",
    profile: "Edit Profile",
    appointments: "Appointments",
    lead: "Lead",
    services: "Services",
    purchased: "Purchased Services",
    help: "Help Center",
    settings: "Settings",
    rating: "Rating",
  }[activeSection];

  const renderContent = () => {
    if (activeSection === "dashboard") {
      return renderDashboardOverview();
    }

    if (activeSection === "profile") {
      return (
        <div className={styles.sectionShell}>
          <EditClinic clinicId={clinicId} clinic={clinic} onSaved={handleClinicSaved} />
        </div>
      );
    }

    return (
      <div className={styles.sectionShell}>
        <div className={styles.placeholderBox}>
          <h3>{activeTitle}</h3>
          <p>
            This section opens in a focused view so the Dashboard stays clean
            and the important summary remains only on the main tab.
          </p>
        </div>

        {activeSection === "lead" && (
          <div className={styles.sectionSpacer}>
            <Lead clinicId={clinicId} />
          </div>
        )}
      </div>
    );
  };

  if (checkingAuth) {
    return null;
  }

  const sidebar = (
    <aside className={`${styles.sidebar} ${isMobile && sidebarOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarInner}>
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            {clinic?.clinicLogo ? (
              <img
                src={resolveMediaUrl(clinic.clinicLogo)}
                alt={clinic.clinicName || "Clinic"}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {getInitials(clinic?.clinicName || "Clinic")}
              </div>
            )}
          </div>

          <div className={styles.profileMeta}>
            <h1 className={styles.profileName}>
              {clinic?.clinicName || "Clinic Profile"}
            </h1>
            <p className={styles.profilePhone}>
              {clinic?.contactNumber || "No contact number yet"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={styles.editProfileBtn}
          onClick={() => {
            setActiveSection("profile");
            setSidebarOpen(false);
          }}
        >
          Edit Profile
        </button>

        <div className={styles.menu}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className={styles.menuLabel}>
                  <Icon className={styles.menuIcon} />
                  {item.label}
                </span>
                <FiChevronRight className={styles.menuArrow} />
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.sidebarFooter}>
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <span className={styles.inlineCenter}>
            <FiLogOut />
            Logout
          </span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <Topbar />

      <div className={styles.page}>
        {isMobile && sidebarOpen && (
          <div
            className={styles.mobileSidebarBackdrop}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {isMobile && (
          <div className={styles.mobileHeader}>
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle clinic menu"
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        )}

        <div className={styles.shell}>
          {sidebar}

          <main className={styles.content}>
            {loadingClinic ? (
              <div className={styles.sectionShell}>
                <div className={styles.placeholderBox}>
                  <h3>Loading clinic profile</h3>
                  <p>Please wait while we fetch your clinic details.</p>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  FiHome,
  FiCalendar,
  FiUsers,
  FiClipboard,
  FiHelpCircle,
  FiSettings,
  FiStar,
  FiChevronRight,
  FiEdit3,
  FiMenu,
  FiX,
  FiLogOut,
  FiPhone,
  FiMail,
} from "react-icons/fi";

import styles from "@/styles/clinicdashboard/clinicportal.module.css";
import { API_URL } from "@/config/api";

import ClinicOverview from "@/components/ClinicAdmin/ClinicDashboardList";
import Appointment from "@/components/ClinicAdmin/Appointment";
import Doctors from "@/components/ClinicAdmin/Doctors";
import EditClinic from "@/components/ClinicAdmin/EditClinic";
import ClinicServices from "@/components/ClinicAdmin/CreateServices";
import ListOfAppointments from "@/components/ClinicAdmin/ListOfAppointments";
import ListOfDoctors from "@/components/ClinicAdmin/ListOfDoctors";
import ListOfServices from "@/components/ClinicAdmin/ListOfServices";
import PurchasedServices from "@/components/ClinicAdmin/PurchasedServices";

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
  | "doctors"
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

  useEffect(() => {
    if (clinicId) {
      fetchClinic(clinicId);
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
      { id: "doctors" as const, label: "Doctors", icon: FiUsers },
      { id: "services" as const, label: "Services", icon: FiClipboard },
      { id: "purchased" as const, label: "Purchased Services", icon: FiClipboard },
      { id: "help" as const, label: "Help Center", icon: FiHelpCircle },
      { id: "settings" as const, label: "Settings", icon: FiSettings },
      { id: "rating" as const, label: "Like Us? Give us 5 Stars", icon: FiStar },
    ],
    []
  );

  const profileCompletion = Math.round(
    (countFilledProfileFields(clinic) / 10) * 100
  );

  const activeTitle = {
    dashboard: "Clinic Dashboard",
    profile: "Edit Profile",
    appointments: "Appointments",
    doctors: "Doctors",
    services: "Services",
    purchased: "Purchased Services",
    help: "Help Center",
    settings: "Settings",
    rating: "Rating",
  }[activeSection];

  const renderContent = () => {
    if (activeSection === "dashboard") {
      return (
        <div className={styles.sectionShell}>
          <ClinicOverview />
        </div>
      );
    }

    if (activeSection === "profile") {
      return (
        <div className={styles.sectionShell}>
          <EditClinic clinicId={clinicId} clinic={clinic} onSaved={handleClinicSaved} />
        </div>
      );
    }

    if (activeSection === "appointments") {
      return (
        <div className={styles.sectionShell}>
          <Appointment />
        </div>
      );
    }

    if (activeSection === "doctors") {
      return (
        <div className={styles.sectionShell}>
          <Doctors />
        </div>
      );
    }

    if (activeSection === "services") {
      return (
        <div className={styles.sectionShell}>
          <ClinicServices />
        </div>
      );
    }

    if (activeSection === "purchased") {
      return (
        <div className={styles.sectionShell}>
          <PurchasedServices />
        </div>
      );
    }

    return (
      <div className={styles.sectionShell}>
        <div className={styles.placeholderBox}>
          <h3>{activeTitle}</h3>
          <p>
            This section is ready for your clinic workspace. You can keep using
            the dashboard tools on the left while we wire more actions here.
          </p>
        </div>
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FiLogOut />
            Logout
          </span>
        </button>
      </div>
    </aside>
  );

  return (
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
          <section className={styles.contentHero}>
            <div className={styles.heroTop}>
              <div>
                <p className={styles.kicker}>Business Workspace</p>
                <h2 className={styles.title}>{activeTitle}</h2>
                <p className={styles.subtitle}>
                  Manage your clinic details, content, and daily operations from
                  one clean workspace. Update your profile whenever you need to
                  keep the clinic listing complete and current.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  className={styles.editProfileBtn}
                  onClick={() => setActiveSection("profile")}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <FiEdit3 />
                    Edit Profile
                  </span>
                </button>
              </div>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Profile completion</p>
                <p className={styles.statValue}>{profileCompletion}%</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Doctors added</p>
                <p className={styles.statValue}>{clinic?.doctors?.length || 0}</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Contact</p>
                <p className={styles.statValue}>
                  {clinic?.contactNumber || clinic?.email || "Pending"}
                </p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Support</p>
                <p className={styles.statValue}>Ready</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "#fff",
                  border: "1px solid rgba(153, 169, 192, 0.25)",
                  color: "#39506b",
                  fontWeight: 600,
                }}
              >
                <FiPhone />
                {clinic?.contactNumber || "No mobile number"}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "#fff",
                  border: "1px solid rgba(153, 169, 192, 0.25)",
                  color: "#39506b",
                  fontWeight: 600,
                }}
              >
                <FiMail />
                {clinic?.email || "No email yet"}
              </span>
            </div>
          </section>

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
  );
}

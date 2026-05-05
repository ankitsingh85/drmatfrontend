"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  FiCalendar,
  FiChevronRight,
  FiEdit3,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiShoppingBag,
  FiStar,
  FiUser,
  FiX,
} from "react-icons/fi";

import styles from "@/styles/clinicdashboard/clinicportal.module.css";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import ListOfAppointments from "@/components/DoctorAdmin/ListOfAppointments";
import ProfileEdit, { DoctorProfileRecord } from "@/components/DoctorAdmin/ProfileEdit";
import Ratings from "@/components/DoctorAdmin/Ratings";
import DoctorChat from "@/components/DoctorAdmin/DoctorChat";
import DoctorOrderHistory from "@/components/DoctorAdmin/DoctorOrderHistory";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";

type SectionId =
  | "dashboard"
  | "appointments"
  | "profile"
  | "orders"
  | "ratings"
  | "chat"
  | "help"
  | "settings";

const getInitials = (doctor?: DoctorProfileRecord | null) => {
  const name =
    doctor?.name ||
    [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") ||
    "Doctor";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const getDoctorName = (doctor?: DoctorProfileRecord | null) =>
  doctor?.name ||
  [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") ||
  "Doctor Profile";

const countFilledProfileFields = (doctor?: DoctorProfileRecord | null) => {
  if (!doctor) return 0;
  const fields = [
    doctor.profileImage,
    doctor.title,
    doctor.firstName,
    doctor.lastName,
    doctor.specialist,
    doctor.email,
    doctor.phone || doctor.contactNo,
    doctor.description,
  ];
  return fields.filter(Boolean).length;
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState("");
  const [doctor, setDoctor] = useState<DoctorProfileRecord | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role")?.toLowerCase();
    const storedDoctorId = Cookies.get("doctorId") || localStorage.getItem("doctorId") || "";

    if (!token || role !== "doctor") {
      setCheckingAuth(false);
      router.replace("/doctorlogin");
      return;
    }

    setDoctorId(storedDoctorId);
    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    const allowedSections: SectionId[] = [
      "dashboard",
      "appointments",
      "profile",
      "orders",
      "ratings",
      "chat",
      "help",
      "settings",
    ];

    if (section && allowedSections.includes(section as SectionId)) {
      setActiveSection(section as SectionId);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobile && sidebarOpen ? "hidden" : "auto";
  }, [isMobile, sidebarOpen]);

  const fetchDoctor = async () => {
    const token = Cookies.get("token");
    if (!token) return;

    setLoadingDoctor(true);
    try {
      const res = await fetch(`${API_URL}/doctors/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch doctor profile");
      const data = await res.json();
      const nextDoctorId = data.id || data._id || doctorId;
      setDoctor({ ...data, id: nextDoctorId });
      if (data.profileImage) {
        const normalizedProfileImage = resolveMediaUrl(data.profileImage) || data.profileImage;
        Cookies.set("profileImage", normalizedProfileImage, { path: "/" });
        localStorage.setItem("profileImage", normalizedProfileImage);
      }
      if (nextDoctorId) {
        setDoctorId(nextDoctorId);
        Cookies.set("doctorId", nextDoctorId, { path: "/" });
        localStorage.setItem("doctorId", nextDoctorId);
      }
    } catch (error) {
      console.error("Failed to load doctor profile:", error);
      setDoctor(null);
    } finally {
      setLoadingDoctor(false);
    }
  };

  const fetchOrderSummary = async (id: string) => {
    const token = Cookies.get("token");
    if (!id || !token) return;

    try {
      const res = await fetch(`${API_URL}/doctor-orders/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-doctor-id": id,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setOrderCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setOrderCount(0);
    }
  };

  useEffect(() => {
    if (!checkingAuth) {
      void fetchDoctor();
    }
  }, [checkingAuth]);

  useEffect(() => {
    if (doctorId) {
      void fetchOrderSummary(doctorId);
    }
  }, [doctorId]);

  const handleDoctorSaved = (updatedDoctor?: DoctorProfileRecord) => {
    if (updatedDoctor) {
      setDoctor((prev) => ({ ...prev, ...updatedDoctor }));
      if (updatedDoctor.id || updatedDoctor._id) {
        setDoctorId(updatedDoctor.id || updatedDoctor._id || "");
      }
    } else {
      void fetchDoctor();
    }
    setActiveSection("profile");
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    [
      "token",
      "role",
      "username",
      "email",
      "contactNo",
      "doctorId",
      "userId",
      "clinicId",
      "clinicName",
      "profileImage",
      "location",
      "cartScope",
    ].forEach((key) => Cookies.remove(key, { path: "/" }));

    ["doctorId", "userId", "clinicId", "profileImage", "cartScope"].forEach((key) => {
      localStorage.removeItem(key);
    });

    window.dispatchEvent(new CustomEvent("user-logged-out"));
    router.replace("/doctorlogin");
  };

  const menuItems = useMemo(
    () => [
      { id: "dashboard" as const, label: "Dashboard", icon: FiHome },
      // { id: "appointments" as const, label: "Appointments", icon: FiCalendar },
      { id: "profile" as const, label: "Edit Profile", icon: FiUser },
      { id: "orders" as const, label: "Orders", icon: FiShoppingBag },
      // { id: "chat" as const, label: "Chat", icon: FiMessageSquare },
      { id: "ratings" as const, label: "Ratings", icon: FiStar },
      { id: "help" as const, label: "Help Center", icon: FiHelpCircle },
      { id: "settings" as const, label: "Settings", icon: FiSettings },
    ],
    []
  );

  const profileCompletion = Math.round((countFilledProfileFields(doctor) / 8) * 100);
  const activeTitle = {
    dashboard: "Doctor Dashboard",
    appointments: "Appointments",
    profile: "Edit Profile",
    orders: "Orders",
    ratings: "Ratings",
    chat: "Chat",
    help: "Help Center",
    settings: "Settings",
  }[activeSection];

  const dashboardCards = [
    {
      label: "Profile completion",
      value: `${profileCompletion}%`,
      detail:
        profileCompletion >= 80
          ? "Your doctor profile looks strong."
          : "Fill a few more details for a cleaner profile.",
    },
    {
      label: "Specialist",
      value: doctor?.specialist || "Pending",
      detail: "Primary speciality shown in doctor records.",
    },
    {
      label: "Orders placed",
      value: String(orderCount),
      detail: "Doctor purchases across products, courses, and workshops.",
    },
    {
      label: "Contact status",
      value: doctor?.phone || doctor?.contactNo || doctor?.email || "Pending",
      detail: "Primary contact attached to this doctor account.",
    },
  ];

  const profileChecklist = [
    { label: "Title", done: Boolean(doctor?.title) },
    { label: "Profile picture", done: Boolean(doctor?.profileImage) },
    { label: "First name", done: Boolean(doctor?.firstName) },
    { label: "Last name", done: Boolean(doctor?.lastName) },
    { label: "Specialist", done: Boolean(doctor?.specialist) },
    { label: "Email", done: Boolean(doctor?.email) },
    { label: "Mobile number", done: Boolean(doctor?.phone || doctor?.contactNo) },
    { label: "Description", done: Boolean(doctor?.description) },
  ];

  const quickActions = [
    {
      label: "Edit Profile",
      description: "Update doctor info",
      action: () => setActiveSection("profile"),
    },
    {
      label: "View Orders",
      description: "Open doctor purchases",
      action: () => setActiveSection("orders"),
    },
    {
      label: "Appointments",
      description: "Check appointment list",
      action: () => setActiveSection("appointments"),
    },
  ];

  const renderDashboardOverview = () => (
    <div className={styles.sectionShell}>
      <div className={styles.heroTop}>
        <div>
          <p className={styles.kicker}>Doctor Workspace</p>
          <h2 className={styles.title}>{activeTitle}</h2>
          <p className={styles.subtitle}>
            Manage your profile, review appointments, and track purchases from one focused workspace.
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
                These details keep your doctor profile and checkout records complete.
              </p>
            </div>
            <span className={styles.completionBadge}>
              {profileCompletion}% complete
            </span>
          </div>

          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Profile progress</span>
              <span className={styles.progressHint}>Keep filling missing items</span>
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
                <span className={item.done ? styles.checklistStatusDone : styles.checklistStatusMissing}>
                  {item.done ? "Done" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.leadPanel}>
          <h3 className={styles.sectionHeading}>Quick actions</h3>
          <p className={styles.sectionSubtext}>
            Jump into the doctor tasks you use most.
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
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeSection === "dashboard") return renderDashboardOverview();
    if (activeSection === "profile") {
      return (
        <div className={styles.sectionShell}>
          <ProfileEdit doctor={doctor} onSaved={handleDoctorSaved} />
        </div>
      );
    }
    if (activeSection === "appointments") {
      return (
        <div className={styles.sectionShell}>
                    <DoctorChat />

        </div>
      );
    }
    if (activeSection === "orders") {
      return (
        <div className={styles.sectionShell}>
          <DoctorOrderHistory doctorId={doctorId} />
        </div>
      );
    }
    // if (activeSection === "chat") {
    //   return (
    //     <div className={styles.sectionShell}>
    //     </div>
    //   );
    // }
    if (activeSection === "ratings") {
      return (
        <div className={styles.sectionShell}>
          <Ratings />
        </div>
      );
    }

    return (
      <div className={styles.sectionShell}>
        <div className={styles.placeholderBox}>
          <h3>{activeTitle}</h3>
          <p>This section is ready for doctor-specific settings and support tools.</p>
        </div>
      </div>
    );
  };

  if (checkingAuth) return null;

  const sidebar = (
    <aside className={`${styles.sidebar} ${isMobile && sidebarOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarInner}>
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            {doctor?.profileImage ? (
              <img
                src={resolveMediaUrl(doctor.profileImage) || doctor.profileImage}
                alt={getDoctorName(doctor)}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>{getInitials(doctor)}</div>
            )}
          </div>

          <div className={styles.profileMeta}>
            <h1 className={styles.profileName}>{getDoctorName(doctor)}</h1>
            <p className={styles.profilePhone}>
              {doctor?.phone || doctor?.contactNo || "No contact number yet"}
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
              aria-label="Toggle doctor menu"
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        )}

        <div className={styles.shell}>
          {sidebar}

          <main className={styles.content}>
            {loadingDoctor ? (
              <div className={styles.sectionShell}>
                <div className={styles.placeholderBox}>
                  <h3>Loading doctor profile</h3>
                  <p>Please wait while we fetch your doctor details.</p>
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

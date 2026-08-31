"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  FiHome,
  FiShoppingBag,
  FiHelpCircle,
  FiSettings,
  FiChevronRight,
  FiEdit3,
  FiMenu,
  FiX,
  FiLogOut,
  FiBox,
  FiCalendar,
  FiBookOpen,
  FiShoppingCart,
  FiTrendingUp,
  FiUser,
  FiActivity,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiMapPin,
} from "react-icons/fi";

import dashboardStyles from "@/styles/clinicdashboard/clinicportal.module.css";
import formStyles from "@/styles/clinicdashboard/editprofile.module.css";
import { API_URL } from "@/config/api";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import B2BOrderHistory from "@/components/B2BAdmin/B2BOrderHistory";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

type JwtPayload = {
  id: string;
  role: string;
  exp: number;
  contactNo?: string;
};

type B2BUserRecord = {
  _id: string;
  b2bUserId: string;
  name: string;
  contactPerson: string;
  email?: string;
  contactNo: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: "active" | "inactive";
  pendingClinicId?: string;
};

type SectionId = "dashboard" | "profile" | "orders" | "help" | "settings";

const quickLinks = [
  { label: "B2B Products", description: "Browse B2B product catalog", href: "/home/B2bProductsList", icon: FiBox },
  { label: "Workshop Trainings", description: "Upcoming trainings and workshops", href: "/workshop-trainings", icon: FiCalendar },
  { label: "Buy Courses", description: "Explore available courses", href: "/course-listing", icon: FiBookOpen },
  { label: "My Cart", description: "Review items in your cart", href: "/home/Cart", icon: FiShoppingCart },
];

const getInitials = (name?: string) => {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "B";
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const countFilledProfileFields = (user?: B2BUserRecord | null) => {
  if (!user) return 0;
  const fields = [
    user.name,
    user.email,
    user.address,
    user.city,
    user.state,
    user.pincode,
  ];
  return fields.filter(Boolean).length;
};

export default function B2BUserDashboard() {
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [b2bUserId, setB2bUserId] = useState("");
  const [user, setUser] = useState<B2BUserRecord | null>(null);
  const [form, setForm] = useState<Partial<B2BUserRecord>>({});
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    email: "",
    gstNumber: "",
  });

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role")?.toLowerCase();

    if (!token || role !== "b2buser") {
      setCheckingAuth(false);
      router.replace("/businesslogin");
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.exp * 1000 < Date.now() || decoded.role?.toLowerCase() !== "b2buser") {
        Cookies.remove("token");
        Cookies.remove("role");
        router.replace("/businesslogin");
        return;
      }
    } catch {
      Cookies.remove("token");
      Cookies.remove("role");
      router.replace("/businesslogin");
      setCheckingAuth(false);
      return;
    }

    const id = Cookies.get("b2bUserId") || localStorage.getItem("b2bUserId") || "";
    if (!id) {
      setCheckingAuth(false);
      router.replace("/businesslogin");
      return;
    }

    setB2bUserId(id);
    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    const allowedSections: SectionId[] = [
      "dashboard",
      "profile",
      "orders",
      "help",
      "settings",
    ];

    if (section && allowedSections.includes(section as SectionId)) {
      setActiveSection(section as SectionId);
    }

    if (params.get("openBecomeClinic") === "1") {
      setShowClinicModal(true);
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

  const fetchUser = async (id: string) => {
    setLoadingUser(true);
    try {
      const res = await fetch(`${API_URL}/b2b-users/${id}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data);
      setForm(data);
      setClinicForm({
        name: data.name || "",
        address: data.address || "",
        email: data.email || "",
        gstNumber: data.gstNumber || "",
      });
    } catch (error) {
      console.error("Failed to load B2B user profile:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (b2bUserId) fetchUser(b2bUserId);
  }, [b2bUserId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!b2bUserId) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/b2b-users/${b2bUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update profile");

      setUser(data);
      setForm(data);
      Cookies.set("username", data.name || "", { path: "/" });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    [
      "token",
      "role",
      "username",
      "email",
      "contactNo",
      "b2bUserId",
      "profileImage",
      "cartScope",
    ].forEach((key) => Cookies.remove(key, { path: "/" }));
    ["b2bUserId", "profileImage", "cartScope"].forEach((key) =>
      localStorage.removeItem(key)
    );
    window.dispatchEvent(new CustomEvent("user-logged-out"));
    router.replace("/businesslogin");
  };

  const handleClinicFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setClinicForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBecomeClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!b2bUserId) return;

    if (!clinicForm.name.trim() || !clinicForm.address.trim()) {
      toast.error("Business name and address are required");
      return;
    }

    const confirmed = await confirmDialog(
      "This submits a clinic registration for admin approval. You'll keep using your B2B account as normal until it's approved.",
      { title: "Submit clinic application?", confirmLabel: "Submit" }
    );
    if (!confirmed) return;

    setConverting(true);
    try {
      const res = await fetch(
        `${API_URL}/b2b-users/${b2bUserId}/convert-to-clinic`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clinicForm.name.trim(),
            address: clinicForm.address.trim(),
            email: clinicForm.email.trim(),
            gstNumber: clinicForm.gstNumber.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to submit clinic application");

      toast.success(
        data.message || "Your clinic application has been submitted for admin approval."
      );
      setShowClinicModal(false);
      if (b2bUserId) fetchUser(b2bUserId);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit clinic application");
    } finally {
      setConverting(false);
    }
  };

  const menuItems = useMemo(
    () => [
      { id: "dashboard" as const, label: "Dashboard", icon: FiHome },
      { id: "orders" as const, label: "Orders", icon: FiShoppingBag },
      { id: "help" as const, label: "Help Center", icon: FiHelpCircle },
      { id: "settings" as const, label: "Settings", icon: FiSettings },
    ],
    []
  );

  const profileCompletion = Math.round(
    (countFilledProfileFields(user) / 6) * 100
  );

  const dashboardCards = [
    {
      label: "Profile completion",
      value: `${profileCompletion}%`,
      detail:
        profileCompletion >= 80
          ? "Your profile looks complete."
          : "Fill a few more details to complete your profile.",
      icon: FiUser,
    },
    {
      label: "Account status",
      value: user?.status === "inactive" ? "Inactive" : "Active",
      detail: "Current status of your B2B account.",
      icon: FiActivity,
    },
    {
      label: "Contact status",
      value: user?.contactNo || user?.email || "Pending",
      detail: "Primary contact on file.",
      icon: FiPhone,
    },
  ];

  const activeTitle = {
    dashboard: "B2B Dashboard",
    profile: "Edit Profile",
    orders: "Orders",
    help: "Help Center",
    settings: "Settings",
  }[activeSection];

  const renderDashboardOverview = () => (
    <div className={dashboardStyles.sectionShell}>
      {user?.pendingClinicId && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 14,
            background: "rgba(21, 105, 142, 0.08)",
            border: "1px solid rgba(21, 105, 142, 0.18)",
            color: "#0d4a66",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Your clinic application is submitted and awaiting admin approval. You can keep
          using your B2B account as normal in the meantime.
        </div>
      )}

      <div className={dashboardStyles.heroTop}>
        <div>
          <p className={dashboardStyles.kicker}>B2B Workspace</p>
          <h2 className={dashboardStyles.title}>{activeTitle}</h2>
          <p className={dashboardStyles.subtitle}>
            Manage your B2B profile and shop B2B products, workshops, and
            courses from one place.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className={dashboardStyles.editProfileBtn}
            onClick={() => setActiveSection("orders")}
          >
            <span className={dashboardStyles.inlineCenter}>
              <FiShoppingBag />
              View Orders
            </span>
          </button>
          <button
            type="button"
            className={dashboardStyles.editProfileBtn}
            onClick={() => setActiveSection("profile")}
          >
            <span className={dashboardStyles.inlineCenter}>
              <FiEdit3 />
              Edit Profile
            </span>
          </button>
        </div>
      </div>

      <div className={dashboardStyles.heroStats}>
        {dashboardCards.map((card) => {
          const StatIcon = card.icon;
          return (
            <div key={card.label} className={dashboardStyles.statCard}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    background: "rgba(21, 105, 142, 0.1)",
                    color: "#156989",
                    flexShrink: 0,
                  }}
                >
                  <StatIcon size={15} />
                </span>
                <p className={dashboardStyles.statLabel} style={{ margin: 0 }}>
                  {card.label}
                </p>
              </div>
              <p className={dashboardStyles.statValue}>{card.value}</p>
              <p className={dashboardStyles.sectionSubtext}>{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className={dashboardStyles.leadPanel}>
        <h3 className={dashboardStyles.sectionHeading}>B2B quick links</h3>
        <p className={dashboardStyles.sectionSubtext}>
          Jump straight to B2B products, workshops, and courses.
        </p>

        <div className={dashboardStyles.quickActionsGrid}>
          {quickLinks.map((item) => {
            const LinkIcon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={dashboardStyles.quickActionBtn}
              >
                <div className={dashboardStyles.quickActionRow}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: "rgba(21, 105, 142, 0.1)",
                      color: "#156989",
                      flexShrink: 0,
                    }}
                  >
                    <LinkIcon size={17} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className={dashboardStyles.quickActionTitle}>{item.label}</div>
                    <div className={dashboardStyles.quickActionDesc}>{item.description}</div>
                  </div>
                  <FiChevronRight color="#64748b" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderProfileForm = () => (
    <div className={dashboardStyles.sectionShell}>
      <div className={formStyles.summaryCard}>
        <div className={formStyles.sectionHeader}>
          <h3 className={formStyles.sectionTitle}>Profile details</h3>
        </div>

        <form onSubmit={handleSave}>
          <div className={formStyles.grid}>
            <div className={formStyles.field}>
              <label htmlFor="b2b-name">
                <FiUser size={13} style={{ marginRight: 6 }} />
                Name
              </label>
              <input
                id="b2b-name"
                name="name"
                value={form.name || ""}
                onChange={handleChange}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="b2b-contactNo">
                <FiPhone size={13} style={{ marginRight: 6 }} />
                Contact No.
              </label>
              <input
                id="b2b-contactNo"
                className={formStyles.readOnly}
                value={form.contactNo || ""}
                disabled
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="b2b-email">
                <FiMail size={13} style={{ marginRight: 6 }} />
                Email
              </label>
              <input
                id="b2b-email"
                name="email"
                type="email"
                value={form.email || ""}
                onChange={handleChange}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="b2b-city">
                <FiMapPin size={13} style={{ marginRight: 6 }} />
                City
              </label>
              <input id="b2b-city" name="city" value={form.city || ""} onChange={handleChange} />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="b2b-state">
                <FiMapPin size={13} style={{ marginRight: 6 }} />
                State
              </label>
              <input
                id="b2b-state"
                name="state"
                value={form.state || ""}
                onChange={handleChange}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="b2b-pincode">
                <FiMapPin size={13} style={{ marginRight: 6 }} />
                Pincode
              </label>
              <input
                id="b2b-pincode"
                name="pincode"
                value={form.pincode || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={formStyles.field} style={{ marginTop: 12 }}>
            <label htmlFor="b2b-address">
              <FiMapPin size={13} style={{ marginRight: 6 }} />
              Address
            </label>
            <textarea
              id="b2b-address"
              name="address"
              value={form.address || ""}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className={formStyles.primaryBtn} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );

  const renderBecomeClinicModal = () => {
    if (!showClinicModal) return null;

    return (
      <div
        role="presentation"
        onClick={() => setShowClinicModal(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Become a Clinic"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 520,
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#fff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 30px 70px rgba(15, 23, 42, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <h3 className={formStyles.sectionTitle} style={{ margin: 0 }}>
              Become a Clinic
            </h3>
            <button
              type="button"
              onClick={() => setShowClinicModal(false)}
              aria-label="Close"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#64748b",
                fontSize: 18,
                lineHeight: 1,
                padding: 4,
              }}
            >
              <FiX />
            </button>
          </div>

          {user?.pendingClinicId ? (
            <p className={formStyles.message}>
              Your clinic application is already submitted and awaiting admin approval.
              You can keep using your B2B account as normal until it's reviewed.
            </p>
          ) : (
            <>
              <p style={{ color: "#556b84", marginBottom: 16, lineHeight: 1.6 }}>
                Fill in your business details below to apply. Your B2B account keeps
                working exactly as before while this is pending — it's only replaced
                once an admin approves the application.
              </p>
              <form onSubmit={handleBecomeClinicSubmit}>
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <label htmlFor="clinic-name">
                      <FiUser size={13} style={{ marginRight: 6 }} />
                      Business Name
                    </label>
                    <input
                      id="clinic-name"
                      name="name"
                      value={clinicForm.name}
                      onChange={handleClinicFormChange}
                    />
                  </div>
                  <div className={formStyles.field}>
                    <label htmlFor="clinic-email">
                      <FiMail size={13} style={{ marginRight: 6 }} />
                      Email
                    </label>
                    <input
                      id="clinic-email"
                      name="email"
                      type="email"
                      value={clinicForm.email}
                      onChange={handleClinicFormChange}
                    />
                  </div>
                  <div className={formStyles.field}>
                    <label htmlFor="clinic-gst">
                      <FiCreditCard size={13} style={{ marginRight: 6 }} />
                      GST Number
                    </label>
                    <input
                      id="clinic-gst"
                      name="gstNumber"
                      value={clinicForm.gstNumber}
                      onChange={handleClinicFormChange}
                    />
                  </div>
                </div>

                <div className={formStyles.field} style={{ marginTop: 12 }}>
                  <label htmlFor="clinic-address">
                    <FiMapPin size={13} style={{ marginRight: 6 }} />
                    Address
                  </label>
                  <textarea
                    id="clinic-address"
                    name="address"
                    value={clinicForm.address}
                    onChange={handleClinicFormChange}
                  />
                </div>

                <button type="submit" className={formStyles.primaryBtn} disabled={converting}>
                  {converting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeSection === "dashboard") return renderDashboardOverview();
    if (activeSection === "profile") return renderProfileForm();

    if (activeSection === "orders") {
      return (
        <div className={dashboardStyles.sectionShell}>
          <B2BOrderHistory b2bUserId={b2bUserId} />
        </div>
      );
    }

    return (
      <div className={dashboardStyles.sectionShell}>
        <div className={dashboardStyles.placeholderBox}>
          <h3>{activeTitle}</h3>
          <p>This section opens in a focused view so the Dashboard stays clean.</p>
        </div>
      </div>
    );
  };

  if (checkingAuth) return null;

  const sidebar = (
    <aside
      className={`${dashboardStyles.sidebar} ${
        isMobile && sidebarOpen ? dashboardStyles.sidebarOpen : ""
      }`}
    >
      <div className={dashboardStyles.sidebarInner}>
        <div className={dashboardStyles.profileCard}>
          <div className={dashboardStyles.avatarWrap}>
            <div className={dashboardStyles.avatarFallback}>
              {getInitials(user?.name || "Business")}
            </div>
          </div>

          <div className={dashboardStyles.profileMeta}>
            <h1 className={dashboardStyles.profileName}>
              {user?.name || "B2B Profile"}
            </h1>
            <p className={dashboardStyles.profilePhone}>
              {user?.contactNo || "No contact number yet"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={dashboardStyles.editProfileBtn}
          onClick={() => {
            setActiveSection("profile");
            setSidebarOpen(false);
          }}
        >
          <span className={dashboardStyles.inlineCenter}>
            <FiEdit3 />
            Edit Profile
          </span>
        </button>

        <button
          type="button"
          className={dashboardStyles.editProfileBtn}
          onClick={() => {
            setShowClinicModal(true);
            setSidebarOpen(false);
          }}
          disabled={Boolean(user?.pendingClinicId)}
          style={{ marginTop: 10 }}
        >
          <span className={dashboardStyles.inlineCenter}>
            <FiTrendingUp />
            {user?.pendingClinicId ? "Application Pending" : "Become a Clinic"}
          </span>
        </button>

        <div className={dashboardStyles.menu}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`${dashboardStyles.menuItem} ${
                  isActive ? dashboardStyles.menuItemActive : ""
                }`}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className={dashboardStyles.menuLabel}>
                  <Icon className={dashboardStyles.menuIcon} />
                  {item.label}
                </span>
                <FiChevronRight className={dashboardStyles.menuArrow} />
              </button>
            );
          })}
        </div>
      </div>

      <div className={dashboardStyles.sidebarFooter}>
        <button type="button" className={dashboardStyles.logoutBtn} onClick={handleLogout}>
          <span className={dashboardStyles.inlineCenter}>
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

      <div className={dashboardStyles.page}>
        {isMobile && sidebarOpen && (
          <div
            className={dashboardStyles.mobileSidebarBackdrop}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {isMobile && (
          <div className={dashboardStyles.mobileHeader}>
            <button
              type="button"
              className={dashboardStyles.menuToggle}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle B2B menu"
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        )}

        <div className={dashboardStyles.shell}>
          {sidebar}

          <main className={dashboardStyles.content}>
            {loadingUser ? (
              <div className={dashboardStyles.sectionShell}>
                <div className={dashboardStyles.placeholderBox}>
                  <h3>Loading profile</h3>
                  <p>Please wait while we fetch your B2B profile.</p>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>

      {renderBecomeClinicModal()}

      <Footer />
    </>
  );
}

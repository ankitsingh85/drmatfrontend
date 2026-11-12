"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiGrid,
  FiHeart,
  FiInbox,
  FiPackage,
  FiPercent,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUsers,
  FiVideo,
} from "react-icons/fi";
import styles from "@/styles/Dashboard/transactions.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { formatInvoiceDate, printInvoice } from "@/lib/invoiceTemplate";
import { resolveMediaUrl } from "@/lib/media";

type TransactionCategory =
  | "product"
  | "treatment"
  | "b2b"
  | "consultation"
  | "course"
  | "workshop"
  | "clinicSubscription";

type TabKey = TransactionCategory | "onlinetest" | "all";

interface OrderProductLine {
  id: string;
  name: string;
  quantity: number;
  price: number;
  itemType?: string;
}

interface PopulatedUser {
  _id: string;
  name?: string;
  email?: string;
}

interface PopulatedClinic {
  _id: string;
  clinicName?: string;
  email?: string;
  contactNumber?: string;
}

interface PopulatedB2BUser {
  _id: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  contactNo?: string;
}

interface TransactionOrder {
  _id: string;
  orderType?: string;
  ownerType?: "user" | "clinic" | "b2buser";
  products: OrderProductLine[];
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  paymentStatus?: string;
  status?: string;
  createdAt: string;
  category: TransactionCategory;
  userId?: PopulatedUser | null;
  clinicId?: PopulatedClinic | null;
  b2bUserId?: PopulatedB2BUser | null;
  address?: { type?: string; address?: string };
  subscriptionMeta?: { billingCycle?: string; startDate?: string; endDate?: string };
  treatmentStartedAt?: string;
  // Consultation-only — every doctor connection this patient has for the
  // ordered service (re-derived from the chat, since there's no direct
  // order→doctor link) — a patient can have more than one if they connected
  // with different doctors from the same service's pool on separate
  // occasions, so all of them are surfaced rather than picking just one.
  connections?: {
    doctorName: string | null;
    connectedAt: string | null;
    prescriptionUrl: string | null;
    prescriptionDate: string | null;
  }[];
  // First connection by time, kept for simple consumers.
  connectedDoctor?: string | null;
  connectedAt?: string | null;
  prescriptionUrl?: string | null;
  prescriptionDate?: string | null;
}

type CategoryMeta = {
  label: string;
  icon: React.ReactNode;
  color: string;
  colorDark: string;
  badgeBg: string;
  badgeColor: string;
};

const CATEGORY_META: Record<TabKey, CategoryMeta> = {
  all: {
    label: "All",
    icon: <FiGrid />,
    color: "#2981b7",
    colorDark: "#10678c",
    badgeBg: "#eef2ff",
    badgeColor: "#4338ca",
  },
  product: {
    label: "Product",
    icon: <FiPackage />,
    color: "#2563eb",
    colorDark: "#1d4ed8",
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
  },
  treatment: {
    label: "Treatment",
    icon: <FiHeart />,
    color: "#db2777",
    colorDark: "#be185d",
    badgeBg: "#fce7f3",
    badgeColor: "#be185d",
  },
  b2b: {
    label: "B2B Product",
    icon: <FiBriefcase />,
    color: "#7c3aed",
    colorDark: "#6d28d9",
    badgeBg: "#ede9fe",
    badgeColor: "#6d28d9",
  },
  course: {
    label: "Courses",
    icon: <FiBookOpen />,
    color: "#ea580c",
    colorDark: "#c2410c",
    badgeBg: "#ffedd5",
    badgeColor: "#c2410c",
  },
  workshop: {
    label: "Workshop",
    icon: <FiUsers />,
    color: "#0d9488",
    colorDark: "#0f766e",
    badgeBg: "#ccfbf1",
    badgeColor: "#0f766e",
  },
  consultation: {
    label: "Online Consultation",
    icon: <FiVideo />,
    color: "#4f46e5",
    colorDark: "#4338ca",
    badgeBg: "#e0e7ff",
    badgeColor: "#4338ca",
  },
  clinicSubscription: {
    label: "Clinic Subscription",
    icon: <FiCreditCard />,
    color: "#0891b2",
    colorDark: "#0e7490",
    badgeBg: "#cffafe",
    badgeColor: "#0e7490",
  },
  onlinetest: {
    label: "Online Test",
    icon: <FiClipboard />,
    color: "#64748b",
    colorDark: "#475569",
    badgeBg: "#e2e8f0",
    badgeColor: "#475569",
  },
};

const TAB_ORDER: TabKey[] = [
  "all",
  "product",
  "treatment",
  "b2b",
  "course",
  "workshop",
  "consultation",
  "clinicSubscription",
  "onlinetest",
];

const formatMoney = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getBuyerName = (order: TransactionOrder) => {
  if (order.ownerType === "b2buser") {
    return order.b2bUserId?.name || order.b2bUserId?.contactPerson || "B2B account";
  }
  if (order.ownerType === "clinic") {
    return order.clinicId?.clinicName || "Clinic";
  }
  return order.userId?.name || "Customer";
};

const getBuyerEmail = (order: TransactionOrder) => {
  if (order.ownerType === "b2buser") return order.b2bUserId?.email || "";
  if (order.ownerType === "clinic") return order.clinicId?.email || "";
  return order.userId?.email || "";
};

const getBuyerPhone = (order: TransactionOrder) => {
  if (order.ownerType === "b2buser") return order.b2bUserId?.contactNo || "";
  if (order.ownerType === "clinic") return order.clinicId?.contactNumber || "";
  return "";
};

const getItemsSummary = (order: TransactionOrder) =>
  (order.products || []).map((p) => `${p.name} x${p.quantity}`).join(", ");

const getSubtotal = (order: TransactionOrder) =>
  (order.products || []).reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0);

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildTransactionInvoice = (order: TransactionOrder) => {
  const meta = CATEGORY_META[order.category];
  const billTo = {
    name: getBuyerName(order),
    email: getBuyerEmail(order) || undefined,
    phone: getBuyerPhone(order) || undefined,
    address: order.address?.address,
  };

  return {
    invoiceNo: `INV-${order._id.slice(-8).toUpperCase()}`,
    orderNo: order._id.slice(-8).toUpperCase(),
    invoiceDate: formatInvoiceDate(new Date()),
    orderDate: formatInvoiceDate(order.createdAt),
    docSubtitle: `${meta.label} invoice`,
    orderTypeLabel: meta.label,
    paymentStatus: order.paymentStatus || "Pending",
    paymentMethod: "Online payment",
    logoUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/logo.jpeg`,
    billTo,
    shipTo:
      order.category === "clinicSubscription" || order.category === "consultation"
        ? { name: billTo.name, address: "Service — no delivery address required" }
        : billTo,
    items: (order.products || []).map((p) => ({
      name: p.name,
      unitPrice: p.price,
      quantity: p.quantity,
      amount: p.price * p.quantity,
    })),
    total: order.totalAmount,
    footerNote: "This invoice is generated for platform records. Please keep this copy for future reference.",
  };
};

const getPaymentStatusClass = (status?: string) => {
  const s = (status || "pending").toLowerCase();
  if (["success", "paid", "completed"].includes(s)) return styles.statusSuccess;
  if (["failed", "cancelled", "declined"].includes(s)) return styles.statusFailed;
  return styles.statusPending;
};

// A treatment booking's real-world progress is tracked via the clinic's
// OTP-verified "start treatment" flow (treatmentStartedAt), not the
// generic product-shipping status values — so once that's set, it takes
// over as the order status shown here, same as the clinic's own booking
// list and the Treatment Commission report.
const getDisplayOrderStatus = (order: TransactionOrder) => {
  if (order.status === "Cancelled") return "Cancelled";
  if (order.category === "treatment" && order.treatmentStartedAt) return "Treatment Started";
  return order.status || "Pending";
};

const getOrderStatusClass = (status?: string) => {
  const s = (status || "Pending").toLowerCase();
  if (["delivered", "completed", "active", "treatment started"].includes(s)) return styles.statusSuccess;
  if (["cancelled", "expired"].includes(s)) return styles.statusFailed;
  if (["shipped", "paused"].includes(s)) return styles.statusInfo;
  return styles.statusPending;
};

const ListOfTransactions: React.FC = () => {
  const toast = useToast();
  const [orders, setOrders] = useState<TransactionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await axios.get(`${API_URL}/orders/admin/transactions`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadInvoice = (order: TransactionOrder) => {
    const ok = printInvoice(buildTransactionInvoice(order));
    if (!ok) {
      toast.error("Unable to open print window. Please allow popups.");
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<TransactionCategory, number> = {
      product: 0,
      treatment: 0,
      b2b: 0,
      consultation: 0,
      course: 0,
      workshop: 0,
      clinicSubscription: 0,
    };
    orders.forEach((o) => {
      counts[o.category] = (counts[o.category] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const tabOrders = useMemo(() => {
    if (activeTab === "onlinetest") return [];
    if (activeTab === "all") return orders;
    return orders.filter((o) => o.category === activeTab);
  }, [orders, activeTab]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return tabOrders.filter((o) => {
      if (term) {
        const matchesSearch =
          o._id.toLowerCase().includes(term) ||
          getBuyerName(o).toLowerCase().includes(term) ||
          getBuyerEmail(o).toLowerCase().includes(term) ||
          getItemsSummary(o).toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      const createdAt = new Date(o.createdAt);
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;

      return true;
    });
  }, [tabOrders, search, fromDate, toDate]);

  const totalAmount = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
    [filteredOrders]
  );

  const successRate = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    const successCount = filteredOrders.filter((o) =>
      ["success", "paid", "completed"].includes((o.paymentStatus || "").toLowerCase())
    ).length;
    return Math.round((successCount / filteredOrders.length) * 100);
  }, [filteredOrders]);

  const avgValue = filteredOrders.length ? totalAmount / filteredOrders.length : 0;

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, fromDate, toDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const activeMeta = CATEGORY_META[activeTab];

  const handleDownloadCSV = () => {
    const showCategory = activeTab === "all";
    const isConsultation = activeTab === "consultation";
    const rows = [
      [
        "Order ID",
        ...(showCategory ? ["Category"] : []),
        "Buyer",
        "Email",
        "Items",
        "Subtotal",
        "Discount",
        "Amount",
        "Payment Status",
        ...(isConsultation ? ["Doctor Connected", "Connected On"] : ["Order Status"]),
        "Date",
        ...(isConsultation ? ["Prescription"] : []),
      ],
      ...filteredOrders.map((o) => [
        o._id,
        ...(showCategory ? [CATEGORY_META[o.category].label] : []),
        getBuyerName(o),
        getBuyerEmail(o),
        getItemsSummary(o),
        String(getSubtotal(o)),
        String(o.discountAmount || 0),
        String(o.totalAmount),
        o.paymentStatus || "pending",
        ...(isConsultation
          ? [
              (o.connections || []).map((c) => c.doctorName || "").join("; ") || "",
              (o.connections || [])
                .map((c) => (c.connectedAt ? new Date(c.connectedAt).toLocaleString() : ""))
                .join("; ") || "",
            ]
          : [getDisplayOrderStatus(o)]),
        new Date(o.createdAt).toLocaleString(),
        ...(isConsultation
          ? [
              (o.connections || [])
                .map((c) => (c.prescriptionUrl ? resolveMediaUrl(c.prescriptionUrl) || "" : ""))
                .filter(Boolean)
                .join("; ") || "",
            ]
          : []),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const showCategory = activeTab === "all";
    const isConsultation = activeTab === "consultation";
    const rowsHtml = filteredOrders
      .map(
        (o) => `<tr>
          <td>${escapeHtml(`#${o._id.slice(-8).toUpperCase()}`)}</td>
          ${showCategory ? `<td>${escapeHtml(CATEGORY_META[o.category].label)}</td>` : ""}
          <td>${escapeHtml(getBuyerName(o))}</td>
          <td>${escapeHtml(getBuyerEmail(o))}</td>
          <td>${escapeHtml(getItemsSummary(o))}</td>
          <td>${escapeHtml(formatMoney(getSubtotal(o)))}</td>
          <td>${escapeHtml(formatMoney(o.discountAmount || 0))}</td>
          <td>${escapeHtml(formatMoney(o.totalAmount))}</td>
          <td>${escapeHtml(o.paymentStatus || "pending")}</td>
          ${
            isConsultation
              ? `<td>${
                  (o.connections || []).map((c) => escapeHtml(c.doctorName || "—")).join("<br/>") ||
                  "—"
                }</td>
                 <td>${
                   (o.connections || [])
                     .map((c) => escapeHtml(c.connectedAt ? new Date(c.connectedAt).toLocaleString() : "—"))
                     .join("<br/>") || "—"
                 }</td>`
              : `<td>${escapeHtml(getDisplayOrderStatus(o))}</td>`
          }
          <td>${escapeHtml(new Date(o.createdAt).toLocaleString())}</td>
          ${
            isConsultation
              ? `<td>${
                  (o.connections || []).map((c) => (c.prescriptionUrl ? "Yes" : "—")).join("<br/>") ||
                  "—"
                }</td>`
              : ""
          }
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>${escapeHtml(activeMeta.label)} Transactions</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>${escapeHtml(activeMeta.label)} Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                ${showCategory ? "<th>Category</th>" : ""}
                <th>Buyer</th>
                <th>Email</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Amount</th>
                <th>Payment Status</th>
                ${isConsultation ? "<th>Doctor Connected</th><th>Connected On</th>" : "<th>Order Status</th>"}
                <th>Date</th>
                ${isConsultation ? "<th>Prescription</th>" : ""}
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.headerKicker}>Revenue Overview</p>
          <h2 className={styles.headerTitle}>Transactions</h2>
          <p className={styles.headerSubtitle}>
            Every order across the platform, split by category — search, filter by date, and
            export whatever you need.
          </p>
        </div>
        <button
          type="button"
          className={`${styles.refreshBtn} ${refreshing ? styles.refreshBtnSpinning : ""}`}
          onClick={() => fetchTransactions(true)}
          disabled={refreshing}
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard} style={{ ["--stat-color" as string]: "#2981b7" }}>
          <span className={styles.statIcon} style={{ ["--stat-color" as string]: "#2981b7" }}>
            <FiBarChart2 />
          </span>
          <p className={styles.statLabel}>{activeMeta.label} Transactions</p>
          <p className={styles.statValue}>{filteredOrders.length}</p>
        </div>
        <div className={styles.statCard} style={{ ["--stat-color" as string]: "#16a34a" }}>
          <span className={styles.statIcon} style={{ ["--stat-color" as string]: "#16a34a" }}>
            <FiTrendingUp />
          </span>
          <p className={styles.statLabel}>Total Revenue</p>
          <p className={styles.statValue}>{formatMoney(totalAmount)}</p>
        </div>
        <div className={styles.statCard} style={{ ["--stat-color" as string]: "#ea580c" }}>
          <span className={styles.statIcon} style={{ ["--stat-color" as string]: "#ea580c" }}>
            <FiCalendar />
          </span>
          <p className={styles.statLabel}>Avg. Order Value</p>
          <p className={styles.statValue}>{formatMoney(avgValue)}</p>
        </div>
        <div className={styles.statCard} style={{ ["--stat-color" as string]: "#4f46e5" }}>
          <span className={styles.statIcon} style={{ ["--stat-color" as string]: "#4f46e5" }}>
            <FiPercent />
          </span>
          <p className={styles.statLabel}>Payment Success Rate</p>
          <p className={styles.statValue}>{successRate}%</p>
        </div>
      </div>

      <div className={styles.tabsRow}>
        {TAB_ORDER.map((key) => {
          const meta = CATEGORY_META[key];
          const count =
            key === "onlinetest"
              ? 0
              : key === "all"
              ? orders.length
              : categoryCounts[key as TransactionCategory] || 0;

          return (
            <button
              key={key}
              type="button"
              className={`${styles.categoryTab} ${
                activeTab === key ? styles.categoryTabActive : ""
              }`}
              style={
                {
                  ["--tab-color" as string]: meta.color,
                  ["--tab-color-dark" as string]: meta.colorDark,
                } as React.CSSProperties
              }
              onClick={() => setActiveTab(key)}
            >
              <span className={styles.categoryTabIcon}>{meta.icon}</span>
              {meta.label}
              <span className={styles.categoryTabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "onlinetest" ? (
        <div className={styles.noData}>
          <FiClipboard />
          Online Test purchases aren&apos;t tracked yet — this platform doesn&apos;t have a
          purchasable online-test feature set up, so there is no transaction data to show here.
        </div>
      ) : (
        <>
          <div className={styles.toolbarCard}>
            <div className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <FiSearch className={styles.searchIcon} />
                <input
                  className={styles.search}
                  placeholder="Search by order ID, buyer name, email, or item"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <label className={styles.dateFilterLabel}>
                From
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>
              <label className={styles.dateFilterLabel}>
                To
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear Dates
                </button>
              )}
              <div className={styles.exportGroup}>
                <button
                  type="button"
                  className={`${styles.exportBtn} ${styles.csvBtn}`}
                  onClick={handleDownloadCSV}
                >
                  <FiDownload /> CSV
                </button>
                <button
                  type="button"
                  className={`${styles.exportBtn} ${styles.pdfBtn}`}
                  onClick={handleDownloadPDF}
                >
                  <FiFileText /> PDF
                </button>
              </div>
            </div>
          </div>

          <div className={styles.summaryRow}>
            <span>{filteredOrders.length} transaction(s)</span>
            <strong>Total: {formatMoney(totalAmount)}</strong>
          </div>

          <div className={styles.tableCard}>
            {filteredOrders.length === 0 ? (
              <p className={styles.noData}>
                <FiInbox />
                {activeTab === "all"
                  ? "No transactions found."
                  : `No ${activeMeta.label.toLowerCase()} transactions found.`}
              </p>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.frozenCell} style={{ left: 0, width: 110, minWidth: 110 }}>
                          Order ID
                        </th>
                        {activeTab === "all" && (
                          <th
                            className={styles.frozenCell}
                            style={{ left: 110, width: 130, minWidth: 130 }}
                          >
                            Category
                          </th>
                        )}
                        <th
                          className={styles.frozenCell}
                          style={{
                            left: activeTab === "all" ? 240 : 110,
                            width: 170,
                            minWidth: 170,
                          }}
                        >
                          Buyer
                        </th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        {activeTab === "consultation" && <th>Doctor</th>}
                        {activeTab === "consultation" && <th>Connected On</th>}
                        {activeTab !== "consultation" && <th>Status</th>}
                        <th>{activeTab === "consultation" ? "Date & Time" : "Date"}</th>
                        {activeTab === "consultation" && <th>Prescription</th>}
                        <th>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((o) => {
                        const meta = CATEGORY_META[o.category];
                        const subtotal = getSubtotal(o);
                        return (
                          <tr key={o._id}>
                            <td
                              className={`${styles.orderIdCell} ${styles.frozenCell}`}
                              style={{ left: 0, width: 110, minWidth: 110 }}
                            >
                              #{o._id.slice(-8).toUpperCase()}
                            </td>
                            {activeTab === "all" && (
                              <td
                                className={styles.frozenCell}
                                style={{ left: 110, width: 130, minWidth: 130 }}
                              >
                                <span
                                  className={styles.categoryBadge}
                                  style={
                                    {
                                      ["--badge-bg" as string]: meta.badgeBg,
                                      ["--badge-color" as string]: meta.badgeColor,
                                    } as React.CSSProperties
                                  }
                                >
                                  {meta.icon} {meta.label}
                                </span>
                              </td>
                            )}
                            <td
                              className={styles.frozenCell}
                              style={{
                                left: activeTab === "all" ? 240 : 110,
                                width: 170,
                                minWidth: 170,
                              }}
                            >
                              <div className={styles.buyerName}>{getBuyerName(o)}</div>
                              <div className={styles.buyerEmail}>{getBuyerEmail(o)}</div>
                            </td>
                            <td>{getItemsSummary(o)}</td>
                            <td className={styles.amountCell}>
                              {formatMoney(o.totalAmount)}
                              {activeTab === "consultation" && Number(o.discountAmount) > 0 && (
                                <div className={styles.buyerEmail}>
                                  {formatMoney(subtotal)} - {formatMoney(o.discountAmount || 0)}
                                  {o.couponCode ? ` (${o.couponCode})` : ""} off
                                </div>
                              )}
                            </td>
                            <td>
                              <span
                                className={`${styles.statusPill} ${getPaymentStatusClass(
                                  o.paymentStatus
                                )}`}
                              >
                                {o.paymentStatus || "pending"}
                              </span>
                            </td>
                            {activeTab === "consultation" && (
                              <td>
                                {o.connections && o.connections.length > 0 ? (
                                  o.connections.map((c, idx) => (
                                    <div key={idx}>{c.doctorName || "—"}</div>
                                  ))
                                ) : (
                                  "—"
                                )}
                              </td>
                            )}
                            {activeTab === "consultation" && (
                              <td>
                                {o.connections && o.connections.length > 0 ? (
                                  o.connections.map((c, idx) => (
                                    <div key={idx}>{formatDateTime(c.connectedAt)}</div>
                                  ))
                                ) : (
                                  "—"
                                )}
                              </td>
                            )}
                            {activeTab !== "consultation" && (
                              <td>
                                <span
                                  className={`${styles.statusPill} ${getOrderStatusClass(
                                    getDisplayOrderStatus(o)
                                  )}`}
                                >
                                  {getDisplayOrderStatus(o)}
                                </span>
                              </td>
                            )}
                            <td>
                              {activeTab === "consultation"
                                ? formatDateTime(o.createdAt)
                                : new Date(o.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            {activeTab === "consultation" && (
                              <td>
                                {o.connections && o.connections.some((c) => c.prescriptionUrl) ? (
                                  o.connections.map((c, idx) =>
                                    c.prescriptionUrl ? (
                                      <div key={idx}>
                                        <a
                                          href={resolveMediaUrl(c.prescriptionUrl) || "#"}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={styles.invoiceBtn}
                                        >
                                          <FiDownload /> Rx
                                        </a>
                                      </div>
                                    ) : (
                                      <div key={idx}>—</div>
                                    )
                                  )
                                ) : (
                                  "—"
                                )}
                              </td>
                            )}
                            <td>
                              <button
                                type="button"
                                className={styles.invoiceBtn}
                                onClick={() => handleDownloadInvoice(o)}
                              >
                                <FiDownload /> Invoice
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.paginationBar}>
                  <p className={styles.paginationInfo}>
                    Showing {paginatedOrders.length} of {filteredOrders.length}
                  </p>
                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>
                    <span className={styles.pageIndicator}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ListOfTransactions;

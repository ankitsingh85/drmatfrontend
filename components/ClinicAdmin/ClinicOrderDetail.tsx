"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { FaCheckCircle } from "react-icons/fa";
import { FiDownload, FiPackage } from "react-icons/fi";

import styles from "@/styles/userpanel/orderdetail.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { formatInvoiceDate, printInvoice } from "@/lib/invoiceTemplate";

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  itemType?: "product" | "treatment";
}

interface ClinicRef {
  clinicName?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
}

interface ClinicOrder {
  _id: string;
  clinicId?: ClinicRef | string;
  ownerType?: "user" | "clinic";
  orderType?: "product" | "treatment";
  products: OrderProduct[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt: string;
  paymentStatus?: string;
  status?: "Pending" | "Shipped" | "Delivered" | "Cancelled" | string;
  paymentMethod?: string;
}

interface ClinicOrderDetailProps {
  orderKey: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const formatMoney = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;

const formatDateTime = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getOrderCategories = (order: ClinicOrder | null) => {
  if (!order) return [];

  const categories = new Set<"product" | "course" | "workshop" | "treatment">();
  const orderType = String(order.orderType || "").toLowerCase();
  const products = Array.isArray(order.products) ? order.products : [];

  if (orderType === "treatment") {
    categories.add("treatment");
  }

  products.forEach((item) => {
    const itemType = String(item.itemType || "").toLowerCase();
    const itemId = String(item.id || "").toLowerCase();
    const itemName = String(item.name || "").toLowerCase();

    if (itemType === "treatment" || itemName.includes("treatment")) {
      categories.add("treatment");
      return;
    }

    if (itemId.startsWith("course:") || itemName.includes("course")) {
      categories.add("course");
      return;
    }

    if (itemId.startsWith("workshop:") || itemName.includes("workshop")) {
      categories.add("workshop");
      return;
    }

    categories.add("product");
  });

  return Array.from(categories);
};

const getOrderLabel = (order: ClinicOrder | null) => {
  const categories = getOrderCategories(order);
  if (categories.length > 1) return "Mixed";
  const category = categories[0] || "product";
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const looksLikeTreatmentOrder = (order: ClinicOrder | null) => {
  if (!order) return false;

  const orderType = String(order.orderType || "").toLowerCase();
  const products = Array.isArray(order.products) ? order.products : [];
  const hasTreatmentItem = products.some(
    (item) => String(item.itemType || "").toLowerCase() === "treatment"
  );
  const hasTreatmentName = products.some((item) =>
    String(item.name || "").toLowerCase().includes("treatment")
  );
  const addressType = String(order.address?.type || "").toLowerCase();
  const addressText = String(order.address?.address || "").toLowerCase().trim();

  return (
    orderType === "treatment" ||
    hasTreatmentItem ||
    hasTreatmentName ||
    addressType === "other" ||
    addressText.includes("treatment booking") ||
    addressText.includes("treatment")
  );
};

const findClinicOrder = (orders: ClinicOrder[], orderKey: string) => {
  const normalizedKey = slugify(String(orderKey));

  for (const item of orders) {
    const products = Array.isArray(item.products) ? item.products : [];
    const treatmentItem = products.find(
      (product) => String(product.itemType || "").toLowerCase() === "treatment"
    );
    const productItem = products.find(
      (product) => String(product.itemType || "").toLowerCase() !== "treatment"
    );

    const treatmentSlug = slugify(treatmentItem?.name || "treatment booking");
    const productSlug = slugify(productItem?.name || item.products?.[0]?.name || "order");

    if (String(item._id) === String(orderKey) || String(item._id) === normalizedKey) {
      return item;
    }

    if (treatmentItem && (treatmentSlug === normalizedKey || treatmentSlug === String(orderKey))) {
      return item;
    }

    if (productItem && (productSlug === normalizedKey || productSlug === String(orderKey))) {
      return item;
    }
  }

  return null;
};

const categoryChipStyle = (category: string): React.CSSProperties => {
  switch (category) {
    case "course":
      return {
        background: "rgba(13, 93, 143, 0.12)",
        color: "#0d5d8f",
      };
    case "workshop":
      return {
        background: "rgba(245, 158, 11, 0.12)",
        color: "#b45309",
      };
    case "treatment":
      return {
        background: "rgba(34, 197, 94, 0.12)",
        color: "#166534",
      };
    case "mixed":
      return {
        background: "rgba(100, 116, 139, 0.12)",
        color: "#334155",
      };
    default:
      return {
        background: "rgba(59, 130, 246, 0.12)",
        color: "#1d4ed8",
      };
  }
};

export default function ClinicOrderDetail({ orderKey }: ClinicOrderDetailProps) {
  const router = useRouter();
  const toast = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [clinicId, setClinicId] = useState("");
  const [clinicProfile, setClinicProfile] = useState<ClinicRef | null>(null);
  const [order, setOrder] = useState<ClinicOrder | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const token = Cookies.get("token");
    const role = Cookies.get("role")?.toLowerCase();

    if (!token || role !== "clinic") {
      setCheckingAuth(false);
      router.replace("/businesslogin");
      return;
    }

    const nextClinicId = Cookies.get("clinicId") || localStorage.getItem("clinicId") || "";
    setClinicId(nextClinicId);
    setClinicProfile({
      clinicName: Cookies.get("clinicName") || "Clinic",
      email: Cookies.get("email") || "",
      contactNumber: Cookies.get("contactNo") || "",
      address: "",
    });
    setCheckingAuth(false);
  }, [router, router.isReady]);

  useEffect(() => {
    if (checkingAuth || !router.isReady || !clinicId || !orderKey) return;

    let mounted = true;

    const fetchOrder = async () => {
      try {
        setFetching(true);
        setError("");

        const token = Cookies.get("token") || "";
        const res = await fetch(`${API_URL}/orders/my`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-clinic-id": clinicId,
            "x-owner-type": "clinic",
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load clinic order");
        }

        const list: ClinicOrder[] = Array.isArray(data) ? data : [];
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const found = findClinicOrder(sorted, orderKey);

        if (!mounted) return;

        setOrder(found || null);

        if (found && typeof found.clinicId === "object" && found.clinicId) {
          const clinicRef = found.clinicId;
          setClinicProfile((current) => ({
            clinicName: clinicRef.clinicName || current?.clinicName || "Clinic",
            email: clinicRef.email || current?.email || "",
            contactNumber: clinicRef.contactNumber || current?.contactNumber || "",
            address: clinicRef.address || current?.address || "",
          }));
        }
      } catch (err: any) {
        if (!mounted) return;
        setOrder(null);
        setError(err?.message || "Failed to load clinic order");
      } finally {
        if (mounted) setFetching(false);
      }
    };

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [checkingAuth, clinicId, orderKey, router.isReady]);

  const isTreatment = looksLikeTreatmentOrder(order);
  const orderCategories = useMemo(() => getOrderCategories(order), [order]);
  const orderLabel = useMemo(() => getOrderLabel(order), [order]);
  const invoiceRef = order ? `CL-${order._id.slice(-8).toUpperCase()}` : "";

  const handlePrintInvoice = () => {
    if (!order) return;

    const billingName = clinicProfile?.clinicName || "Clinic";
    const billingAddress =
      clinicProfile?.address || order.address?.address || "Clinic billing address";

    const ok = printInvoice({
      invoiceNo: invoiceRef,
      orderNo: order._id.slice(-8),
      invoiceDate: formatInvoiceDate(new Date()),
      orderDate: formatInvoiceDate(order.createdAt),
      docSubtitle: "Clinic order invoice",
      orderTypeLabel: isTreatment ? "Treatment booking" : `${orderLabel} clinic order`,
      paymentStatus: order.paymentStatus || "success",
      paymentMethod: order.paymentMethod || "Online payment",
      logoUrl: `${window.location.origin}/logo.jpeg`,
      billTo: {
        name: billingName,
        email: clinicProfile?.email,
        phone: clinicProfile?.contactNumber,
        address: billingAddress,
      },
      shipTo: { name: order.address?.type || "Clinic", address: order.address?.address || "-" },
      items: order.products.length
        ? order.products.map((item) => ({
            name: item.name,
            unitPrice: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
            amount: Number(item.price || 0) * Number(item.quantity || 0),
          }))
        : [{ name: "Clinic order", unitPrice: order.totalAmount, quantity: 1, amount: order.totalAmount }],
      total: order.totalAmount,
      footerNote:
        "This invoice is generated for your clinic records. Keep this copy for future reference and reconciliation.",
    });

    if (!ok) {
      toast.error("Unable to open print window. Please allow popups.");
    }
  };

  if (checkingAuth || fetching) {
    return <FullPageLoader />;
  }

  if (!orderKey) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div className={styles.stateWrap}>
        <p className={styles.error}>Error: {error}</p>
        <button className={styles.backBtn} onClick={() => router.push("/ClinicDashboard?section=orders")}>
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.stateWrap}>
        <h3>Order not found</h3>
        <p>We could not find this clinic order in your account.</p>
        <button className={styles.backBtn} onClick={() => router.push("/ClinicDashboard?section=orders")}>
          Go Back
        </button>
      </div>
    );
  }

  const displayClinicName = clinicProfile?.clinicName || "Clinic";
  const displayClinicEmail = clinicProfile?.email || "";
  const displayClinicContact = clinicProfile?.contactNumber || "";
  const displayClinicAddress = clinicProfile?.address || order.address?.address || "Clinic billing address";
  const statusLabel =
    String(order.status || "").trim() ||
    (String(order.paymentStatus || "").toLowerCase() === "success" ||
    String(order.paymentStatus || "").toLowerCase() === "paid"
      ? "Paid"
      : order.paymentStatus || "Pending");

  const summaryChips = [
    {
      label: "Clinic",
      value: displayClinicName,
      style: {
        background: "rgba(13, 93, 143, 0.12)",
        color: "#0d5d8f",
      },
    },
    ...orderCategories.map((category) => ({
      label: category,
      value: category.charAt(0).toUpperCase() + category.slice(1),
      style: categoryChipStyle(category),
    })),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.push("/ClinicDashboard?section=orders")}>
            Back to Orders
          </button>
          <button className={styles.printBtn} onClick={handlePrintInvoice}>
            <FiDownload />
            Download Invoice
          </button>
        </div>

        <div className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Clinic Order Details</p>
            <h1>{isTreatment ? "Treatment booking" : "Clinic purchase"}</h1>
            <p className={styles.subtle}>
              Order #{order._id.slice(-8)} {" "}
              <span style={{ opacity: 0.65 }}>
                {`• ${slugify(order.products?.[0]?.name || orderLabel || "clinic-order")}`}
              </span>
              <br />
              Placed on {formatDateTime(order.createdAt)}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16,
              }}
            >
              {summaryChips.map((chip) => (
                <span
                  key={`${chip.label}-${chip.value}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 11px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    ...chip.style,
                  }}
                >
                  {chip.value}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.statusCard}>
            <span>Payment Status</span>
            <strong>{statusLabel}</strong>
            <p>{isTreatment ? "Treatment booking invoice" : "Clinic purchase invoice"}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Items</h2>
              <span>{order.products.length} item(s)</span>
            </div>
            <div className={styles.items}>
              {order.products.map((item) => (
                <div key={`${order._id}-${item.id}`} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <img
                      src={resolveMediaUrl(item.image) || "/skin_hair.jpg"}
                      alt={item.name}
                      className={styles.itemImage}
                    />
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      <span className={styles.itemMeta}>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    <span>{formatMoney(Number(item.price || 0))}</span>
                    <strong>{formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Clinic & Summary</h2>
              <span>Order details</span>
            </div>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span>Clinic</span>
                <strong>{displayClinicName}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Email</span>
                <strong>{displayClinicEmail || "-"}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Contact</span>
                <strong>{displayClinicContact || "-"}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Billing Address</span>
                <strong>{displayClinicAddress}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Order Status</span>
                <strong>{order.status || "Pending"}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Payment Status</span>
                <strong>{statusLabel}</strong>
              </div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Amount</span>
                <strong>{formatMoney(Number(order.totalAmount || 0))}</strong>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 20,
                background: "linear-gradient(135deg, rgba(13,93,143,0.08), rgba(23,121,205,0.1))",
                color: "#0f172a",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: "rgba(13,93,143,0.12)",
                    display: "grid",
                    placeItems: "center",
                    color: "#0d5d8f",
                    flexShrink: 0,
                  }}
                >
                  <FiPackage />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Invoice reference
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{invoiceRef}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0d5d8f", fontWeight: 800 }}>
                <FaCheckCircle />
                <span>Payment captured successfully</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

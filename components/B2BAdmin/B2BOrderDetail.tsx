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

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  itemType?: "product" | "treatment";
}

interface B2BUserRef {
  name?: string;
  email?: string;
  contactNo?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface B2BOrder {
  _id: string;
  b2bUserId?: B2BUserRef | string;
  ownerType?: "user" | "clinic" | "b2buser";
  orderType?: "product" | "treatment";
  products: OrderProduct[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt: string;
  paymentStatus?: string;
  status?: "Pending" | "Shipped" | "Delivered" | "Cancelled" | string;
  paymentMethod?: string;
}

interface B2BOrderDetailProps {
  orderKey: string;
}

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

const formatInvoiceDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

type OrderCategory = "product" | "course" | "workshop" | "treatment";

const getOrderCategories = (order: B2BOrder | null): OrderCategory[] => {
  if (!order) return [];

  const categories = new Set<OrderCategory>();
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

const getOrderLabel = (order: B2BOrder | null) => {
  const categories = getOrderCategories(order);
  if (categories.length > 1) return "Mixed";
  const category = categories[0] || "product";
  return category.charAt(0).toUpperCase() + category.slice(1);
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

export default function B2BOrderDetail({ orderKey }: B2BOrderDetailProps) {
  const router = useRouter();
  const toast = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [b2bUserId, setB2bUserId] = useState("");
  const [b2bProfile, setB2bProfile] = useState<B2BUserRef | null>(null);
  const [order, setOrder] = useState<B2BOrder | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const token = Cookies.get("token");
    const role = Cookies.get("role")?.toLowerCase();

    if (!token || role !== "b2buser") {
      setCheckingAuth(false);
      router.replace("/businesslogin");
      return;
    }

    const nextB2bUserId = Cookies.get("b2bUserId") || localStorage.getItem("b2bUserId") || "";
    setB2bUserId(nextB2bUserId);
    setB2bProfile({
      name: Cookies.get("username") || "Business User",
      email: Cookies.get("email") || "",
      contactNo: Cookies.get("contactNo") || "",
      address: "",
    });
    setCheckingAuth(false);
  }, [router, router.isReady]);

  useEffect(() => {
    if (checkingAuth || !router.isReady || !b2bUserId) return;

    let mounted = true;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/b2b-users/${b2bUserId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted || !data) return;
        setB2bProfile((current) => ({
          name: data.name || current?.name || "Business User",
          email: data.email || current?.email || "",
          contactNo: data.contactNo || current?.contactNo || "",
          address: data.address || current?.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
        }));
      } catch {
        // Keep the cookie-derived fallback profile on failure.
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [b2bUserId, checkingAuth, router.isReady]);

  useEffect(() => {
    if (checkingAuth || !router.isReady || !b2bUserId || !orderKey) return;

    let mounted = true;

    const fetchOrder = async () => {
      try {
        setFetching(true);
        setError("");

        const token = Cookies.get("token") || "";
        const res = await fetch(`${API_URL}/orders/my`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-b2buser-id": b2bUserId,
            "x-owner-type": "b2buser",
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load order");
        }

        const list: B2BOrder[] = Array.isArray(data) ? data : [];
        const found = list.find((item) => String(item._id) === String(orderKey)) || null;

        if (!mounted) return;
        setOrder(found);
      } catch (err: any) {
        if (!mounted) return;
        setOrder(null);
        setError(err?.message || "Failed to load order");
      } finally {
        if (mounted) setFetching(false);
      }
    };

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [b2bUserId, checkingAuth, orderKey, router.isReady]);

  const orderCategories = useMemo(() => getOrderCategories(order), [order]);
  const orderLabel = useMemo(() => getOrderLabel(order), [order]);
  const invoiceRef = order ? `B2B-${order._id.slice(-8).toUpperCase()}` : "";
  const totalItems = order
    ? order.products.reduce((acc, item) => acc + Number(item.quantity || 0), 0)
    : 0;
  const subtotal = order
    ? order.products.reduce(
        (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
        0
      )
    : 0;

  const handlePrintInvoice = () => {
    if (!order) return;

    const printable = window.open("", "_blank", "width=900,height=700");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const billingName = b2bProfile?.name || "Business User";
    const billingEmail = b2bProfile?.email || "";
    const billingContact = b2bProfile?.contactNo || "";
    const billingAddress =
      b2bProfile?.address || order.address?.address || "B2B billing address";
    const invoiceDate = formatInvoiceDate(new Date().toISOString());
    const orderDate = formatInvoiceDate(order.createdAt);
    const logoUrl = `${window.location.origin}/logo.jpeg`;

    const itemsRows = order.products.length
      ? order.products
          .map(
            (item, index) => `
              <tr>
                <td class="sl">${index + 1}</td>
                <td class="desc">
                  <div class="itemName">${item.name}</div>
                  <div class="itemMeta">Qty: ${item.quantity}</div>
                </td>
                <td class="num">${formatMoney(Number(item.price || 0))}</td>
                <td class="num">${item.quantity}</td>
                <td class="num">${formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</td>
              </tr>
            `
          )
          .join("")
      : `
        <tr>
          <td class="sl">1</td>
          <td class="desc">
            <div class="itemName">B2B order</div>
            <div class="itemMeta">No item details available</div>
          </td>
          <td class="num">${formatMoney(order.totalAmount)}</td>
          <td class="num">1</td>
          <td class="num">${formatMoney(order.totalAmount)}</td>
        </tr>
      `;

    printable.document.write(`
      <html>
        <head>
          <title>Invoice ${invoiceRef}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 22px;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
              background: #fff;
            }
            .invoice {
              max-width: 980px;
              margin: 0 auto;
              border: 1px solid #cfd7e3;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              align-items: flex-start;
              padding: 18px 20px 12px;
              border-bottom: 2px solid #111827;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .brand img {
              width: 88px;
              height: 88px;
              object-fit: contain;
            }
            .brandName {
              font-size: 34px;
              font-weight: 800;
              line-height: 1;
              letter-spacing: -0.04em;
            }
            .brandSub {
              margin-top: 4px;
              font-size: 12px;
              color: #52606d;
            }
            .docTitle {
              text-align: right;
            }
            .docTitle h1 {
              margin: 0;
              font-size: 22px;
              line-height: 1.15;
            }
            .docTitle p {
              margin: 2px 0 0;
              font-size: 12px;
              color: #52606d;
            }
            .meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              padding: 16px 20px;
              border-bottom: 1px solid #cfd7e3;
            }
            .block {
              font-size: 12px;
              line-height: 1.5;
            }
            .block h3 {
              margin: 0 0 8px;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .muted {
              color: #52606d;
            }
            .orderMeta {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 10px;
              padding: 14px 20px;
              border-bottom: 1px solid #cfd7e3;
              font-size: 12px;
            }
            .orderMeta div {
              min-width: 0;
            }
            .orderMeta span {
              display: block;
              color: #52606d;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              font-size: 10px;
              margin-bottom: 4px;
            }
            .orderMeta strong {
              display: block;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            thead th {
              background: #f3f4f6;
              padding: 10px 8px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              border-bottom: 1px solid #cfd7e3;
              text-align: left;
            }
            tbody td {
              border-bottom: 1px solid #e5e7eb;
              padding: 12px 8px;
              font-size: 12px;
              vertical-align: top;
            }
            .sl {
              width: 42px;
              text-align: center;
            }
            .desc {
              width: 50%;
            }
            .num {
              text-align: right;
              white-space: nowrap;
            }
            .itemName {
              font-weight: 700;
              color: #111827;
            }
            .itemMeta {
              margin-top: 4px;
              color: #52606d;
              font-size: 11px;
            }
            .summaryWrap {
              display: flex;
              justify-content: flex-end;
              padding: 16px 20px 20px;
            }
            .summary {
              width: 320px;
              border: 1px solid #cfd7e3;
              background: #fafafa;
            }
            .summaryRow {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .summaryRow:last-child {
              border-bottom: 0;
            }
            .summaryRow.total {
              font-size: 14px;
              font-weight: 800;
              background: #fff;
            }
            .footer {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 16px;
              align-items: end;
              padding: 0 20px 18px;
            }
            .note {
              font-size: 11px;
              color: #52606d;
              line-height: 1.55;
            }
            .sign {
              width: 210px;
              text-align: center;
              font-size: 12px;
            }
            .signBox {
              height: 48px;
              border: 1px solid #9ca3af;
              margin-bottom: 6px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="brand">
                <img src="${logoUrl}" alt="Dr. Dermat" />
                <div>
                  <div class="brandName">Dr. Dermat</div>
                  <div class="brandSub">B2B order invoice</div>
                </div>
              </div>
              <div class="docTitle">
                <h1>Tax Invoice / Bill of Supply / Cash Memo</h1>
                <p>(Original for Recipient)</p>
              </div>
            </div>

            <div class="meta">
              <div class="block">
                <h3>Sold By</h3>
                <div>Dr. Dermat Healthcare Marketplace</div>
                <div class="muted">India</div>
                <div class="muted">Order support and fulfillment</div>
              </div>
              <div class="block" style="text-align:right;">
                <h3>B2B Billing</h3>
                <div>${billingName}</div>
                <div class="muted">${billingEmail}</div>
                <div class="muted">${billingContact}</div>
                <div class="muted">${billingAddress}</div>
              </div>
              <div class="block">
                <h3>Order Address</h3>
                <div>${order.address?.type || "Business"}</div>
                <div class="muted">${order.address?.address || "-"}</div>
              </div>
              <div class="block" style="text-align:right;">
                <h3>Invoice Details</h3>
                <div><strong>Invoice No:</strong> ${invoiceRef}</div>
                <div><strong>Order No:</strong> ${order._id.slice(-8)}</div>
                <div><strong>Invoice Date:</strong> ${invoiceDate}</div>
                <div><strong>Order Date:</strong> ${orderDate}</div>
              </div>
            </div>

            <div class="orderMeta">
              <div>
                <span>Payment Status</span>
                <strong>${order.paymentStatus || "success"}</strong>
              </div>
              <div>
                <span>Order Type</span>
                <strong>${orderLabel} order</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>${totalItems}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>${order.paymentMethod || "Online payment"}</strong>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="sl">#</th>
                  <th>Description</th>
                  <th class="num">Unit Price</th>
                  <th class="num">Qty</th>
                  <th class="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="summaryWrap">
              <div class="summary">
                <div class="summaryRow">
                  <span>Subtotal</span>
                  <strong>${formatMoney(subtotal)}</strong>
                </div>
                <div class="summaryRow">
                  <span>Shipping</span>
                  <strong>FREE</strong>
                </div>
                <div class="summaryRow total">
                  <span>Total</span>
                  <strong>${formatMoney(order.totalAmount)}</strong>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="note">
                This invoice is generated for your B2B account records. Keep this copy for
                future reference and reconciliation.
              </div>
              <div class="sign">
                <div class="signBox"></div>
                <div>Authorized Signatory</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printable.document.close();
    printable.focus();
    printable.print();
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
        <button className={styles.backBtn} onClick={() => router.push("/B2BUserDashboard?section=orders")}>
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.stateWrap}>
        <h3>Order not found</h3>
        <p>We could not find this order in your B2B account.</p>
        <button className={styles.backBtn} onClick={() => router.push("/B2BUserDashboard?section=orders")}>
          Go Back
        </button>
      </div>
    );
  }

  const displayName = b2bProfile?.name || "Business User";
  const displayEmail = b2bProfile?.email || "";
  const displayContact = b2bProfile?.contactNo || "";
  const displayAddress = b2bProfile?.address || order.address?.address || "B2B billing address";
  const statusLabel =
    String(order.status || "").trim() ||
    (String(order.paymentStatus || "").toLowerCase() === "success" ||
    String(order.paymentStatus || "").toLowerCase() === "paid"
      ? "Paid"
      : order.paymentStatus || "Pending");

  const summaryChips = [
    {
      label: "B2B",
      value: displayName,
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
          <button className={styles.backBtn} onClick={() => router.push("/B2BUserDashboard?section=orders")}>
            Back to Orders
          </button>
          <button className={styles.printBtn} onClick={handlePrintInvoice}>
            <FiDownload />
            Download Invoice
          </button>
        </div>

        <div className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>B2B Order Details</p>
            <h1>B2B purchase</h1>
            <p className={styles.subtle}>
              Order #{order._id.slice(-8)}
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
            <p>B2B purchase invoice</p>
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
              <h2>Billing & Summary</h2>
              <span>Order details</span>
            </div>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span>Business</span>
                <strong>{displayName}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Email</span>
                <strong>{displayEmail || "-"}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Contact</span>
                <strong>{displayContact || "-"}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Billing Address</span>
                <strong>{displayAddress}</strong>
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

"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/userpanel/orderdetail.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  itemType?: "product" | "treatment";
}

interface Order {
  _id: string;
  orderType?: "product" | "treatment";
  products: OrderProduct[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt: string;
  paymentStatus?: string;
  status?: "Pending" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod?: string;
}

interface ResolvedUser {
  id: string;
  name?: string;
  email?: string;
}

interface OrderDetailProps {
  orderKey: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const UserOrderDetail: React.FC<OrderDetailProps> = ({ orderKey }) => {
  const router = useRouter();
  const { user, loading } = useUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const [matchedKind, setMatchedKind] = useState<"product" | "treatment" | "unknown">(
    "unknown"
  );

  const token = Cookies.get("token") || "";
  const storedUserId =
    typeof window !== "undefined"
      ? Cookies.get("userId") || localStorage.getItem("userId")
      : null;

  useEffect(() => {
    if (loading) return;

    if (user?._id) {
      setResolvedUser({
        id: user._id,
        name: user.name,
        email: user.email,
      });
      return;
    }

    if (storedUserId) {
      setResolvedUser({
        id: storedUserId,
        name: Cookies.get("username") || undefined,
        email: Cookies.get("email") || undefined,
      });
      return;
    }

    if (!token) {
      setResolvedUser(null);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setResolvedUser(null);
          return;
        }
        const data = await res.json();
        const id = data._id || data.id;
        if (!id) {
          setResolvedUser(null);
          return;
        }
        Cookies.set("userId", id);
        localStorage.setItem("userId", id);
        setResolvedUser({
          id,
          name: data.name,
          email: data.email,
        });
      } catch {
        setResolvedUser(null);
      }
    };

    fetchMe();
  }, [loading, user?._id, user?.name, user?.email, token, storedUserId]);

  useEffect(() => {
    if (!resolvedUser?.id || !orderKey) {
      return;
    }

    const fetchOrder = async () => {
      try {
        setFetching(true);
        setError("");

        const res = await axios.get(`${API_URL}/orders/my`, {
          headers: {
            "x-user-id": resolvedUser.id,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!Array.isArray(res.data)) {
          setOrder(null);
          setMatchedKind("unknown");
          return;
        }

        const normalizedKey = slugify(String(orderKey));
        let found: Order | null = null;
        let nextMatchedKind: "product" | "treatment" | "unknown" = "unknown";

        for (const item of [...res.data].sort((a: Order, b: Order) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })) {
          const products = Array.isArray(item.products) ? item.products : [];
          const treatmentItem = products.find(
            (product: OrderProduct) => product.itemType === "treatment"
          );
          const productItem = products.find(
            (product: OrderProduct) => product.itemType !== "treatment"
          );
          const itemType = String(item.orderType || "").toLowerCase();
          const treatmentSlug = slugify(treatmentItem?.name || "treatment booking");
          const productSlug = slugify(productItem?.name || item.products?.[0]?.name || "order");

          if (String(item._id) === String(orderKey) || String(item._id) === normalizedKey) {
            found = item;
            nextMatchedKind =
              itemType === "treatment" || treatmentItem ? "treatment" : productItem ? "product" : "unknown";
            break;
          }

          if (treatmentItem && (treatmentSlug === normalizedKey || treatmentSlug === String(orderKey))) {
            found = item;
            nextMatchedKind = "treatment";
            break;
          }

          if (productItem && (productSlug === normalizedKey || productSlug === String(orderKey))) {
            found = item;
            nextMatchedKind = "product";
            break;
          }
        }
        setMatchedKind(nextMatchedKind);
        setOrder(found || null);
      } catch (err: any) {
        console.error("Failed to fetch order details:", err);
        setError(err.response?.data?.message || "Failed to fetch order details");
      } finally {
        setFetching(false);
      }
    };

    fetchOrder();
  }, [orderKey, resolvedUser?.id, token]);

  const orderType = String(order?.orderType || "").toLowerCase();
  const hasTreatmentItems = !!order?.products?.some(
    (item: OrderProduct) => item.itemType === "treatment"
  );
  const isTreatment =
    matchedKind === "treatment" ||
    (matchedKind === "unknown" && (orderType === "treatment" || hasTreatmentItems));
  const headerTitle = isTreatment ? "Treatment Order Details" : "Order Details";
  const orderTitle = order
    ? isTreatment
      ? order.products.find((item) => item.itemType === "treatment")?.name ||
        order.products[0]?.name ||
        "treatment booking"
      : order.products.find((item) => item.itemType !== "treatment")?.name ||
        order.products[0]?.name ||
        "order"
    : "";
  const invoiceRef = order ? `INV-${order._id.slice(-8).toUpperCase()}` : "";

  const progressStage = useMemo(() => {
    if (!order) return 0;

    const status = String(order.status || "").toLowerCase();
    const paymentStatus = String(order.paymentStatus || "").toLowerCase();

    if (status === "cancelled") return -1;
    if (status === "delivered") return 3;
    if (status === "shipped") return 2;
    if (paymentStatus === "paid") return 1;
    return 0;
  }, [order]);

  const steps = isTreatment
    ? ["Booking Placed", "Confirmed", "In Progress", "Completed"]
    : ["Order Placed", "Confirmed", "Shipped", "Delivered"];

  const formatMoney = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;
  const formatInvoiceDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handlePrintInvoice = () => {
    if (!order) return;

    const printable = window.open("", "_blank", "width=900,height=700");
    if (!printable) {
      alert("Unable to open print window. Please allow popups.");
      return;
    }

    const invoiceDate = formatInvoiceDate(new Date().toISOString());
    const orderDate = formatInvoiceDate(order.createdAt);
    const logoUrl = `${window.location.origin}/logo.jpeg`;
    const shippingAddress = order.address?.address || "-";
    const billingAddress = shippingAddress;
    const subtotal = order.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItems = order.products.reduce((acc, item) => acc + item.quantity, 0);
    const itemsRows = order.products
      .map(
        (item, index) => `
          <tr>
            <td class="sl">${index + 1}</td>
            <td class="desc">
              <div class="itemName">${item.name}</div>
              <div class="itemMeta">Qty: ${item.quantity}</div>
            </td>
            <td class="num">${formatMoney(item.price)}</td>
            <td class="num">${item.quantity}</td>
            <td class="num">${formatMoney(item.price * item.quantity)}</td>
          </tr>
        `
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Invoice ${order._id.slice(-8)}</title>
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
                  <div class="brandSub">Customer order invoice</div>
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
                <h3>Billing Address</h3>
                <div>${resolvedUser?.name || "Customer"}</div>
                <div class="muted">${resolvedUser?.email || ""}</div>
                <div class="muted">${billingAddress}</div>
              </div>
              <div class="block">
                <h3>Shipping Address</h3>
                <div>${resolvedUser?.name || "Customer"}</div>
                <div class="muted">${shippingAddress}</div>
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
                <strong>${order.paymentStatus || "Pending"}</strong>
              </div>
              <div>
                <span>Order Type</span>
                <strong>${isTreatment ? "Treatment booking" : "Product order"}</strong>
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
                This invoice is generated for your order records. Shipping and billing details are
                shown above for convenience. Please keep this copy for future reference.
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

  if (loading) {
    return <FullPageLoader />;
  }

  if (!resolvedUser?.id) {
    return (
      <div className={styles.stateWrap}>
        <h3>Login required</h3>
        <p>Please log in to view order details.</p>
      </div>
    );
  }

  if (fetching) {
    return <FullPageLoader />;
  }

  if (!orderKey) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div className={styles.stateWrap}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.stateWrap}>
        <h3>Order not found</h3>
        <p>We could not find this order in your account.</p>
        <button className={styles.backBtn} onClick={() => router.back()}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            Back to Orders
          </button>
          <button className={styles.printBtn} onClick={handlePrintInvoice}>
            Print Invoice
          </button>
        </div>

        <div className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>{headerTitle}</p>
            <h1>{orderTitle}</h1>
            <p className={styles.subtle}>
              Order #{order._id.slice(-8)}{" "}
              <span style={{ opacity: 0.65 }}>
                {`• ${slugify(orderTitle)}`}
              </span>
              <br />
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")} at{" "}
              {new Date(order.createdAt).toLocaleTimeString("en-IN")}
            </p>
          </div>
          <div className={styles.statusCard}>
            <span>Payment Status</span>
            <strong>{order.paymentStatus || "Pending"}</strong>
            <p>{isTreatment ? "Treatment booking invoice" : "Product order invoice"}</p>
          </div>
        </div>

        <div className={styles.timelineCard}>
          <div className={styles.timelineHeader}>
            <h2>Order Progress</h2>
            <span className={styles.orderTypeTag}>
              {isTreatment ? "Treatment Order" : "Product Order"}
            </span>
          </div>
          {progressStage === -1 ? (
            <div className={styles.cancelledBox}>This order has been cancelled.</div>
          ) : (
            <div className={styles.timeline}>
              {steps.map((step, index) => {
                const active = index <= progressStage;
                return (
                  <div key={step} className={styles.timelineStep}>
                    <div className={`${styles.timelineDot} ${active ? styles.timelineDotActive : ""}`}>
                      {index + 1}
                    </div>
                    <div className={styles.timelineLabel}>
                      <strong>{step}</strong>
                      <span>{active ? "Completed or in progress" : "Waiting"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                      src={item.image || "/skin_hair.jpg"}
                      alt={item.name}
                      className={styles.itemImage}
                    />
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      <span className={styles.itemMeta}>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    <span>{formatMoney(item.price)}</span>
                    <strong>{formatMoney(item.price * item.quantity)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Delivery & Summary</h2>
              <span>Order details</span>
            </div>
            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span>Deliver To</span>
                <strong>{order.address.type}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Address</span>
                <strong>{order.address.address}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Order Status</span>
                <strong>{order.status || "Pending"}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Payment Status</span>
                <strong>{order.paymentStatus || "Pending"}</strong>
              </div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Amount</span>
                <strong>{formatMoney(order.totalAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetail;

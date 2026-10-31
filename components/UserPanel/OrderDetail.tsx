"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiArrowUpRight, FiMapPin } from "react-icons/fi";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/userpanel/orderdetail.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useToast } from "@/context/ToastContext";
import { formatInvoiceDate, printInvoice } from "@/lib/invoiceTemplate";

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  itemType?: "product" | "treatment" | "consultation";
  clinicId?: string;
  clinicName?: string;
  clinicAddress?: string;
}

interface Order {
  _id: string;
  orderType?: "product" | "treatment" | "consultation";
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

// Checked before looksLikeTreatmentOrder — online consultation checkout
// also stamps address.type "Other" (no delivery address needed for a video
// call), which would otherwise get swallowed into the treatment heuristic
// below. orderType/itemType "consultation" is an explicit, non-heuristic
// signal, so it takes priority — same rule the backend's categorizeOrder
// uses for the admin Transactions report.
const looksLikeConsultationOrder = (order: Order | null) => {
  if (!order) return false;
  const orderType = String(order.orderType || "").toLowerCase();
  const products = Array.isArray(order.products) ? order.products : [];
  const hasConsultationItem = products.some(
    (item) => String(item.itemType || "").toLowerCase() === "consultation"
  );
  return orderType === "consultation" || hasConsultationItem;
};

const looksLikeTreatmentOrder = (order: Order | null) => {
  if (!order || looksLikeConsultationOrder(order)) return false;
  const orderType = String(order.orderType || "").toLowerCase();
  const products = Array.isArray(order.products) ? order.products : [];
  const hasTreatmentItem = products.some(
    (item) => String(item.itemType || "").toLowerCase() === "treatment"
  );
  const hasTreatmentName = products.some((item) =>
    String(item.name || "").toLowerCase().includes("treatment")
  );
  const addressType = String(order.address?.type || "").toLowerCase();
  const addressText = String(order.address?.address || "").toLowerCase();

  return (
    orderType === "treatment" ||
    hasTreatmentItem ||
    hasTreatmentName ||
    addressType === "other" ||
    addressText.includes("treatment booking") ||
    addressText.includes("treatment")
  );
};

const UserOrderDetail: React.FC<OrderDetailProps> = ({ orderKey }) => {
  const router = useRouter();
  const toast = useToast();
  const { user, loading } = useUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const [matchedKind, setMatchedKind] = useState<
    "product" | "treatment" | "consultation" | "unknown"
  >("unknown");

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
        let nextMatchedKind: "product" | "treatment" | "consultation" | "unknown" = "unknown";

        for (const item of [...res.data].sort((a: Order, b: Order) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })) {
          const products = Array.isArray(item.products) ? item.products : [];
          const consultationItem = products.find(
            (product: OrderProduct) => product.itemType === "consultation"
          );
          const treatmentItem = products.find(
            (product: OrderProduct) => product.itemType === "treatment"
          );
          const productItem = products.find(
            (product: OrderProduct) =>
              product.itemType !== "treatment" && product.itemType !== "consultation"
          );
          const itemType = String(item.orderType || "").toLowerCase();
          const consultationSlug = slugify(consultationItem?.name || "online consultation");
          const treatmentSlug = slugify(treatmentItem?.name || "treatment booking");
          const productSlug = slugify(productItem?.name || item.products?.[0]?.name || "order");

          if (String(item._id) === String(orderKey) || String(item._id) === normalizedKey) {
            found = item;
            nextMatchedKind =
              itemType === "consultation" || consultationItem
                ? "consultation"
                : itemType === "treatment" || treatmentItem
                ? "treatment"
                : productItem
                ? "product"
                : "unknown";
            break;
          }

          if (
            consultationItem &&
            (consultationSlug === normalizedKey || consultationSlug === String(orderKey))
          ) {
            found = item;
            nextMatchedKind = "consultation";
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

  const isConsultation = matchedKind === "consultation" || looksLikeConsultationOrder(order);
  const isTreatment = !isConsultation && (matchedKind === "treatment" || looksLikeTreatmentOrder(order));
  const treatmentClinicItem = isTreatment
    ? order?.products.find((item) => item.itemType === "treatment" && item.clinicName)
    : undefined;
  // Clinic details are only ever linked for treatment orders — product
  // orders have no associated clinic to visit.
  const clinicHref = (clinicId?: string) =>
    isTreatment && clinicId ? `/clinics/${clinicId}?tab=Services` : undefined;
  // Lets a shopper jump from an order line item to that product's or
  // treatment's own page, then use the browser back button to return here.
  const itemDetailHref = (item: OrderProduct) => {
    if (!item.name) return undefined;
    if (item.itemType === "treatment") return `/treatment-plans/${slugify(item.name)}`;
    if (item.itemType === "consultation") return undefined;
    return `/product/${slugify(item.name)}`;
  };
  const headerTitle = isConsultation
    ? "Online Consultation Details"
    : isTreatment
    ? "Treatment Order Details"
    : "Order Details";
  const orderTitle = order
    ? isConsultation
      ? order.products.find((item) => item.itemType === "consultation")?.name ||
        order.products[0]?.name ||
        "online consultation"
      : isTreatment
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

  const steps = isConsultation
    ? ["Booking Placed", "Confirmed", "Consultation Scheduled", "Completed"]
    : isTreatment
    ? ["Booking Placed", "Confirmed", "In Progress", "Completed"]
    : ["Order Placed", "Confirmed", "Shipped", "Delivered"];

  const statusCardClass = useMemo(() => {
    const paymentStatus = String(order?.paymentStatus || "").toLowerCase();
    if (["success", "paid", "completed"].includes(paymentStatus)) {
      return styles.statusCardSuccess;
    }
    if (["failed", "cancelled", "declined"].includes(paymentStatus)) {
      return styles.statusCardFailed;
    }
    if (["pending", "processing"].includes(paymentStatus)) {
      return styles.statusCardPending;
    }
    return "";
  }, [order?.paymentStatus]);

  const formatMoney = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;

  const orderTypeLabel = isConsultation
    ? "Online consultation"
    : isTreatment
    ? "Treatment booking"
    : "Product order";

  const handlePrintInvoice = () => {
    if (!order) return;

    const shippingAddress = order.address?.address || "-";
    const ok = printInvoice({
      invoiceNo: invoiceRef,
      orderNo: order._id.slice(-8),
      invoiceDate: formatInvoiceDate(new Date()),
      orderDate: formatInvoiceDate(order.createdAt),
      docSubtitle: "Customer order invoice",
      orderTypeLabel,
      paymentStatus: order.paymentStatus || "Pending",
      paymentMethod: order.paymentMethod || "Online payment",
      logoUrl: `${window.location.origin}/logo.jpeg`,
      billTo: {
        name: resolvedUser?.name || "Customer",
        email: resolvedUser?.email,
        address: shippingAddress,
      },
      shipTo: isConsultation
        ? { name: resolvedUser?.name || "Customer", address: "Online — no delivery address required" }
        : { name: resolvedUser?.name || "Customer", address: shippingAddress },
      items: order.products.map((item) => ({
        name: item.name,
        meta:
          item.itemType === "treatment" && item.clinicName
            ? `Clinic: ${item.clinicName}${item.clinicAddress ? ` — ${item.clinicAddress}` : ""}`
            : undefined,
        unitPrice: item.price,
        quantity: item.quantity,
        amount: item.price * item.quantity,
      })),
      total: order.totalAmount,
      footerNote:
        "This invoice is generated for your order records. Shipping and billing details are shown above for convenience. Please keep this copy for future reference.",
    });

    if (!ok) {
      toast.error("Unable to open print window. Please allow popups.");
    }
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
            Download Invoice
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
          <div className={`${styles.statusCard} ${statusCardClass}`}>
            <span>Payment Status</span>
            <strong>{order.paymentStatus || "Pending"}</strong>
            <p>
              {isConsultation
                ? "Online consultation invoice"
                : isTreatment
                ? "Treatment booking invoice"
                : "Product order invoice"}
            </p>
          </div>
        </div>

        <div className={styles.timelineCard}>
          <div className={styles.timelineHeader}>
            <h2>Order Progress</h2>
            <span className={styles.orderTypeTag}>
              {isConsultation ? "Consultation Order" : isTreatment ? "Treatment Order" : "Product Order"}
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
                      {itemDetailHref(item) && (
                        <Link href={itemDetailHref(item)!} className={styles.itemViewLink}>
                          <span>
                            View {item.itemType === "treatment" ? "Treatment" : "Product"}
                          </span>
                          <FiArrowUpRight className={styles.clinicLinkArrow} />
                        </Link>
                      )}
                      {item.itemType === "treatment" && item.clinicName && (
                        clinicHref(item.clinicId) ? (
                          <Link href={clinicHref(item.clinicId)!} className={styles.clinicLink}>
                            <FiMapPin />
                            <span>
                              {item.clinicName}
                              {item.clinicAddress ? ` — ${item.clinicAddress}` : ""}
                            </span>
                            <FiArrowUpRight className={styles.clinicLinkArrow} />
                          </Link>
                        ) : (
                          <p className={styles.clinicInfo}>
                            Clinic: {item.clinicName}
                            {item.clinicAddress ? ` — ${item.clinicAddress}` : ""}
                          </p>
                        )
                      )}
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
              <h2>
                {isConsultation ? "Consultation & Summary" : isTreatment ? "Clinic & Summary" : "Delivery & Summary"}
              </h2>
              <span>Order details</span>
            </div>
            <div className={styles.summaryList}>
              {!isConsultation && (
                <>
                  <div className={styles.summaryRow}>
                    <span>{isTreatment ? "Clinic" : "Deliver To"}</span>
                    {isTreatment && clinicHref(treatmentClinicItem?.clinicId) ? (
                      <Link
                        href={clinicHref(treatmentClinicItem?.clinicId)!}
                        className={styles.clinicSummaryLink}
                      >
                        {treatmentClinicItem?.clinicName}
                        <FiArrowUpRight />
                      </Link>
                    ) : (
                      <strong>
                        {isTreatment
                          ? treatmentClinicItem?.clinicName || order.address.type
                          : order.address.type}
                      </strong>
                    )}
                  </div>
                  <div className={styles.summaryRow}>
                    <span>{isTreatment ? "Clinic Address" : "Address"}</span>
                    <strong>
                      {isTreatment
                        ? treatmentClinicItem?.clinicAddress || order.address.address
                        : order.address.address}
                    </strong>
                  </div>
                </>
              )}
              {isConsultation && (
                <div className={styles.summaryRow}>
                  <span>Consultation Mode</span>
                  <strong>Online video consultation</strong>
                </div>
              )}
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

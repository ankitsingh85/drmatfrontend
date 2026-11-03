"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FiArrowUpRight,
  FiHelpCircle,
  FiCalendar,
  FiMapPin,
  FiHash,
  FiVideo,
  FiArrowRight,
} from "react-icons/fi";
import { useUser } from "@/context/UserContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import styles from "@/styles/adminpanel/orderhistory.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";

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
}

interface ResolvedUser {
  id: string;
  name?: string;
  email?: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type OrderHistoryMode = "all" | "treatment" | "consultation";

interface OrderHistoryProps {
  mode?: OrderHistoryMode;
}

const UserOrderHistory: React.FC<OrderHistoryProps> = ({ mode = "all" }) => {
  const router = useRouter();
  const { user, loading } = useUser();
  const confirm = useConfirm();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string>("");
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const [cancellingId, setCancellingId] = useState("");

  const token = Cookies.get("token") || "";
  const storedUserId =
    typeof window !== "undefined"
      ? Cookies.get("userId") || localStorage.getItem("userId")
      : null;

  const hasConsultationItems = (order: Order) =>
    Array.isArray(order.products) &&
    order.products.some((item) => item.itemType === "consultation");

  const isConsultationOrder = (order: Order) => {
    const orderType = String(order.orderType || "").toLowerCase();
    return orderType === "consultation" || hasConsultationItems(order);
  };

  const hasTreatmentItems = (order: Order) =>
    Array.isArray(order.products) &&
    order.products.some((item) => item.itemType === "treatment");

  const hasProductItems = (order: Order) =>
    Array.isArray(order.products) &&
    order.products.some((item) => item.itemType !== "treatment" && item.itemType !== "consultation");

  const hasTreatmentName = (order: Order) =>
    Array.isArray(order.products) &&
    order.products.some((item) =>
      String(item.name || "").toLowerCase().includes("treatment")
    );

  // Checked before the treatment heuristic — online consultation checkout
  // also stamps address.type "Other" (no delivery address needed), which
  // the legacy treatment fallback below would otherwise swallow.
  const isTreatmentOrder = (order: Order) => {
    if (isConsultationOrder(order)) return false;
    const orderType = String(order.orderType || "").toLowerCase();
    if (orderType === "treatment" || hasTreatmentItems(order) || hasTreatmentName(order))
      return true;

    const type = String(order.address?.type || "").toLowerCase();
    const addressText = String(order.address?.address || "").toLowerCase().trim();
    return (
      type === "other" ||
      addressText.includes("treatment booking") ||
      addressText.includes("treatment")
    );
  };

  const isProductOrder = (order: Order) => {
    const orderType = String(order.orderType || "").toLowerCase();
    if (isTreatmentOrder(order) || isConsultationOrder(order)) return false;
    return orderType === "product" || hasProductItems(order);
  };

  const getVisibleProducts = (order: Order) => {
    const products = Array.isArray(order.products) ? order.products : [];
    if (mode === "treatment") {
      const treatmentItems = products.filter((item) => item.itemType === "treatment");
      if (treatmentItems.length > 0) return treatmentItems;
    }
    if (mode === "consultation") {
      const consultationItems = products.filter((item) => item.itemType === "consultation");
      if (consultationItems.length > 0) return consultationItems;
    }
    const productItems = products.filter(
      (item) => item.itemType !== "treatment" && item.itemType !== "consultation"
    );
    return productItems.length > 0 ? productItems : products;
  };

  const getOrderTitle = (order: Order) => {
    const visibleItems = getVisibleProducts(order);
    if (mode === "treatment") {
      return visibleItems[0]?.name || "treatment booking";
    }
    if (mode === "consultation") {
      return visibleItems[0]?.name || "online consultation";
    }
    return visibleItems[0]?.name || order.products?.[0]?.name || "order";
  };

  const getOrderSlug = (order: Order) => slugify(getOrderTitle(order));

  // Lets a shopper jump from an order line item to that product's or
  // treatment's own page, then use the browser back button to return here.
  const getItemDetailHref = (item: OrderProduct) => {
    if (!item.name) return undefined;
    if (item.itemType === "treatment") return `/treatment-plans/${slugify(item.name)}`;
    if (item.itemType === "consultation") return undefined;
    return `/product/${slugify(item.name)}`;
  };

  const formatOrderDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const shortOrderId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

  // The "where/what" chip under the order title changes meaning per mode —
  // a delivery address for products, the clinic visited for treatments, and
  // a fixed "online" label for consultations (there's no address to show).
  const getOrderLocationChip = (order: Order) => {
    if (mode === "treatment") {
      const treatmentItem = order.products.find(
        (item) => item.itemType === "treatment" && item.clinicName
      );
      if (treatmentItem?.clinicName) {
        return {
          icon: <FiMapPin />,
          text: treatmentItem.clinicAddress
            ? `${treatmentItem.clinicName} — ${treatmentItem.clinicAddress}`
            : treatmentItem.clinicName,
        };
      }
    }
    if (mode === "consultation") {
      return { icon: <FiVideo />, text: "Online video consultation" };
    }
    if (order.address?.address) {
      return { icon: <FiMapPin />, text: order.address.address };
    }
    return null;
  };

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
    if (!resolvedUser?.id) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        setFetching(true);
        setError("");
        setOrders([]);

        const res = await axios.get(`${API_URL}/orders/my`, {
          params: {
            orderType:
              mode === "treatment" ? "treatment" : mode === "consultation" ? "consultation" : "product",
          },
          headers: {
            "x-user-id": resolvedUser.id,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (Array.isArray(res.data)) {
          const nextOrders =
            mode === "treatment"
              ? res.data.filter((order: Order) => isTreatmentOrder(order))
              : mode === "consultation"
              ? res.data.filter((order: Order) => isConsultationOrder(order))
              : res.data.filter((order: Order) => isProductOrder(order));
          setOrders(nextOrders);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError(err.response?.data?.message || "Failed to fetch orders");
      } finally {
        setFetching(false);
      }
    };

    fetchOrders();
  }, [mode, resolvedUser?.id, token]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!resolvedUser?.id) {
    return (
      <div className={styles.stateWrap}>
        <h3>Login required</h3>
        <p>Please log in to view your orders.</p>
      </div>
    );
  }

  if (fetching) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div className={styles.stateWrap}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  const headerName = resolvedUser.name || "Your";

  const handleOrderClick = (order: Order) => {
    router.push(`/user/order/${getOrderSlug(order)}`);
  };

  const handleOrderKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    order: Order
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(`/user/order/${getOrderSlug(order)}`);
    }
  };

  const canCancelOrder = (order: Order) =>
    order.status !== "Cancelled" && order.status !== "Delivered";

  const handleCancelOrder = async (event: React.MouseEvent, order: Order) => {
    event.stopPropagation();
    if (!resolvedUser?.id) return;

    const ok = await confirm("Cancel this order? This cannot be undone.", {
      title: "Cancel order",
      confirmLabel: "Cancel Order",
      danger: true,
    });
    if (!ok) return;

    try {
      setCancellingId(order._id);
      await axios.put(
        `${API_URL}/orders/${order._id}/cancel`,
        {},
        {
          headers: {
            "x-user-id": resolvedUser.id,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: "Cancelled" } : o))
      );
      toast.success("Order cancelled successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancellingId("");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>
            {mode === "treatment"
              ? `${headerName} Treatment Orders`
              : mode === "consultation"
              ? `${headerName} Consultation Orders`
              : `${headerName} Orders`}
          </h2>
          <p className={styles.subtle}>
            Track{" "}
            {mode === "treatment"
              ? "treatment bookings"
              : mode === "consultation"
              ? "online consultation bookings"
              : "purchases"}{" "}
            and payment status in one place.
          </p>
        </div>
        <div className={styles.summaryChip}>
          <span>
            {mode === "treatment"
              ? "Treatment Orders"
              : mode === "consultation"
              ? "Consultation Orders"
              : "Total Orders"}
          </span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyBadge}>
            {mode === "treatment"
              ? "No Treatment Orders Yet"
              : mode === "consultation"
              ? "No Consultation Orders Yet"
              : "No Orders Yet"}
          </div>
          <p>
            {mode === "treatment"
              ? "Once you book a treatment plan, it will appear here automatically."
              : mode === "consultation"
              ? "Once you book an online consultation, it will appear here automatically."
              : "Once you purchase a product, it will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {orders.map((order) => {
            const locationChip = getOrderLocationChip(order);
            const isCancelled = order.status === "Cancelled";
            const isPaid = String(order.paymentStatus || "").toLowerCase() === "paid";

            return (
              <div
                key={order._id}
                className={`${styles.orderCard} ${styles.orderCardClickable}`}
                role="button"
                tabIndex={0}
                onClick={() => handleOrderClick(order)}
                onKeyDown={(event) => handleOrderKeyDown(event, order)}
                aria-label={`Open order ${getOrderTitle(order)} details`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardTopInfo}>
                    <span className={styles.orderIdTag}>
                      <FiHash /> {shortOrderId(order._id)}
                    </span>
                    <span className={styles.orderDateTag}>
                      <FiCalendar /> {formatOrderDate(order.createdAt)}
                    </span>
                  </div>
                  <span
                    className={`${styles.badge} ${
                      isCancelled
                        ? styles.badgeCancelled
                        : isPaid
                        ? styles.badgePaid
                        : styles.badgePending
                    }`}
                  >
                    {isCancelled ? "Cancelled" : order.paymentStatus || "Pending"}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.orderTitle}>{getOrderTitle(order)}</h3>
                  {locationChip && (
                    <p className={styles.locationChip}>
                      {locationChip.icon}
                      <span>{locationChip.text}</span>
                    </p>
                  )}

                  <div className={styles.items}>
                    {getVisibleProducts(order).map((p) => (
                      <div key={`${order._id}-${p.id}`} className={styles.itemRow}>
                        <div className={styles.itemLeft}>
                          <img src={p.image || ""} alt={p.name} className={styles.itemImage} />
                          <div className={styles.itemMeta}>
                            <p className={styles.itemName}>{p.name}</p>
                            <span className={styles.itemQty}>Qty: {p.quantity}</span>
                            {getItemDetailHref(p) && (
                              <Link
                                href={getItemDetailHref(p)!}
                                className={styles.itemViewLink}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <span>View {p.itemType === "treatment" ? "Treatment" : "Product"}</span>
                                <FiArrowUpRight />
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className={styles.itemPrice}>
                          Rs. {(p.price * p.quantity).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.totalBlock}>
                    <span>Total Paid</span>
                    <strong>Rs. {order.totalAmount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    {mode !== "treatment" && mode !== "consultation" && canCancelOrder(order) && (
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={(event) => handleCancelOrder(event, order)}
                        disabled={cancellingId === order._id}
                      >
                        {cancellingId === order._id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                    {(mode === "treatment" || mode === "consultation") && (
                      <button
                        type="button"
                        className={styles.needHelpBtn}
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push("/UserDashboard?section=helpcenter");
                        }}
                      >
                        <FiHelpCircle /> Need Help
                      </button>
                    )}
                    <span className={styles.hintText}>
                      View details & invoice <FiArrowRight />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;

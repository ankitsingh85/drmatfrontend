"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/adminpanel/orderhistory.module.css";
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

type OrderHistoryMode = "all" | "treatment";

interface OrderHistoryProps {
  mode?: OrderHistoryMode;
}

const UserOrderHistory: React.FC<OrderHistoryProps> = ({ mode = "all" }) => {
  const router = useRouter();
  const { user, loading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string>("");
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);

  const token = Cookies.get("token") || "";
  const storedUserId =
    typeof window !== "undefined"
      ? Cookies.get("userId") || localStorage.getItem("userId")
      : null;

  const hasTreatmentItems = (order: Order) =>
    Array.isArray(order.products) &&
    order.products.some((item) => item.itemType === "treatment");

  const hasProductItems = (order: Order) =>
    Array.isArray(order.products) &&
    order.products.some((item) => item.itemType !== "treatment");

  const isTreatmentOrder = (order: Order) => {
    const orderType = String(order.orderType || "").toLowerCase();
    if (orderType === "treatment" || hasTreatmentItems(order)) return true;

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
    if (hasProductItems(order)) return true;
    return orderType !== "treatment" && !isTreatmentOrder(order);
  };

  const getVisibleProducts = (order: Order) => {
    const products = Array.isArray(order.products) ? order.products : [];
    if (mode === "treatment") {
      const treatmentItems = products.filter((item) => item.itemType === "treatment");
      if (treatmentItems.length > 0) return treatmentItems;
    }
    const productItems = products.filter((item) => item.itemType !== "treatment");
    return productItems.length > 0 ? productItems : products;
  };

  const getOrderTitle = (order: Order) => {
    const visibleItems = getVisibleProducts(order);
    if (mode === "treatment") {
      return visibleItems[0]?.name || "treatment booking";
    }
    return visibleItems[0]?.name || order.products?.[0]?.name || "order";
  };

  const getOrderSlug = (order: Order) => slugify(getOrderTitle(order));

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
            orderType: mode === "treatment" ? "treatment" : "product",
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>{mode === "treatment" ? `${headerName} Treatment Orders` : `${headerName} Orders`}</h2>
          <p className={styles.subtle}>
            Track {mode === "treatment" ? "treatment bookings" : "purchases"} and payment status in one place.
          </p>
        </div>
        <div className={styles.summaryChip}>
          <span>{mode === "treatment" ? "Treatment Orders" : "Total Orders"}</span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyBadge}>
            {mode === "treatment" ? "No Treatment Orders Yet" : "No Orders Yet"}
          </div>
          <p>
            {mode === "treatment"
              ? "Once you book a treatment plan, it will appear here automatically."
              : "Once you purchase a product, it will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {orders.map((order) => (
            <div
              key={order._id}
              className={`${styles.orderCard} ${styles.orderCardClickable}`}
              role="button"
              tabIndex={0}
              onClick={() => handleOrderClick(order)}
              onKeyDown={(event) => handleOrderKeyDown(event, order)}
              aria-label={`Open order ${getOrderTitle(order)} details`}
            >
              <div className={styles.metaBar}>
                <div className={styles.metaGroup}>
                  <span>ORDER PLACED</span>
                  <strong>{new Date(order.createdAt).toLocaleDateString("en-IN")}</strong>
                </div>
                <div className={styles.metaGroup}>
                  <span>TOTAL</span>
                  <strong>Rs. {order.totalAmount.toLocaleString("en-IN")}</strong>
                </div>
                <div className={styles.metaGroup}>
                  <span>DELIVER TO</span>
                  <strong>{order.address.type}</strong>
                </div>
                <div className={styles.metaRight}>
                  <p>{getOrderTitle(order)}</p>
                  <span
                    className={`${styles.badge} ${
                      String(order.paymentStatus || "").toLowerCase() === "paid"
                        ? styles.badgePaid
                        : styles.badgePending
                    }`}
                  >
                    {order.paymentStatus || "Pending"}
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.addressText}>{order.address.address}</p>
                <p className={styles.hintText}>Tap to view full order details and invoice</p><hr/>
                <div className={styles.items}>
                  {getVisibleProducts(order).map((p) => (
                    <div key={`${order._id}-${p.id}`} className={styles.itemRow}>
                      <div className={styles.itemLeft}>
                        <img
                          src={p.image || ""}
                          alt={p.name}
                          className={styles.itemImage}
                        />
                        <div className={styles.itemMeta}>
                          <p className={styles.itemName}>{p.name}</p>
                          <span className={styles.itemQty}>Qty: {p.quantity}</span>
                        </div>
                      </div>
                      <div className={styles.itemPrice}>
                        Rs. {(p.price * p.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;

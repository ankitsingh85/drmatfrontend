"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { FiChevronRight, FiSearch, FiShoppingBag } from "react-icons/fi";
import styles from "@/styles/adminpanel/orderhistory.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";

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
}

interface ClinicOrderHistoryProps {
  clinicId: string;
}

type OrderCategory = "product" | "course" | "workshop" | "treatment";

const formatDateTime = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatMoney = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;

const normalizeCategory = (value: string): OrderCategory => {
  if (value === "course" || value === "workshop" || value === "treatment") {
    return value;
  }
  return "product";
};

const getOrderCategories = (order: ClinicOrder): OrderCategory[] => {
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

const getClinicName = (order: ClinicOrder) => {
  if (typeof order.clinicId === "object" && order.clinicId) {
    return order.clinicId.clinicName || "Clinic purchase";
  }
  return "Clinic purchase";
};

const getOrderLabel = (order: ClinicOrder) => {
  const categories = getOrderCategories(order);
  if (categories.length > 1) return "Mixed";
  const category = categories[0] || "product";
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export default function ClinicOrderHistory({ clinicId }: ClinicOrderHistoryProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<ClinicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const token = Cookies.get("token") || "";

  useEffect(() => {
    if (!clinicId) {
      setOrders([]);
      setLoading(false);
      setError("Clinic id is missing.");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/orders/my`, {
          headers: {
            "x-clinic-id": clinicId,
            "x-owner-type": "clinic",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load clinic orders");
        }

        const nextOrders = Array.isArray(data) ? data : [];
        nextOrders.sort(
          (a: ClinicOrder, b: ClinicOrder) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(nextOrders);
      } catch (err: any) {
        setOrders([]);
        setError(err?.message || "Failed to load clinic orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [clinicId, token]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (!q) return true;

      const clinicName = getClinicName(order).toLowerCase();
      const orderId = order._id.toLowerCase();
      const address = String(order.address?.address || "").toLowerCase();
      const addressType = String(order.address?.type || "").toLowerCase();
      const itemsText = (order.products || []).map((item) => item.name).join(" ").toLowerCase();
      const orderKind = getOrderLabel(order).toLowerCase();
      const paymentStatus = String(order.paymentStatus || "").toLowerCase();
      return [clinicName, orderId, address, addressType, itemsText, orderKind, paymentStatus].some(
        (value) => value.includes(q)
      );
    });
  }, [orders, search]);

  const totalAmount = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [filteredOrders]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleOrderOpen = (orderId: string) => {
    router.push(`/clinic-order/${orderId}`);
  };

  const handleOrderKeyDown = (event: React.KeyboardEvent<HTMLElement>, orderId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOrderOpen(orderId);
    }
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Clinic Orders</h2>
          <p className={styles.subtle}>
            Products, courses, and workshop purchases placed from this clinic account.
          </p>
        </div>

        <div className={styles.summaryChip}>
          <span>Orders</span>
          <strong>{filteredOrders.length}</strong>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            flex: "1 1 320px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#fff",
            boxShadow: "0 12px 24px rgba(15, 23, 42, 0.04)",
          }}
        >
          <FiSearch color="#64748b" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by order id, product, workshop, or course..."
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "#0f172a",
              fontSize: 14,
            }}
          />
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            background: "#eef5ff",
            color: "#173252",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FiShoppingBag />
          <span>{formatMoney(totalAmount)}</span>
        </div>
      </div>

      {error ? (
        <div className={styles.stateWrap}>
          <p className={styles.error}>Error: {error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyBadge}>
            {orders.length === 0 ? "No Clinic Orders Yet" : "No Matching Orders"}
          </div>
          <p>
            {orders.length === 0
              ? "Once this clinic completes payment for a product, course, or workshop, the order will appear here automatically."
              : "Try another search term to find a different clinic order."}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredOrders.map((order) => {
            const orderCategories = getOrderCategories(order);
            const orderKind = getOrderLabel(order);
            const statusLabel =
              String(order.status || "").trim() ||
              (String(order.paymentStatus || "").toLowerCase() === "success"
                ? "Paid"
                : order.paymentStatus || "Pending");
            const isPaid = String(order.paymentStatus || "").toLowerCase() === "success";
            const paymentClass = isPaid ? styles.badgePaid : styles.badgePending;

            return (
              <article
                key={order._id}
                className={`${styles.orderCard} ${styles.orderCardClickable}`}
                role="button"
                tabIndex={0}
                onClick={() => handleOrderOpen(order._id)}
                onKeyDown={(event) => handleOrderKeyDown(event, order._id)}
                aria-label={`Open order ${order._id} details`}
              >
                <div className={styles.metaBar}>
                  <div className={styles.metaGroup}>
                    <span>ORDER PLACED</span>
                    <strong>{formatDateTime(order.createdAt)}</strong>
                  </div>
                  <div className={styles.metaGroup}>
                    <span>TOTAL</span>
                    <strong>{formatMoney(Number(order.totalAmount || 0))}</strong>
                  </div>
                  <div className={styles.metaGroup}>
                    <span>TYPE</span>
                    <strong>{orderKind} Order</strong>
                  </div>
                  <div className={styles.metaRight}>
                    <p>{getClinicName(order)}</p>
                    <span className={`${styles.badge} ${paymentClass}`}>{statusLabel}</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.addressText}>
                    <strong>Order ID:</strong> {order._id}
                  </p>
                  <p className={styles.hintText}>
                    Clinic-owned purchase recorded through the payment gateway.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {orderCategories.map((category) => (
                      <span
                        key={`${order._id}-${category}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 999,
                          padding: "6px 10px",
                          background:
                            category === "workshop"
                              ? "rgba(245, 158, 11, 0.12)"
                              : category === "course"
                              ? "rgba(13, 93, 143, 0.12)"
                              : category === "treatment"
                              ? "rgba(34, 197, 94, 0.12)"
                              : "rgba(99, 102, 241, 0.10)",
                          color:
                            category === "workshop"
                              ? "#b45309"
                              : category === "course"
                              ? "#0d5d8f"
                              : category === "treatment"
                              ? "#166534"
                              : "#4f46e5",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className={styles.items}>
                    {order.products.map((product) => (
                      <div key={`${order._id}-${product.id}`} className={styles.itemRow}>
                        <div className={styles.itemLeft}>
                          <img
                            src={resolveMediaUrl(product.image) || "/skin_hair.jpg"}
                            alt={product.name}
                            className={styles.itemImage}
                          />
                          <div className={styles.itemMeta}>
                            <p className={styles.itemName}>{product.name}</p>
                            <span className={styles.itemQty}>Qty: {product.quantity}</span>
                          </div>
                        </div>
                        <div className={styles.itemPrice}>
                          {formatMoney(product.price * product.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                        Deliver To
                      </span>
                      <strong style={{ color: "#0f172a", fontSize: 12 }}>
                        {order.address?.type || "Clinic"}
                      </strong>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        color: "#475569",
                        fontSize: 12,
                        lineHeight: 1.6,
                        textAlign: "right",
                      }}
                    >
                      {order.address?.address || "No address provided"}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 8,
                      color: "#0d5d8f",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Open Invoice
                    <FiChevronRight />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

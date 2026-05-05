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

interface DoctorOrder {
  _id: string;
  ownerType?: "user" | "clinic" | "doctor";
  orderType?: "product" | "treatment";
  products: OrderProduct[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt: string;
  paymentStatus?: string;
  status?: string;
}
interface DoctorOrderHistoryProps {
  doctorId: string;
}

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

const getOrderLabel = (order: DoctorOrder) => {
  const products = Array.isArray(order.products) ? order.products : [];
  const hasCourse = products.some((item) =>
    `${item.id} ${item.name}`.toLowerCase().includes("course")
  );
  const hasWorkshop = products.some((item) =>
    `${item.id} ${item.name}`.toLowerCase().includes("workshop")
  );
  const hasTreatment =
    order.orderType === "treatment" ||
    products.some((item) => item.itemType === "treatment" || item.name.toLowerCase().includes("treatment"));

  if (hasTreatment) return "Treatment";
  if (hasWorkshop) return "Workshop";
  if (hasCourse) return "Course";
  return "Product";
};

export default function DoctorOrderHistory({ doctorId }: DoctorOrderHistoryProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<DoctorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const token = Cookies.get("token") || "";

  useEffect(() => {
    if (!doctorId) {
      setOrders([]);
      setLoading(false);
      setError("Doctor id is missing.");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/doctor-orders/my`, {
          headers: {
            "x-doctor-id": doctorId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Failed to load doctor orders");
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setOrders([]);
        setError(err?.message || "Failed to load doctor orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [doctorId, token]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!q) return true;
      const itemsText = (order.products || []).map((item) => item.name).join(" ").toLowerCase();
      return [order._id, order.address?.address || "", getOrderLabel(order), itemsText]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, search]);

  const totalAmount = filteredOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  const handleOrderOpen = (orderId: string) => {
    router.push(`/doctor-order/${orderId}`);
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
          <h2>Doctor Orders</h2>
          <p className={styles.subtle}>
            Products, courses, and workshop purchases placed from this doctor account.
          </p>
        </div>
        <div className={styles.summaryChip}>
          <span>Orders</span>
          <strong>{filteredOrders.length}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <div style={{ flex: "1 1 320px", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, border: "1px solid #e5e7eb", background: "#fff" }}>
          <FiSearch color="#64748b" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order id, product, workshop, or course..."
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: "#0f172a", fontSize: 14 }}
          />
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 16, background: "#eef5ff", color: "#173252", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8 }}>
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
            {orders.length === 0 ? "No Doctor Orders Yet" : "No Matching Orders"}
          </div>
          <p>
            {orders.length === 0
              ? "Once this doctor completes payment for a product, course, or workshop, the order will appear here automatically."
              : "Try another search term to find a different doctor order."}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredOrders.map((order) => {
            const statusLabel =
              String(order.status || "").trim() ||
              (String(order.paymentStatus || "").toLowerCase() === "success"
                ? "Paid"
                : order.paymentStatus || "Pending");
            const isPaid = String(order.paymentStatus || "").toLowerCase() === "success";

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
                    <strong>{getOrderLabel(order)} Order</strong>
                  </div>
                  <div className={styles.metaRight}>
                    <p>Doctor purchase</p>
                    <span className={`${styles.badge} ${isPaid ? styles.badgePaid : styles.badgePending}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.addressText}>
                    <strong>Order ID:</strong> {order._id}
                  </p>
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
                        {order.address?.type || "Doctor"}
                      </strong>
                    </div>
                    <p style={{ margin: 0, color: "#475569", fontSize: 12, lineHeight: 1.6, textAlign: "right" }}>
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

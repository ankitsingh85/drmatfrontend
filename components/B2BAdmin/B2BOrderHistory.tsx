"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import {
  FiSearch,
  FiShoppingBag,
  FiCalendar,
  FiHash,
  FiCheckCircle,
  FiClock,
  FiPackage,
} from "react-icons/fi";
import styles from "@/styles/components/common/b2bOrderTable.module.css";
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

interface B2BOrder {
  _id: string;
  ownerType?: "user" | "clinic" | "b2buser";
  orderType?: "product" | "treatment";
  products: OrderProduct[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt: string;
  paymentStatus?: string;
  status?: "Pending" | "Shipped" | "Delivered" | "Cancelled" | string;
}

interface B2BOrderHistoryProps {
  b2bUserId: string;
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

const getOrderCategories = (order: B2BOrder): OrderCategory[] => {
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

const getTypeBadgeClass = (categories: OrderCategory[]) => {
  if (categories.length > 1) return styles.typeMixed;
  const category = categories[0] || "product";
  if (category === "course") return styles.typeCourse;
  if (category === "workshop") return styles.typeWorkshop;
  if (category === "treatment") return styles.typeTreatment;
  return styles.typeProduct;
};

const getOrderLabel = (categories: OrderCategory[]) => {
  if (categories.length > 1) return "Mixed";
  const category = categories[0] || "product";
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export default function B2BOrderHistory({ b2bUserId }: B2BOrderHistoryProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const token = Cookies.get("token") || "";

  useEffect(() => {
    if (!b2bUserId) {
      setOrders([]);
      setLoading(false);
      setError("B2B user id is missing.");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/orders/my`, {
          headers: {
            "x-b2buser-id": b2bUserId,
            "x-owner-type": "b2buser",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load orders");
        }

        const nextOrders = Array.isArray(data) ? data : [];
        nextOrders.sort(
          (a: B2BOrder, b: B2BOrder) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(nextOrders);
      } catch (err: any) {
        setOrders([]);
        setError(err?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [b2bUserId, token]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (!q) return true;

      const orderId = order._id.toLowerCase();
      const address = String(order.address?.address || "").toLowerCase();
      const addressType = String(order.address?.type || "").toLowerCase();
      const itemsText = (order.products || []).map((item) => item.name).join(" ").toLowerCase();
      const categories = getOrderCategories(order);
      const orderKind = getOrderLabel(categories).toLowerCase();
      const paymentStatus = String(order.paymentStatus || "").toLowerCase();
      return [orderId, address, addressType, itemsText, orderKind, paymentStatus].some((value) =>
        value.includes(q)
      );
    });
  }, [orders, search]);

  const totalAmount = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [filteredOrders]
  );

  const handleOrderOpen = (orderId: string) => {
    router.push(`/b2b-order/${orderId}`);
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
          <h2 className={styles.headerTitle}>My Orders</h2>
          <p className={styles.headerSubtitle}>
            Products, courses, and workshop purchases placed from your B2B account.
          </p>
        </div>

        <div className={styles.summaryChip}>
          <FiShoppingBag />
          <span>{filteredOrders.length} Orders</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch color="#64748b" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order id, product, workshop, or course..."
          />
        </div>

        <div className={styles.totalChip}>
          <FiShoppingBag />
          <span>{formatMoney(totalAmount)}</span>
        </div>
      </div>

      {error ? (
        <div className={styles.errorBox}>Error: {error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyBadge}>
            <FiPackage />
            {orders.length === 0 ? "No Orders Yet" : "No Matching Orders"}
          </div>
          <p>
            {orders.length === 0
              ? "Once you complete payment for a product, course, or workshop, the order will appear here automatically."
              : "Try another search term to find a different order."}
          </p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Type</th>
                <th>Items</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const categories = getOrderCategories(order);
                const orderKind = getOrderLabel(categories);
                const isPaid = String(order.paymentStatus || "").toLowerCase() === "success";
                const statusLabel =
                  String(order.status || "").trim() || (isPaid ? "Paid" : order.paymentStatus || "Pending");
                const itemCount = (order.products || []).reduce(
                  (sum, item) => sum + Number(item.quantity || 1),
                  0
                );
                const firstItemName = order.products?.[0]?.name || "Item";

                return (
                  <tr
                    key={order._id}
                    className={styles.orderRowClickable}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOrderOpen(order._id)}
                    onKeyDown={(event) => handleOrderKeyDown(event, order._id)}
                    aria-label={`Open order ${order._id} details`}
                  >
                    <td>
                      <div className={styles.orderIdCell}>
                        <span className={styles.orderIdIcon}>
                          <FiHash size={14} />
                        </span>
                        <span title={order._id}>{order._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <FiCalendar size={14} />
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.typeBadge} ${getTypeBadgeClass(categories)}`}>
                        {orderKind}
                      </span>
                    </td>
                    <td>
                      <div className={styles.itemsCell}>
                        <FiPackage size={14} />
                        {firstItemName}
                        {order.products.length > 1 ? ` +${order.products.length - 1} more` : ""}
                        {" · "}
                        Qty {itemCount}
                      </div>
                    </td>
                    <td className={styles.amountCell}>
                      {formatMoney(Number(order.totalAmount || 0))}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          isPaid ? styles.statusPaid : styles.statusPending
                        }`}
                      >
                        {isPaid ? <FiCheckCircle size={13} /> : <FiClock size={13} />}
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

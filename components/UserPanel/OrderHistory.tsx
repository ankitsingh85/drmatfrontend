"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useUser } from "@/context/UserContext";
import styles from "@/styles/adminpanel/orderhistory.module.css";
import { API_URL } from "@/config/api";

interface OrderProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  products: OrderProduct[];
  totalAmount: number;
  address: { type: string; address: string };
  createdAt: string;
  paymentStatus?: string;
}

interface ResolvedUser {
  id: string;
  name?: string;
  email?: string;
}

const UserOrderHistory: React.FC = () => {
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
          headers: {
            "x-user-id": resolvedUser.id,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (Array.isArray(res.data)) {
          setOrders(res.data);
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
  }, [resolvedUser?.id, token]);

  if (loading) {
    return (
      <div className={styles.stateWrap}>
        <div className={styles.spinner} />
        <p>Loading your profile...</p>
      </div>
    );
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
    return (
      <div className={styles.stateWrap}>
        <div className={styles.spinner} />
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateWrap}>
        <p className={styles.error}>Error: {error}</p>
      </div>
    );
  }

  const headerName = resolvedUser.name || "Your";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>{headerName} Orders</h2>
          <p className={styles.subtle}>
            Track purchases, payment status, and order details in one place.
          </p>
        </div>
        <div className={styles.summaryChip}>
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyBadge}>No Orders Yet</div>
          <p>Once you purchase a product, it will appear here automatically.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {orders.map((order) => (
            <div key={order._id} className={styles.orderCard}>
              <div className={styles.cardTop}>
                <div>
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <span className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <span
                  className={`${styles.badge} ${
                    order.paymentStatus === "Paid"
                      ? styles.badgePaid
                      : styles.badgePending
                  }`}
                >
                  {order.paymentStatus || "Pending"}
                </span>
              </div>

              <div className={styles.address}>
                <span>{order.address.type}</span>
                <p>{order.address.address}</p>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
              </div>

              <div className={styles.items}>
                {order.products.map((p) => (
                  <div key={`${order._id}-${p.id}`} className={styles.itemRow}>
                    <div className={styles.itemMeta}>
                      <p className={styles.itemName}>{p.name}</p>
                      <span className={styles.itemQty}>Qty {p.quantity}</span>
                    </div>
                    <div className={styles.itemPrice}>
                      ₹{(p.price * p.quantity).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory;

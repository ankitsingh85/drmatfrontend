"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/allorders.module.css";

interface ICartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface IOrder {
  _id: string;
  userId: IUser;
  totalAmount: number;
  address: { type: string; address: string };
  products: ICartItem[];
  createdAt: string;
  status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
}

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const AllOrders: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/orders/all`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
        setOrders(data);
        setFilteredOrders(data);
      } catch (err) {
        console.error("❌ Error fetching all orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, []);

  // 🔍 Filter orders by name or email
  useEffect(() => {
    if (!search.trim()) {
      setFilteredOrders(orders);
    } else {
      const q = search.toLowerCase();
      const filtered = orders.filter((o) => {
        const name = o.userId?.name?.toLowerCase() || "";
        const email = o.userId?.email?.toLowerCase() || "";
        return name.includes(q) || email.includes(q);
      });
      setFilteredOrders(filtered);
    }
  }, [search, orders]);

  // 🛠️ Update order status
  const updateOrderStatus = async (orderId: string, newStatus: IOrder["status"]) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update order status");

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
      setFilteredOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error("❌ Error updating order status:", err);
    }
  };

  if (loading) return <p className={styles.message}>Loading orders...</p>;
  if (!filteredOrders.length)
    return <p className={styles.message}>No orders found.</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📦 All User Orders</h2>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.grid}>
        {filteredOrders.map((order) => (
          <div key={order._id} className={styles.orderCard}>
            <div className={styles.userInfo}>
              {order.userId?.image ? (
                <img
                  src={order.userId.image}
                  alt={order.userId.name}
                  className={styles.userImg}
                />
              ) : (
                <div className={styles.placeholderImg}>
                  {order.userId?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}

              <div>
                <h3 className={styles.userName}>
                  {order.userId?.name || "Unknown User"}
                </h3>
                <p className={styles.userEmail}>{order.userId?.email}</p>
              </div>
            </div>

            <div className={styles.orderMeta}>
              <p><strong>Order ID:</strong> {order._id}</p>
              <p>
                <strong>Address:</strong> {order.address.type} — {order.address.address}
              </p>
              <p>
                <strong>Total:</strong> ₹{order.totalAmount.toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleString("en-IN")}
              </p>

              <div className={styles.statusSection}>
                <strong>Status:</strong>{" "}
               <span
  className={`${styles.statusBadge} ${
    styles[order.status ? order.status.toLowerCase() : "pending"]
  }`}
>
  {order.status || "Pending"}
</span>


                <select
                  value={order.status}
                  onChange={(e) =>
                    updateOrderStatus(order._id, e.target.value as IOrder["status"])
                  }
                  className={styles.statusSelect}
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className={styles.products}>
              <h4>🛒 Items</h4>
              <ul>
                {order.products.map((p) => (
                  <li key={p.id}>
                    {p.name} × {p.quantity} — ₹
                    {(p.price * p.quantity).toLocaleString("en-IN")}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllOrders;

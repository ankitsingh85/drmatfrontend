"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { FiSearch, FiUser, FiPhone, FiMail, FiPlayCircle, FiCheckCircle } from "react-icons/fi";
import styles from "@/styles/adminpanel/orderhistory.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import StartTreatmentModal from "@/components/modal/StartTreatmentModal";

interface BookingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  itemType?: "product" | "treatment" | "consultation";
  clinicId?: string;
}

interface OrderPatient {
  _id?: string;
  name?: string;
  email?: string;
  contactNo?: string;
}

interface BookingOrder {
  _id: string;
  userId?: OrderPatient | string;
  products: BookingItem[];
  totalAmount: number;
  createdAt: string;
  paymentStatus?: string;
  status?: "Pending" | "Shipped" | "Delivered" | "Cancelled" | string;
  treatmentStartedAt?: string;
}

interface ClinicTreatmentBookingsProps {
  clinicId: string;
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

export default function ClinicTreatmentBookings({ clinicId }: ClinicTreatmentBookingsProps) {
  const [orders, setOrders] = useState<BookingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [startModalOrderId, setStartModalOrderId] = useState("");

  const token = Cookies.get("token") || "";

  useEffect(() => {
    if (!clinicId) {
      setOrders([]);
      setLoading(false);
      setError("Clinic id is missing.");
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/orders/clinic-bookings/${clinicId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load treatment bookings");
        }

        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setOrders([]);
        setError(err?.message || "Failed to load treatment bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [clinicId, token]);

  // Each order may contain line items for clinics other than this one, or
  // a mix of treatment/product items — only surface the bits of this order
  // that are actually a treatment booked at THIS clinic.
  const bookings = useMemo(
    () =>
      orders
        .map((order) => ({
          order,
          items: (order.products || []).filter(
            (item) => item.itemType === "treatment" && item.clinicId === clinicId
          ),
        }))
        .filter((entry) => entry.items.length > 0),
    [orders, clinicId]
  );

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;

    return bookings.filter(({ order, items }) => {
      const patient = typeof order.userId === "object" ? order.userId : null;
      const patientName = (patient?.name || "").toLowerCase();
      const patientEmail = (patient?.email || "").toLowerCase();
      const patientPhone = (patient?.contactNo || "").toLowerCase();
      const orderId = order._id.toLowerCase();
      const itemsText = items.map((item) => item.name).join(" ").toLowerCase();
      return [patientName, patientEmail, patientPhone, orderId, itemsText].some((value) =>
        value.includes(q)
      );
    });
  }, [bookings, search]);

  const startModalEntry = bookings.find(({ order }) => order._id === startModalOrderId) || null;

  const handleTreatmentStarted = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId
          ? { ...order, treatmentStartedAt: new Date().toISOString() }
          : order
      )
    );
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Treatment Bookings</h2>
          <p className={styles.subtle}>
            Patients who booked a treatment at your clinic through Dr Dermat.
          </p>
        </div>

        <div className={styles.summaryChip}>
          <span>Bookings</span>
          <strong>{filteredBookings.length}</strong>
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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by patient name, email, phone, or treatment..."
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
      </div>

      {error ? (
        <div className={styles.stateWrap}>
          <p className={styles.error}>Error: {error}</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyBadge}>
            {orders.length === 0 ? "No Treatment Bookings Yet" : "No Matching Bookings"}
          </div>
          <p>
            {orders.length === 0
              ? "Once a patient books a treatment and picks your clinic at checkout, it will appear here automatically."
              : "Try another search term to find a different booking."}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredBookings.map(({ order, items }) => {
            const patient = typeof order.userId === "object" ? order.userId : null;
            const bookingAmount = items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );
            const statusLabel =
              order.status === "Cancelled"
                ? "Cancelled"
                : String(order.status || "").trim() ||
                  (String(order.paymentStatus || "").toLowerCase() === "success"
                    ? "Paid"
                    : order.paymentStatus || "Pending");
            const statusClass =
              order.status === "Cancelled"
                ? styles.badgeCancelled
                : String(order.paymentStatus || "").toLowerCase() === "success"
                ? styles.badgePaid
                : styles.badgePending;

            return (
              <article key={order._id} className={styles.orderCard}>
                <div className={styles.metaBar}>
                  <div className={styles.metaGroup}>
                    <span>BOOKED ON</span>
                    <strong>{formatDateTime(order.createdAt)}</strong>
                  </div>
                  <div className={styles.metaGroup}>
                    <span>AMOUNT</span>
                    <strong>{formatMoney(bookingAmount)}</strong>
                  </div>
                  <div className={styles.metaRight}>
                    <p>Order #{order._id.slice(-8).toUpperCase()}</p>
                    <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      marginBottom: 14,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 800,
                        color: "#0f172a",
                        fontSize: 13,
                      }}
                    >
                      <FiUser size={13} /> {patient?.name || "Patient"}
                    </span>
                    {patient?.email && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#64748b",
                          fontSize: 12,
                        }}
                      >
                        <FiMail size={12} /> {patient.email}
                      </span>
                    )}
                    {patient?.contactNo && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#64748b",
                          fontSize: 12,
                        }}
                      >
                        <FiPhone size={12} /> {patient.contactNo}
                      </span>
                    )}
                  </div>

                  <div className={styles.items}>
                    {items.map((item) => (
                      <div key={`${order._id}-${item.id}`} className={styles.itemRow}>
                        <div className={styles.itemLeft}>
                          <div className={styles.itemMeta}>
                            <p className={styles.itemName}>{item.name}</p>
                            <span className={styles.itemQty}>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className={styles.itemPrice}>
                          {formatMoney(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.status === "Cancelled" ? null : order.treatmentStartedAt ? (
                    <div
                      style={{
                        marginTop: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(15, 157, 88, 0.1)",
                        color: "#0f9d58",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <FiCheckCircle size={13} /> Treatment Started —{" "}
                      {formatDateTime(order.treatmentStartedAt)}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStartModalOrderId(order._id)}
                      style={{
                        marginTop: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 16px",
                        borderRadius: 999,
                        border: "none",
                        background: "linear-gradient(135deg, #10306b 0%, #1f49be 55%, #2981b7 100%)",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      <FiPlayCircle size={15} /> Start Treatment
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {startModalEntry && (
        <StartTreatmentModal
          order={startModalEntry.order}
          items={startModalEntry.items}
          clinicId={clinicId}
          onClose={() => setStartModalOrderId("")}
          onStarted={handleTreatmentStarted}
        />
      )}
    </div>
  );
}

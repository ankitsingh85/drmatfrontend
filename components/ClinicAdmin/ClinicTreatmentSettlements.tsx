"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { FiSearch } from "react-icons/fi";
import styles from "@/styles/Dashboard/treatmentCommissions.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";

interface SettlementRow {
  key: string;
  orderId: string;
  bookingDate: string;
  customerName: string;
  treatmentPackage: string;
  clinicName: string;
  orderStatus: string;
  clinicPayableAmount: number;
  gstAmount: number;
  adjustmentAmount: number;
  netPayableAmount: number;
  settlementStatus: "Pending" | "Settled";
  settlementDate: string | null;
  comments: string;
}

interface ClinicTreatmentSettlementsProps {
  clinicId: string;
}

const formatMoney = (value: number) => `Rs. ${(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const getOrderStatusClass = (status: string, s: typeof styles) => {
  const v = (status || "").toLowerCase();
  if (v === "cancelled") return s.statusCancelled;
  if (v === "delivered" || v === "treatment started") return s.statusActive;
  return s.statusNone;
};

export default function ClinicTreatmentSettlements({ clinicId }: ClinicTreatmentSettlementsProps) {
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const token = Cookies.get("token") || "";

  useEffect(() => {
    if (!clinicId) {
      setRows([]);
      setLoading(false);
      setError("Clinic id is missing.");
      return;
    }

    const fetchRows = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/treatment-commissions/clinic/${clinicId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load settlement details");
        }

        setRows(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setRows([]);
        setError(err?.message || "Failed to load settlement details");
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, [clinicId, token]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.customerName, row.treatmentPackage, row.orderId].join(" ").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const totalNetPayable = rows.reduce((sum, r) => sum + r.netPayableAmount, 0);
    const pending = rows.filter((r) => r.settlementStatus === "Pending").length;
    const settled = rows.filter((r) => r.settlementStatus === "Settled").length;
    return { total: rows.length, totalNetPayable, pending, settled };
  }, [rows]);

  if (loading) return <FullPageLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <FiSearch />
          <input
            className={styles.search}
            placeholder="Search by customer, treatment, or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.statStrip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Bookings</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatMoney(stats.totalNetPayable)}</div>
          <div className={styles.statLabel}>Total Net Payable</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.pending}</div>
          <div className={styles.statLabel}>Pending Settlement</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.settled}</div>
          <div className={styles.statLabel}>Settled</div>
        </div>
      </div>

      {error ? (
        <div className={styles.noData}>Error: {error}</div>
      ) : filteredRows.length === 0 ? (
        <div className={styles.noData}>
          {rows.length === 0 ? "No settlement records yet." : "No matching bookings found."}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Booking Date</th>
                <th>Customer Name</th>
                <th>Treatment Package</th>
                <th>Clinic Name</th>
                <th>Order Status</th>
                <th>Clinic Payable Amount</th>
                <th>GST Amount</th>
                <th>Adjustment Amount</th>
                <th>Net Payable Amount</th>
                <th>Settlement Status</th>
                <th>Settlement Date</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.key}>
                  <td className={styles.monoCell} title={row.orderId}>
                    #{row.orderId.slice(-8).toUpperCase()}
                  </td>
                  <td>{formatDate(row.bookingDate)}</td>
                  <td className={styles.leftCell}>
                    <div className={styles.primaryText}>{row.customerName}</div>
                  </td>
                  <td className={styles.leftCell}>{row.treatmentPackage}</td>
                  <td className={styles.leftCell}>{row.clinicName || "—"}</td>
                  <td>
                    <span className={`${styles.statusPill} ${getOrderStatusClass(row.orderStatus, styles)}`}>
                      {row.orderStatus}
                    </span>
                  </td>
                  <td className={styles.strongCell}>{formatMoney(row.clinicPayableAmount)}</td>
                  <td className={styles.mutedCell}>{formatMoney(row.gstAmount)}</td>
                  <td className={styles.mutedCell}>{formatMoney(row.adjustmentAmount)}</td>
                  <td className={styles.strongCell}>{formatMoney(row.netPayableAmount)}</td>
                  <td>
                    <span
                      className={`${styles.statusPill} ${
                        row.settlementStatus === "Settled" ? styles.statusActive : styles.statusNone
                      }`}
                    >
                      {row.settlementStatus}
                    </span>
                  </td>
                  <td>{row.settlementDate ? formatDate(row.settlementDate) : "—"}</td>
                  <td className={styles.leftCell}>{row.comments || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

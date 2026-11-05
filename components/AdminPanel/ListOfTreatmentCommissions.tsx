"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiCheckCircle, FiRefreshCw, FiSave, FiSearch } from "react-icons/fi";
import styles from "@/styles/Dashboard/treatmentCommissions.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";

interface CommissionRow {
  key: string;
  orderId: string;
  itemId: string;
  bookingDate: string;
  customerName: string;
  customerEmail?: string;
  treatmentPackage: string;
  clinicId: string;
  clinicName: string;
  saleAmount: number;
  orderStatus: string;
  clinicPayableAmount: number;
  gstAmount: number;
  adjustmentAmount: number;
  netPayableAmount: number;
  settlementStatus: "Pending" | "Settled";
  settlementDate: string | null;
  comments: string;
}

const GST_RATE = 0.18;
const round2 = (value: number) => Math.round((value || 0) * 100) / 100;

const toInputDate = (value: string | null) => (value ? value.slice(0, 10) : "");

const formatMoney = (value: number) => `Rs. ${(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const getOrderStatusClass = (status: string, s: typeof styles) => {
  const v = status.toLowerCase();
  if (v === "cancelled") return s.statusCancelled;
  if (v === "delivered" || v === "treatment started") return s.statusActive;
  return s.statusNone;
};

const ListOfTreatmentCommissions: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [settlementFilter, setSettlementFilter] = useState<"all" | "Pending" | "Settled">("all");
  const [savingKey, setSavingKey] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchRows = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await axios.get(`${API_URL}/treatment-commissions`);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch treatment commissions:", err);
      toast.error("Failed to load treatment commission data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = term
        ? [r.customerName, r.treatmentPackage, r.clinicName, r.orderId]
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;
      const matchesSettlement =
        settlementFilter === "all" ? true : r.settlementStatus === settlementFilter;
      return matchesSearch && matchesSettlement;
    });
  }, [rows, search, settlementFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, settlementFilter, itemsPerPage]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const totalSale = rows.reduce((sum, r) => sum + r.saleAmount, 0);
    const totalNetPayable = rows.reduce((sum, r) => sum + r.netPayableAmount, 0);
    const pending = rows.filter((r) => r.settlementStatus === "Pending").length;
    const settled = rows.filter((r) => r.settlementStatus === "Settled").length;
    return { total: rows.length, totalSale, totalNetPayable, pending, settled };
  }, [rows]);

  const updateRow = (key: string, patch: Partial<CommissionRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        // Live preview of the derived figures while the admin is typing —
        // the server recomputes these authoritatively on save.
        next.gstAmount = round2(next.clinicPayableAmount * GST_RATE);
        next.netPayableAmount = round2(next.clinicPayableAmount + next.gstAmount + next.adjustmentAmount);
        return next;
      })
    );
  };

  const handleSave = async (row: CommissionRow) => {
    try {
      setSavingKey(row.key);
      const res = await axios.put(
        `${API_URL}/treatment-commissions/${row.orderId}/${row.itemId}`,
        {
          clinicPayableAmount: row.clinicPayableAmount,
          adjustmentAmount: row.adjustmentAmount,
          settlementStatus: row.settlementStatus,
          settlementDate: row.settlementDate,
          comments: row.comments,
        }
      );
      setRows((prev) => prev.map((r) => (r.key === row.key ? res.data : r)));
      toast.success("Commission row saved");
    } catch (err) {
      console.error("Failed to save treatment commission:", err);
      toast.error("Failed to save row");
    } finally {
      setSavingKey("");
    }
  };

  const handleDownloadCSV = () => {
    const headerRow = [
      "Booking ID",
      "Booking Date",
      "Customer",
      "Customer Email",
      "Treatment Package",
      "Clinic",
      "Sale Amount",
      "Order Status",
      "Clinic Payable",
      "GST Amount",
      "Adjustment",
      "Net Payable",
      "Settlement Status",
      "Settlement Date",
      "Comments",
    ];

    const rowsOut = filteredRows.map((r) => [
      `#${r.orderId.slice(-8).toUpperCase()}`,
      formatDate(r.bookingDate),
      r.customerName,
      r.customerEmail || "",
      r.treatmentPackage,
      r.clinicName,
      r.saleAmount,
      r.orderStatus,
      r.clinicPayableAmount,
      r.gstAmount,
      r.adjustmentAmount,
      r.netPayableAmount,
      r.settlementStatus,
      r.settlementDate ? toInputDate(r.settlementDate) : "",
      r.comments || "",
    ]);

    const csv = [headerRow, ...rowsOut]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "treatment-commissions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className={styles.loading}>Loading treatment commission data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <FiSearch />
          <input
            className={styles.search}
            placeholder="Search by customer, treatment, or clinic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={settlementFilter}
          onChange={(e) => setSettlementFilter(e.target.value as "all" | "Pending" | "Settled")}
        >
          <option value="all">All Settlement Status</option>
          <option value="Pending">Pending</option>
          <option value="Settled">Settled</option>
        </select>
        <select
          className={styles.filterSelect}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadCSV}
        >
          Download CSV
        </button>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={() => fetchRows(true)}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? styles.spinning : ""} /> Refresh
        </button>
      </div>

      <div className={styles.statStrip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Bookings</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatMoney(stats.totalSale)}</div>
          <div className={styles.statLabel}>Total Sale Amount</div>
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

      {filteredRows.length === 0 ? (
        <div className={styles.noData}>No treatment bookings found.</div>
      ) : (
        <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.frozenCell} style={{ left: 0, width: 110, minWidth: 110 }}>
                  Booking ID
                </th>
                <th
                  className={styles.frozenCell}
                  style={{ left: 110, width: 100, minWidth: 100 }}
                >
                  Booking Date
                </th>
                <th
                  className={styles.frozenCell}
                  style={{ left: 210, width: 160, minWidth: 160 }}
                >
                  Customer
                </th>
                <th>Treatment Package</th>
                <th>Clinic</th>
                <th>Sale Amount</th>
                <th>Order Status</th>
                <th>Clinic Payable</th>
                <th>GST Amount</th>
                <th>Adjustment</th>
                <th>Net Payable</th>
                <th>Settlement Status</th>
                <th>Settlement Date</th>
                <th>Comments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.key}>
                  <td
                    className={`${styles.monoCell} ${styles.frozenCell}`}
                    title={row.orderId}
                    style={{ left: 0, width: 110, minWidth: 110 }}
                  >
                    #{row.orderId.slice(-8).toUpperCase()}
                  </td>
                  <td className={styles.frozenCell} style={{ left: 110, width: 100, minWidth: 100 }}>
                    {formatDate(row.bookingDate)}
                  </td>
                  <td
                    className={`${styles.leftCell} ${styles.frozenCell}`}
                    style={{ left: 210, width: 160, minWidth: 160 }}
                  >
                    <div className={styles.primaryText}>{row.customerName}</div>
                    {row.customerEmail && (
                      <div className={styles.secondaryText}>{row.customerEmail}</div>
                    )}
                  </td>
                  <td className={styles.leftCell}>{row.treatmentPackage}</td>
                  <td className={styles.leftCell}>{row.clinicName}</td>
                  <td className={styles.strongCell}>{formatMoney(row.saleAmount)}</td>
                  <td>
                    <span className={`${styles.statusPill} ${getOrderStatusClass(row.orderStatus, styles)}`}>
                      {row.orderStatus}
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      className={styles.numberInput}
                      value={row.clinicPayableAmount}
                      onChange={(e) =>
                        updateRow(row.key, { clinicPayableAmount: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className={styles.mutedCell}>{formatMoney(row.gstAmount)}</td>
                  <td>
                    <input
                      type="number"
                      className={styles.numberInput}
                      value={row.adjustmentAmount}
                      onChange={(e) =>
                        updateRow(row.key, { adjustmentAmount: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className={styles.strongCell}>{formatMoney(row.netPayableAmount)}</td>
                  <td>
                    <select
                      className={`${styles.statusSelect} ${
                        row.settlementStatus === "Settled" ? styles.settledSelect : styles.pendingSelect
                      }`}
                      value={row.settlementStatus}
                      onChange={(e) =>
                        updateRow(row.key, {
                          settlementStatus: e.target.value as "Pending" | "Settled",
                        })
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Settled">Settled</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={toInputDate(row.settlementDate)}
                      onChange={(e) => updateRow(row.key, { settlementDate: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Add a note..."
                      value={row.comments}
                      onChange={(e) => updateRow(row.key, { comments: e.target.value })}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={() => handleSave(row)}
                      disabled={savingKey === row.key}
                    >
                      {savingKey === row.key ? (
                        "Saving..."
                      ) : row.settlementStatus === "Settled" ? (
                        <>
                          <FiCheckCircle /> Save
                        </>
                      ) : (
                        <>
                          <FiSave /> Save
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <p className={styles.paginationInfo}>
            Showing {paginatedRows.length} of {filteredRows.length}
          </p>
          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.premiumButton}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className={styles.premiumButton}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default ListOfTreatmentCommissions;

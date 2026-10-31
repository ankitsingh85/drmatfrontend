"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiPause, FiPlay, FiRotateCcw, FiXCircle, FiDownload, FiFileText } from "react-icons/fi";
import styles from "@/styles/Dashboard/clinicSubscriptions.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

type OverrideValue = "auto" | "enabled" | "disabled";
type OverrideField =
  | "whatsappOverride"
  | "leadAccessOverride"
  | "verifiedBadgeOverride"
  | "callButtonOverride";
type SubscriptionStatus = "active" | "expired" | "cancelled" | "paused";

interface ClinicSubscriptionRow {
  clinicId: string;
  clinicName: string;
  contactNumber?: string;
  whatsapp?: string;
  whatsappOverride: OverrideValue;
  leadAccessOverride: OverrideValue;
  verifiedBadgeOverride: OverrideValue;
  callButtonOverride: OverrideValue;
  whatsappVisible: boolean;
  leadAccessVisible: boolean;
  verifiedBadgeVisible: boolean;
  callButtonVisible: boolean;
  isActive: boolean;
  subscription: {
    _id: string;
    billingCycle: "monthly" | "quarterly" | "yearly";
    amount: number;
    planAmount?: number;
    addonsAmount?: number;
    addons?: { name: string; price: number }[];
    startDate: string;
    endDate: string;
    status: SubscriptionStatus;
  } | null;
}

const formatDate = (value?: string) => (value ? String(value).slice(0, 10) : "-");

type ListOfClinicSubscriptionsProps = {
  canEdit?: boolean;
};

const ListOfClinicSubscriptions: React.FC<ListOfClinicSubscriptionsProps> = ({ canEdit = true }) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [rows, setRows] = useState<ClinicSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clinic-subscriptions/admin/all`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch clinic subscriptions:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const OVERRIDE_LABELS: Record<OverrideField, string> = {
    whatsappOverride: "WhatsApp visibility",
    leadAccessOverride: "Lead access",
    verifiedBadgeOverride: "Verified badge",
    callButtonOverride: "Call button",
  };

  const handleOverrideChange = async (
    clinicId: string,
    field: OverrideField,
    value: OverrideValue
  ) => {
    setUpdatingId(clinicId);
    try {
      const res = await fetch(`${API_URL}/clinic-subscriptions/admin/override/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update override");

      setRows((prev) =>
        prev.map((row) => (row.clinicId === clinicId ? { ...row, [field]: value } : row))
      );
      toast.success(`${OVERRIDE_LABELS[field]} updated`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update override");
    } finally {
      setUpdatingId("");
    }
  };

  // Shared helper for the pause/resume/cancel/reactivate action buttons —
  // they all hit a PUT /admin/<action>/:subscriptionId route and replace
  // the row's subscription with the server's updated copy.
  const runSubscriptionAction = async (
    row: ClinicSubscriptionRow,
    action: "pause" | "resume" | "cancel" | "reactivate",
    successMessage: string
  ) => {
    if (!row.subscription) return;
    setUpdatingId(row.clinicId);
    try {
      const res = await fetch(
        `${API_URL}/clinic-subscriptions/admin/${action}/${row.subscription._id}`,
        { method: "PUT" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${action} subscription`);

      setRows((prev) =>
        prev.map((r) =>
          r.clinicId === row.clinicId
            ? {
                ...r,
                isActive: data.status === "active" && new Date(data.endDate).getTime() >= Date.now(),
                subscription: { ...r.subscription!, status: data.status, endDate: data.endDate },
              }
            : r
        )
      );
      toast.success(successMessage);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} subscription`);
    } finally {
      setUpdatingId("");
    }
  };

  const handleCancelSubscription = async (row: ClinicSubscriptionRow) => {
    if (!(await confirmDialog("Cancel this clinic's subscription?", { danger: true }))) return;
    await runSubscriptionAction(row, "cancel", "Subscription cancelled");
  };

  const handlePauseSubscription = async (row: ClinicSubscriptionRow) => {
    if (!(await confirmDialog("Pause this clinic's subscription? Plan benefits turn off until resumed."))) return;
    await runSubscriptionAction(row, "pause", "Subscription paused");
  };

  const handleResumeSubscription = async (row: ClinicSubscriptionRow) => {
    await runSubscriptionAction(row, "resume", "Subscription resumed — paused days added back to the expiry date");
  };

  const handleReactivateSubscription = async (row: ClinicSubscriptionRow) => {
    if (!(await confirmDialog("Reactivate this subscription? Its remaining paid period will be restored."))) return;
    await runSubscriptionAction(row, "reactivate", "Subscription reactivated");
  };

  const renderOverrideSelect = (row: ClinicSubscriptionRow, field: OverrideField) => (
    <select
      className={styles.overrideSelect}
      value={row[field]}
      disabled={!canEdit || updatingId === row.clinicId}
      onChange={(e) => handleOverrideChange(row.clinicId, field, e.target.value as OverrideValue)}
    >
      <option value="auto">Auto (follows plan)</option>
      <option value="enabled">Force On</option>
      <option value="disabled">Force Off</option>
    </select>
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.clinicName?.toLowerCase().includes(term) ||
        row.contactNumber?.toLowerCase().includes(term)
    );
  }, [rows, search]);

  // "Expired" only means the paid period actually lapsed — a cancelled
  // subscription whose endDate is still in the future reads as "Cancelled"
  // so the admin knows a reactivate is still possible.
  const planStatusLabel = (row: ClinicSubscriptionRow): string => {
    if (!row.subscription) return "No Plan";
    const status = row.subscription.status;
    if (status === "paused") return "Paused";
    if (status === "cancelled") {
      return new Date(row.subscription.endDate).getTime() >= Date.now() ? "Cancelled" : "Expired";
    }
    return row.isActive ? "Active" : "Expired";
  };

  const statusPillClass = (label: string) => {
    switch (label) {
      case "Active":
        return styles.statusActive;
      case "Paused":
        return styles.statusPaused;
      case "Cancelled":
        return styles.statusCancelled;
      case "Expired":
        return styles.statusExpired;
      default:
        return styles.statusNone;
    }
  };

  const stats = useMemo(() => {
    const total = rows.length;
    let active = 0;
    let paused = 0;
    let cancelled = 0;
    let expired = 0;
    let noPlan = 0;
    rows.forEach((row) => {
      const label = planStatusLabel(row);
      if (label === "Active") active += 1;
      else if (label === "Paused") paused += 1;
      else if (label === "Cancelled") cancelled += 1;
      else if (label === "Expired") expired += 1;
      else noPlan += 1;
    });
    return { total, active, paused, cancelled, expired, noPlan };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const handleDownloadCSV = () => {
    const rows2 = [
      [
        "Clinic Name",
        "Contact Number",
        "Plan Status",
        "Billing Cycle",
        "Amount",
        "Add-ons",
        "Start Date",
        "Expiry Date",
        "Verified Badge",
        "Lead Access",
        "WhatsApp Button",
        "Call Button",
      ],
      ...filteredRows.map((row) => [
        row.clinicName,
        row.contactNumber || "-",
        planStatusLabel(row),
        row.subscription?.billingCycle || "-",
        row.subscription ? `₹${row.subscription.amount}` : "-",
        row.subscription?.addons?.length
          ? row.subscription.addons.map((a) => `${a.name} (₹${a.price})`).join("; ")
          : "-",
        formatDate(row.subscription?.startDate),
        formatDate(row.subscription?.endDate),
        row.verifiedBadgeOverride,
        row.leadAccessOverride,
        row.whatsappOverride,
        row.callButtonOverride,
      ]),
    ];

    const csv = rows2
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clinic-subscriptions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rowsHtml = filteredRows
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.clinicName)}</td>
          <td>${escapeHtml(row.contactNumber || "-")}</td>
          <td>${escapeHtml(planStatusLabel(row))}</td>
          <td>${escapeHtml(row.subscription?.billingCycle || "-")}</td>
          <td>${escapeHtml(row.subscription ? `₹${row.subscription.amount}` : "-")}</td>
          <td>${escapeHtml(formatDate(row.subscription?.startDate))}</td>
          <td>${escapeHtml(formatDate(row.subscription?.endDate))}</td>
          <td>${escapeHtml(row.verifiedBadgeOverride)}</td>
          <td>${escapeHtml(row.leadAccessOverride)}</td>
          <td>${escapeHtml(row.whatsappOverride)}</td>
          <td>${escapeHtml(row.callButtonOverride)}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Clinic Subscriptions</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Clinic Subscriptions</h2>
          <table>
            <thead>
              <tr>
                <th>Clinic Name</th>
                <th>Contact Number</th>
                <th>Plan Status</th>
                <th>Billing Cycle</th>
                <th>Amount</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Verified Badge</th>
                <th>Lead Access</th>
                <th>WhatsApp Button</th>
                <th>Call Button</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  if (loading) return <p className={styles.loading}>Loading clinic subscriptions...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.statStrip}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Clinics</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.paused}</div>
          <div className={styles.statLabel}>Paused</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.cancelled}</div>
          <div className={styles.statLabel}>Cancelled</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.expired}</div>
          <div className={styles.statLabel}>Expired</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.noPlan}</div>
          <div className={styles.statLabel}>No Plan</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by clinic name or contact number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className={styles.premiumButton} onClick={handleDownloadCSV}>
          <FiDownload /> Download CSV
        </button>
        <button type="button" className={styles.premiumButton} onClick={handleDownloadPDF}>
          <FiFileText /> Download PDF
        </button>
      </div>

      {filteredRows.length === 0 ? (
        <p className={styles.loading}>No clinics found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Clinic Name</th>
                <th>Contact Number</th>
                <th>Plan Status</th>
                <th>Billing Cycle</th>
                <th>Amount</th>
                <th>Add-ons</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Verified Badge</th>
                <th>Lead Access</th>
                <th>WhatsApp Button</th>
                <th>Call Button</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const statusLabel = planStatusLabel(row);
                const isBusy = updatingId === row.clinicId;
                const status = row.subscription?.status;

                return (
                  <tr key={row.clinicId}>
                    <td className={styles.clinicName}>{row.clinicName}</td>
                    <td>{row.contactNumber || "-"}</td>
                    <td>
                      <span className={`${styles.statusPill} ${statusPillClass(statusLabel)}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{row.subscription?.billingCycle || "-"}</td>
                    <td>{row.subscription ? `₹${row.subscription.amount}` : "-"}</td>
                    <td>
                      {row.subscription?.addons && row.subscription.addons.length > 0 ? (
                        <span
                          title={row.subscription.addons.map((a) => `${a.name} (₹${a.price})`).join(", ")}
                        >
                          {row.subscription.addons.length} add-on
                          {row.subscription.addons.length === 1 ? "" : "s"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{formatDate(row.subscription?.startDate)}</td>
                    <td>{formatDate(row.subscription?.endDate)}</td>
                    <td>{renderOverrideSelect(row, "verifiedBadgeOverride")}</td>
                    <td>{renderOverrideSelect(row, "leadAccessOverride")}</td>
                    <td>{renderOverrideSelect(row, "whatsappOverride")}</td>
                    <td>{renderOverrideSelect(row, "callButtonOverride")}</td>
                    <td>
                      {!canEdit || !row.subscription ? (
                        <span className={styles.noActions}>-</span>
                      ) : (
                        <div className={styles.actions}>
                          {status === "active" && (
                            <>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.pauseBtn}`}
                                onClick={() => handlePauseSubscription(row)}
                                disabled={isBusy}
                              >
                                <FiPause /> Pause
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                onClick={() => handleCancelSubscription(row)}
                                disabled={isBusy}
                              >
                                <FiXCircle /> Cancel
                              </button>
                            </>
                          )}
                          {status === "paused" && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.resumeBtn}`}
                              onClick={() => handleResumeSubscription(row)}
                              disabled={isBusy}
                            >
                              <FiPlay /> Resume
                            </button>
                          )}
                          {status === "cancelled" && statusLabel === "Cancelled" && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.reactivateBtn}`}
                              onClick={() => handleReactivateSubscription(row)}
                              disabled={isBusy}
                            >
                              <FiRotateCcw /> Reactivate
                            </button>
                          )}
                          {statusLabel === "Expired" && <span className={styles.noActions}>-</span>}
                        </div>
                      )}
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
};

export default ListOfClinicSubscriptions;

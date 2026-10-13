"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

type OverrideValue = "auto" | "enabled" | "disabled";
type OverrideField = "whatsappOverride" | "leadAccessOverride" | "verifiedBadgeOverride";

interface ClinicSubscriptionRow {
  clinicId: string;
  clinicName: string;
  contactNumber?: string;
  whatsapp?: string;
  whatsappOverride: OverrideValue;
  leadAccessOverride: OverrideValue;
  verifiedBadgeOverride: OverrideValue;
  whatsappVisible: boolean;
  leadAccessVisible: boolean;
  verifiedBadgeVisible: boolean;
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
    status: "active" | "expired" | "cancelled";
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

  const handleCancelSubscription = async (row: ClinicSubscriptionRow) => {
    if (!row.subscription) return;
    if (!(await confirmDialog("Cancel this clinic's active subscription?", { danger: true }))) return;

    setUpdatingId(row.clinicId);
    try {
      const res = await fetch(
        `${API_URL}/clinic-subscriptions/admin/cancel/${row.subscription._id}`,
        { method: "PUT" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel subscription");

      setRows((prev) =>
        prev.map((r) =>
          r.clinicId === row.clinicId
            ? { ...r, isActive: false, subscription: { ...r.subscription!, status: "cancelled" } }
            : r
        )
      );
      toast.success("Subscription cancelled");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel subscription");
    } finally {
      setUpdatingId("");
    }
  };

  const renderOverrideSelect = (row: ClinicSubscriptionRow, field: OverrideField) => (
    <select
      value={row[field]}
      disabled={!canEdit || updatingId === row.clinicId}
      onChange={(e) => handleOverrideChange(row.clinicId, field, e.target.value as OverrideValue)}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid #d1d5db",
      }}
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

  if (loading) return <p className={styles.loading}>Loading clinic subscriptions...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by clinic name or contact number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.clinicId}>
                  <td>{row.clinicName}</td>
                  <td>{row.contactNumber || "-"}</td>
                  <td>
                    <span
                      className={row.isActive ? styles.toggleSwitch + " " + styles.toggleSwitchOn : styles.toggleSwitch}
                      style={{ cursor: "default", display: "inline-flex" }}
                    >
                      {row.isActive ? "Active" : row.subscription ? "Expired" : "No Plan"}
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
                  <td>
                    {canEdit && row.isActive && (
                      <button
                        type="button"
                        onClick={() => handleCancelSubscription(row)}
                        disabled={updatingId === row.clinicId}
                        className={styles.deleteBtn}
                      >
                        Cancel Plan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListOfClinicSubscriptions;

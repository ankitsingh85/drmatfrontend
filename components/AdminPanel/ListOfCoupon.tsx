"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import createStyles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";

interface Coupon {
  _id: string;
  couponId: string;
  couponName: string;
  couponCode: string;
  discountType: "percent" | "amount";
  discountValue: number;
  startDate?: string;
  expiryDate?: string;
  isActive: boolean;
  usageLimit?: number;
  perCustomerLimit?: number;
  serviceSection: string;
  subService?: string;
  cartValue?: number;
  newUserOnly: boolean;
  maxDiscount?: number;
  isPublic: boolean;
  timesUsed: number;
  createdAt: string;
}

type SubServiceOption = { id: string; name: string };

const SERVICE_SECTIONS: { value: string; label: string; endpoint: string }[] = [
  { value: "All", label: "All (site-wide)", endpoint: "" },
  { value: "Product", label: "Product", endpoint: "categories" },
  { value: "Treatment", label: "Treatment", endpoint: "service-categories" },
  { value: "Course", label: "Course", endpoint: "course-types" },
  { value: "Training", label: "Training", endpoint: "training-types" },
  { value: "Clinic", label: "Clinic", endpoint: "clinic-categories" },
  { value: "B2B Product", label: "B2B Product", endpoint: "b2b-categories" },
  { value: "Online Consultation", label: "Online Consultation", endpoint: "" },
];

const formatDate = (value?: string) => (value ? String(value).slice(0, 10) : "-");

type ListOfCouponProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const ListOfCoupon: React.FC<ListOfCouponProps> = ({ canEdit = true, canDelete = true }) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editForm, setEditForm] = useState<Partial<Coupon>>({});
  const [editSubServiceOptions, setEditSubServiceOptions] = useState<SubServiceOption[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [viewCoupon, setViewCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/coupons`);
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(
      (c) =>
        c.couponName.toLowerCase().includes(q) ||
        c.couponCode.toLowerCase().includes(q) ||
        c.couponId.toLowerCase().includes(q)
    );
  }, [coupons, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / itemsPerPage));
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCoupons.slice(start, start + itemsPerPage);
  }, [filteredCoupons, currentPage, itemsPerPage]);

  const bulkSelection = useBulkSelection(paginatedCoupons, (c) => c._id);

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Delete this coupon?", { danger: true }))) return;
    try {
      const res = await fetch(`${API_URL}/coupons/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to delete coupon");
      toast.success("Coupon deleted successfully");
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`${API_URL}/coupons/${coupon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update coupon");
      setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? data : c)));
      toast.success(`Coupon ${data.isActive ? "enabled" : "disabled"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update coupon");
    }
  };

  const handleTogglePublic = async (coupon: Coupon) => {
    try {
      const res = await fetch(`${API_URL}/coupons/${coupon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !coupon.isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update coupon");
      setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? data : c)));
      toast.success(data.isPublic ? "Coupon is now shown to users in their cart" : "Coupon hidden from users' cart");
    } catch (err: any) {
      toast.error(err.message || "Failed to update coupon");
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditForm({
      ...coupon,
      startDate: coupon.startDate ? String(coupon.startDate).slice(0, 10) : "",
      expiryDate: coupon.expiryDate ? String(coupon.expiryDate).slice(0, 10) : "",
    } as any);
    setIsEditing(true);
  };

  useEffect(() => {
    const section = SERVICE_SECTIONS.find((s) => s.value === editForm.serviceSection);
    setEditSubServiceOptions([]);
    if (!section || !section.endpoint || !isEditing) return;

    const fetchSubServices = async () => {
      try {
        const res = await fetch(`${API_URL}/${section.endpoint}`);
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data?.data || [];
        const normalized = raw
          .map((item: any) => ({ id: item._id || item.id, name: item.name }))
          .filter((item: SubServiceOption) => item.id && item.name);
        setEditSubServiceOptions(normalized);
      } catch {
        setEditSubServiceOptions([]);
      }
    };

    fetchSubServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editForm.serviceSection, isEditing]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "serviceSection" ? { subService: "" } : {}),
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCoupon(null);
    setEditForm({});
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      const res = await fetch(`${API_URL}/coupons/${editingCoupon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update coupon");

      toast.success("Coupon updated successfully");
      setCoupons((prev) => prev.map((c) => (c._id === editingCoupon._id ? data : c)));
      handleCancelEdit();
    } catch (err: any) {
      toast.error(err.message || "Failed to update coupon");
    }
  };

  const discountLabel = (c: Coupon) =>
    c.discountType === "percent" ? `${c.discountValue}%` : `₹${c.discountValue}`;

  const handleDownloadCSV = () => {
    const rows = [
      [
        "Coupon ID",
        "Coupon Name",
        "Coupon Code",
        "Discount Type",
        "Amount",
        "Start Date",
        "Expiry Date",
        "Status",
        "No. of Uses",
        "Times Used",
        "Customer No. Allocation",
        "Service Section",
        "Sub-service",
        "Cart Value",
        "New User Only",
        "Maximum Coupon Discount",
        "Public (Shown in Cart)",
        "Created",
      ],
      ...filteredCoupons.map((c) => [
        c.couponId,
        c.couponName,
        c.couponCode,
        c.discountType,
        discountLabel(c),
        formatDate(c.startDate),
        formatDate(c.expiryDate),
        c.isActive ? "Active" : "Disabled",
        c.usageLimit !== undefined ? String(c.usageLimit) : "Unlimited",
        String(c.timesUsed ?? 0),
        c.perCustomerLimit !== undefined ? String(c.perCustomerLimit) : "Unlimited",
        c.serviceSection,
        c.subService || "-",
        c.cartValue !== undefined ? String(c.cartValue) : "-",
        c.newUserOnly ? "Yes" : "No",
        c.maxDiscount !== undefined ? String(c.maxDiscount) : "-",
        c.isPublic ? "Yes" : "No",
        formatDate(c.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "coupons.csv";
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

    const rows = filteredCoupons
      .map(
        (c) => `<tr>
          <td>${escapeHtml(c.couponId)}</td>
          <td>${escapeHtml(c.couponName)}</td>
          <td>${escapeHtml(c.couponCode)}</td>
          <td>${escapeHtml(c.discountType)}</td>
          <td>${escapeHtml(discountLabel(c))}</td>
          <td>${escapeHtml(formatDate(c.startDate))}</td>
          <td>${escapeHtml(formatDate(c.expiryDate))}</td>
          <td>${c.isActive ? "Active" : "Disabled"}</td>
          <td>${escapeHtml(c.usageLimit !== undefined ? String(c.usageLimit) : "Unlimited")}</td>
          <td>${escapeHtml(String(c.timesUsed ?? 0))}</td>
          <td>${escapeHtml(c.perCustomerLimit !== undefined ? String(c.perCustomerLimit) : "Unlimited")}</td>
          <td>${escapeHtml(c.serviceSection)}</td>
          <td>${escapeHtml(c.subService || "-")}</td>
          <td>${escapeHtml(c.cartValue !== undefined ? String(c.cartValue) : "-")}</td>
          <td>${c.newUserOnly ? "Yes" : "No"}</td>
          <td>${escapeHtml(c.maxDiscount !== undefined ? String(c.maxDiscount) : "-")}</td>
          <td>${c.isPublic ? "Yes" : "No"}</td>
          <td>${escapeHtml(formatDate(c.createdAt))}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Coupons</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Coupons</h2>
          <table>
            <thead>
              <tr>
                <th>Coupon ID</th>
                <th>Coupon Name</th>
                <th>Coupon Code</th>
                <th>Discount Type</th>
                <th>Amount</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>No. of Uses</th>
                <th>Times Used</th>
                <th>Customer No. Allocation</th>
                <th>Service Section</th>
                <th>Sub-service</th>
                <th>Cart Value</th>
                <th>New User Only</th>
                <th>Maximum Coupon Discount</th>
                <th>Public (Shown in Cart)</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  if (loading) return <p className={styles.loading}>Loading coupons...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by coupon name, code or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${styles.filter} ${styles.pageFilter}`}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button type="button" className={styles.premiumButton} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button type="button" className={styles.premiumButton} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      <BulkSelectBar
        endpointPath="coupons"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="coupons"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setCoupons((prev) => prev.filter((c) => !deletedIds.includes(c._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />

      {filteredCoupons.length === 0 ? (
        <p className={styles.loading}>No coupons found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {canDelete && (
                  <th>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = bulkSelection.isSomeSelected;
                      }}
                      onChange={bulkSelection.toggleAll}
                      aria-label="Select all coupons on this page"
                    />
                  </th>
                )}
                <th>Coupon ID</th>
                <th>Coupon Name</th>
                <th>Coupon Code</th>
                <th>Discount Type</th>
                <th>Amount</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>No. of Uses</th>
                <th>Times Used</th>
                <th>Customer No. Allocation</th>
                <th>Service Section</th>
                <th>Sub-service</th>
                <th>Cart Value</th>
                <th>New User Only</th>
                <th>Maximum Coupon Discount</th>
                <th>Public</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCoupons.map((c) => (
                <tr key={c._id}>
                  {canDelete && (
                    <td>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(c._id)}
                        onChange={() => bulkSelection.toggle(c._id)}
                        aria-label={`Select ${c.couponName}`}
                      />
                    </td>
                  )}
                  <td className={styles.id}>{c.couponId}</td>
                  <td>{c.couponName}</td>
                  <td>{c.couponCode}</td>
                  <td>{c.discountType === "percent" ? "Percent" : "Amount"}</td>
                  <td>{discountLabel(c)}</td>
                  <td>{formatDate(c.startDate)}</td>
                  <td>{formatDate(c.expiryDate)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => canEdit && handleToggleActive(c)}
                      className={c.isActive ? styles.toggleSwitch + " " + styles.toggleSwitchOn : styles.toggleSwitch}
                      disabled={!canEdit}
                      style={{ cursor: canEdit ? "pointer" : "default" }}
                    >
                      {c.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td>{c.usageLimit !== undefined ? c.usageLimit : "Unlimited"}</td>
                  <td>{c.timesUsed ?? 0}</td>
                  <td>{c.perCustomerLimit !== undefined ? c.perCustomerLimit : "Unlimited"}</td>
                  <td>{c.serviceSection}</td>
                  <td>{c.subService || "-"}</td>
                  <td>{c.cartValue !== undefined ? `₹${c.cartValue}` : "-"}</td>
                  <td>{c.newUserOnly ? "Yes" : "No"}</td>
                  <td>{c.maxDiscount !== undefined ? `₹${c.maxDiscount}` : "-"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => canEdit && handleTogglePublic(c)}
                      className={c.isPublic ? styles.toggleSwitch + " " + styles.toggleSwitchOn : styles.toggleSwitch}
                      disabled={!canEdit}
                      style={{ cursor: canEdit ? "pointer" : "default" }}
                    >
                      {c.isPublic ? "Shown" : "Hidden"}
                    </button>
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className={styles.editBtn} onClick={() => setViewCoupon(c)}>
                        View
                      </button>
                      {canEdit && (
                        <button type="button" className={styles.editBtn} onClick={() => handleEdit(c)}>
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button type="button" className={styles.deleteBtn} onClick={() => handleDelete(c._id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span style={{ alignSelf: "center" }}>
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

      {viewCoupon && (
        <div className={styles.modalOverlay} onClick={() => setViewCoupon(null)}>
          <div className={styles.viewModal} onClick={(e) => e.stopPropagation()}>
            <h2>{viewCoupon.couponName}</h2>
            <div className={styles.viewGrid}>
              <p><strong>Coupon ID:</strong> {viewCoupon.couponId}</p>
              <p><strong>Coupon Code:</strong> {viewCoupon.couponCode}</p>
              <p><strong>Discount Type:</strong> {viewCoupon.discountType}</p>
              <p><strong>Amount:</strong> {discountLabel(viewCoupon)}</p>
              <p><strong>Start Date:</strong> {formatDate(viewCoupon.startDate)}</p>
              <p><strong>Expiry Date:</strong> {formatDate(viewCoupon.expiryDate)}</p>
              <p><strong>Status:</strong> {viewCoupon.isActive ? "Active" : "Disabled"}</p>
              <p><strong>No. of Uses:</strong> {viewCoupon.usageLimit ?? "Unlimited"}</p>
              <p><strong>Times Used:</strong> {viewCoupon.timesUsed ?? 0}</p>
              <p><strong>Customer No. Allocation:</strong> {viewCoupon.perCustomerLimit ?? "Unlimited"}</p>
              <p><strong>Service Section:</strong> {viewCoupon.serviceSection}</p>
              <p><strong>Sub-service:</strong> {viewCoupon.subService || "-"}</p>
              <p><strong>Cart Value:</strong> {viewCoupon.cartValue !== undefined ? `₹${viewCoupon.cartValue}` : "-"}</p>
              <p><strong>New User Only:</strong> {viewCoupon.newUserOnly ? "Yes" : "No"}</p>
              <p><strong>Maximum Coupon Discount:</strong> {viewCoupon.maxDiscount !== undefined ? `₹${viewCoupon.maxDiscount}` : "-"}</p>
              <p><strong>Shown to Users in Cart:</strong> {viewCoupon.isPublic ? "Yes" : "No"}</p>
              <p><strong>Created:</strong> {formatDate(viewCoupon.createdAt)}</p>
            </div>
            <button className={styles.closeBtn} onClick={() => setViewCoupon(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {isEditing && editingCoupon && (
        <div className={createStyles.container} style={{ marginTop: 40 }}>
          <h1 className={createStyles.heading}>Edit Coupon</h1>

          <form className={createStyles.form} onSubmit={handleUpdate}>
            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Coupon Details</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Coupon Name</label>
                <input
                  className={createStyles.input}
                  name="couponName"
                  value={editForm.couponName || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Coupon Code</label>
                <input
                  className={createStyles.input}
                  name="couponCode"
                  value={editForm.couponCode || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>
            </div>

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Discount</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Discount Type</label>
                <select
                  className={createStyles.select}
                  name="discountType"
                  value={editForm.discountType || "percent"}
                  onChange={handleEditChange}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="amount">Flat Amount (₹)</option>
                </select>
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Amount</label>
                <input
                  type="number"
                  min="0"
                  className={createStyles.input}
                  name="discountValue"
                  value={editForm.discountValue ?? ""}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Maximum Coupon Discount</label>
                <input
                  type="number"
                  min="0"
                  className={createStyles.input}
                  name="maxDiscount"
                  value={editForm.maxDiscount ?? ""}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Validity</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Start Date</label>
                <input
                  type="date"
                  className={createStyles.input}
                  name="startDate"
                  value={(editForm.startDate as string) || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Expiry Date</label>
                <input
                  type="date"
                  className={createStyles.input}
                  name="expiryDate"
                  value={(editForm.expiryDate as string) || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editForm.isActive ?? true}
                    onChange={handleEditChange}
                  />
                  Coupon Active
                </label>
              </div>
            </div>

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Usage Limits</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>No. of Uses</label>
                <input
                  type="number"
                  min="0"
                  className={createStyles.input}
                  name="usageLimit"
                  value={editForm.usageLimit ?? ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Customer No. Allocation</label>
                <input
                  type="number"
                  min="0"
                  className={createStyles.input}
                  name="perCustomerLimit"
                  value={editForm.perCustomerLimit ?? ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Cart Value</label>
                <input
                  type="number"
                  min="0"
                  className={createStyles.input}
                  name="cartValue"
                  value={editForm.cartValue ?? ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="newUserOnly"
                    checked={editForm.newUserOnly ?? false}
                    onChange={handleEditChange}
                  />
                  Applicable to new users only
                </label>
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={editForm.isPublic ?? false}
                    onChange={handleEditChange}
                  />
                  Show this coupon to users in their cart (advertised offer)
                </label>
              </div>
            </div>

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Applies To</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Service Section</label>
                <select
                  className={createStyles.select}
                  name="serviceSection"
                  value={editForm.serviceSection || ""}
                  onChange={handleEditChange}
                >
                  <option value="">Select service section</option>
                  {SERVICE_SECTIONS.map((section) => (
                    <option key={section.value} value={section.value}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Sub-service</label>
                <select
                  className={createStyles.select}
                  name="subService"
                  value={editForm.subService || ""}
                  onChange={handleEditChange}
                  disabled={!editForm.serviceSection}
                >
                  <option value="">All / Not specific</option>
                  {editSubServiceOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={createStyles.submitBtn}>
                Update Coupon
              </button>
              <button type="button" className={createStyles.submitBtn} onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ListOfCoupon;

"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofuser.module.css";
import editStyles from "@/styles/Dashboard/createUser.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";

interface B2BUser {
  _id: string;
  b2bUserId: string;
  name: string;
  contactPerson: string;
  email?: string;
  contactNo: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: "active" | "inactive";
  createdAt: string;
}

type ListOfB2BUserProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

export default function ListOfB2BUser({
  canEdit = true,
  canDelete = true,
}: ListOfB2BUserProps) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [users, setUsers] = useState<B2BUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewingUser, setViewingUser] = useState<B2BUser | null>(null);
  const [editingUser, setEditingUser] = useState<B2BUser | null>(null);
  const [editForm, setEditForm] = useState<Partial<B2BUser>>({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/b2b-users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch B2B users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.b2bUserId?.toLowerCase().includes(q) ||
        user.name?.toLowerCase().includes(q) ||
        user.contactPerson?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.contactNo?.includes(q) ||
        user.gstNumber?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const bulkSelection = useBulkSelection(paginatedUsers, (user) => user._id);

  const handleDownloadCSV = () => {
    const rows = [
      [
        "B2B User ID",
        "Name",
        "Contact Person",
        "Email",
        "Contact",
        "GST",
        "Address",
        "City",
        "State",
        "Pincode",
        "Status",
        "Created At",
      ],
      ...filteredUsers.map((user) => [
        user.b2bUserId,
        user.name,
        user.contactPerson,
        user.email || "",
        user.contactNo,
        user.gstNumber || "",
        user.address || "-",
        user.city || "-",
        user.state || "-",
        user.pincode || "-",
        user.status,
        new Date(user.createdAt).toLocaleString(),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "b2b-users.csv";
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

    const rows = filteredUsers
      .map(
        (user) => `<tr>
          <td>${escapeHtml(user.b2bUserId || "-")}</td>
          <td>${escapeHtml(user.name || "-")}</td>
          <td>${escapeHtml(user.contactPerson || "-")}</td>
          <td>${escapeHtml(user.email || "-")}</td>
          <td>${escapeHtml(user.contactNo || "-")}</td>
          <td>${escapeHtml(user.gstNumber || "-")}</td>
          <td>${escapeHtml(user.address || "-")}</td>
          <td>${escapeHtml(user.city || "-")}</td>
          <td>${escapeHtml(user.state || "-")}</td>
          <td>${escapeHtml(user.pincode || "-")}</td>
          <td>${escapeHtml(user.status || "-")}</td>
          <td>${escapeHtml(user.createdAt ? String(user.createdAt).slice(0, 10) : "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>B2B Users List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>B2B Users List</h2>
          <table>
            <thead>
              <tr>
                <th>B2B User ID</th>
                <th>Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Contact</th>
                <th>GST Number</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Pincode</th>
                <th>Status</th>
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

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Delete this B2B user?", { danger: true }))) return;
    const res = await fetch(`${API_URL}/b2b-users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete B2B user");
      return;
    }
    setUsers((prev) => prev.filter((user) => user._id !== id));
  };

  const handleEdit = (user: B2BUser) => {
    setEditingUser(user);
    setEditForm(user);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "contactNo"
        ? value.replace(/\D/g, "").slice(0, 10)
        : name === "pincode"
        ? value.replace(/\D/g, "").slice(0, 6)
        : name === "gstNumber"
        ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15)
        : value;

    setEditForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await fetch(`${API_URL}/b2b-users/${editingUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Failed to update B2B user");
      return;
    }

    setUsers((prev) => prev.map((user) => (user._id === data._id ? data : user)));
    setEditingUser(null);
    setEditForm({});
    toast.success("B2B user updated successfully");
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>B2B Users</h1>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by ID, name, email, contact or GST"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filter}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

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
        endpointPath="b2b-users"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="B2B users"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setUsers((prev) => prev.filter((user) => !deletedIds.includes(user._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />

      <div className={`${styles.tableWrap} ${bulkStyles.tableScroll}`}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              {canDelete && (
                <th className={bulkStyles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={bulkSelection.isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = bulkSelection.isSomeSelected;
                    }}
                    onChange={bulkSelection.toggleAll}
                    aria-label="Select all B2B users on this page"
                  />
                </th>
              )}
              <th>B2B User ID</th>
              <th>Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Contact</th>
              <th>GST Number</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>Pincode</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user._id} className={styles.tableRow}>
                {canDelete && (
                  <td className={bulkStyles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isSelected(user._id)}
                      onChange={() => bulkSelection.toggle(user._id)}
                      aria-label={`Select ${user.name}`}
                    />
                  </td>
                )}
                <td>{user.b2bUserId}</td>
                <td>{user.name}</td>
                <td>{user.contactPerson}</td>
                <td>{user.email || "-"}</td>
                <td>{user.contactNo}</td>
                <td>{user.gstNumber || "-"}</td>
                <td>{user.address || "-"}</td>
                <td>{user.city || "-"}</td>
                <td>{user.state || "-"}</td>
                <td>{user.pincode || "-"}</td>
                <td>{user.status}</td>
                <td>{user.createdAt ? String(user.createdAt).slice(0, 10) : "-"}</td>
                <td className={styles.actions}>
                  <TableActions
                    onView={() => setViewingUser(user)}
                    onEdit={() => handleEdit(user)}
                    onDelete={() => handleDelete(user._id)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr className={styles.tableRow}>
                <td colSpan={canDelete ? 14 : 13}>No B2B users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0 }}>
          Showing {paginatedUsers.length} of {filteredUsers.length}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === 1 ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span style={{ alignSelf: "center" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === totalPages ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {viewingUser && (
        <div className={editStyles.container} style={{ marginTop: 40 }}>
          <h1 className={editStyles.heading}>B2B User Details</h1>
          <div className={editStyles.section}>
            <p><strong>ID:</strong> {viewingUser.b2bUserId}</p>
            <p><strong>Name:</strong> {viewingUser.name}</p>
            <p><strong>Contact Person:</strong> {viewingUser.contactPerson}</p>
            <p><strong>Email:</strong> {viewingUser.email || "-"}</p>
            <p><strong>Contact:</strong> {viewingUser.contactNo}</p>
            <p><strong>GST:</strong> {viewingUser.gstNumber || "-"}</p>
            <p><strong>Status:</strong> {viewingUser.status}</p>
            <p><strong>Address:</strong> {viewingUser.address || "-"}</p>
            <p><strong>City:</strong> {viewingUser.city || "-"}</p>
            <p><strong>State:</strong> {viewingUser.state || "-"}</p>
            <p><strong>Pincode:</strong> {viewingUser.pincode || "-"}</p>
          </div>
          <button
            type="button"
            className={editStyles.submitBtn}
            onClick={() => setViewingUser(null)}
          >
            Close
          </button>
        </div>
      )}

      {editingUser && (
        <div className={editStyles.container} style={{ marginTop: 40 }}>
          <h1 className={editStyles.heading}>Edit B2B User</h1>
          <form className={editStyles.form} onSubmit={handleEditSubmit}>
            <div className={editStyles.section}>
              <input
                className={editStyles.readonlyInput}
                value={editingUser.b2bUserId}
                disabled
              />
              {[
                ["name", "Name"],
                ["contactPerson", "Contact Person"],
                ["email", "Email"],
                ["contactNo", "Contact No."],
                ["gstNumber", "GST Number"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "Pincode"],
              ].map(([name, placeholder]) => (
                <input
                  key={name}
                  className={editStyles.input}
                  name={name}
                  value={String(editForm[name as keyof B2BUser] || "")}
                  onChange={handleEditChange}
                  placeholder={placeholder}
                />
              ))}
              <select
                className={editStyles.select}
                name="status"
                value={editForm.status || "active"}
                onChange={handleEditChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <textarea
                className={editStyles.textarea}
                name="address"
                value={editForm.address || ""}
                onChange={handleEditChange}
                placeholder="Address"
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={editStyles.submitBtn}>
                Update B2B User
              </button>
              <button
                type="button"
                className={editStyles.submitBtn}
                onClick={() => {
                  setEditingUser(null);
                  setEditForm({});
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

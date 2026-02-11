"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import styles from "@/styles/Dashboard/listofuser.module.css";
import editStyles from "@/styles/Dashboard/createUser.module.css";

interface User {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  contactNo?: string;
  address?: string;
  createdAt: string;
}

export default function ListOfUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /* SEARCH & FILTER */
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* EDIT STATE */
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<
    Partial<User & { password?: string }>
  >({});

  const premiumButtonStyle: React.CSSProperties = {
    border: "1px solid #d6d6d6",
    borderRadius: 10,
    padding: "9px 14px",
    background: "linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
  };

  const premiumButtonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  /* FILTER */
  const filteredUsers = useMemo(() => {
    let data = [...users];

    if (search) {
      data = data.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.patientId.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      data = data.filter((u) => {
        const created = new Date(u.createdAt);
        const diff = now.getTime() - created.getTime();
        return dateFilter === "7"
          ? diff <= 7 * 24 * 60 * 60 * 1000
          : diff <= 30 * 24 * 60 * 60 * 1000;
      });
    }

    return data;
  }, [users, search, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["Patient ID", "Name", "Email", "Contact", "Address", "Created At"],
      ...filteredUsers.map((u) => [
        u.patientId,
        u.name,
        u.email,
        u.contactNo || "",
        u.address || "",
        new Date(u.createdAt).toLocaleString(),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      alert("Unable to open print window. Please allow popups.");
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
        (u) => `<tr>
          <td>${escapeHtml(u.patientId)}</td>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.contactNo || "-")}</td>
          <td>${escapeHtml(new Date(u.createdAt).toLocaleString())}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Users List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Users List</h2>
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Created At</th>
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

  /* DELETE */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  /* EDIT */
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      contactNo: user.contactNo || "",
      address: user.address || "",
      password: "", // 🔒 never prefill
    });
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload: any = {
      name: editForm.name,
      email: editForm.email,
      contactNo: editForm.contactNo,
      address: editForm.address,
    };

    // ✅ optional password update
    if (editForm.password && editForm.password.trim() !== "") {
      payload.password = editForm.password;
    }

    await fetch(`${API_URL}/users/${editingUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert("✅ User updated successfully");
    setIsEditing(false);
    setEditingUser(null);
    setEditForm({});
    fetchUsers();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingUser(null);
    setEditForm({});
  };

  if (loading) return <p className={styles.loading}>Loading users…</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Users</h1>

      {/* CONTROLS */}
      <div className={styles.controls}>
        <input
          className={styles.controlsInput}
          placeholder="Search by ID, Name or Email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.controlsSelect}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Users</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
        <select
          className={styles.controlsSelect}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      {/* TABLE (UNCHANGED) */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u._id} className={styles.tableRow}>
                <td>{u.patientId}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.contactNo || "-"}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEdit(u)}
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleDelete(u._id)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr className={styles.tableRow}>
                <td colSpan={6}>No users found.</td>
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
            style={{
              ...premiumButtonStyle,
              ...(currentPage === 1 ? premiumButtonDisabledStyle : {}),
            }}
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
            style={{
              ...premiumButtonStyle,
              ...(currentPage === totalPages ? premiumButtonDisabledStyle : {}),
            }}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* INLINE EDIT FORM */}
      {isEditing && editingUser && (
        <div className={editStyles.container} style={{ marginTop: 40 }}>
          <h1 className={editStyles.heading}>Edit User</h1>

          <form className={editStyles.form} onSubmit={handleEditSubmit}>
            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>User Information</h2>

              <input
                className={editStyles.input}
                value={editingUser.patientId}
                disabled
              />

              <input
                name="name"
                value={editForm.name || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Name"
              />

              <input
                name="email"
                value={editForm.email || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Email"
              />

              <input
                name="contactNo"
                value={editForm.contactNo || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Contact Number"
              />

              <textarea
                name="address"
                value={editForm.address || ""}
                onChange={handleEditChange}
                className={editStyles.textarea}
                placeholder="Address"
              />
            </div>

            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Update Password</h2>
              <input
                type="password"
                name="password"
                value={editForm.password || ""}
                onChange={handleEditChange}
                className={editStyles.input}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={editStyles.submitBtn}>
                Update User
              </button>
              <button
                type="button"
                className={editStyles.submitBtn}
                onClick={handleCancelEdit}
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

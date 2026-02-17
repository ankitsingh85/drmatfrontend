"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofadmin.module.css";
import createStyles from "@/styles/Dashboard/adminpages.module.css";

interface Admin {
  _id: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "superadmin" | "manager";
  createdAt: string;
}

export default function ListOfAdmin() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔍 FILTER STATE */
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ✏️ EDIT STATE */
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Admin & { password?: string }>
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
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/admins`);
      const data = await res.json();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTERED ADMINS ================= */
  const filteredAdmins = useMemo(() => {
    let data = [...admins];

    if (search) {
      data = data.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.empId.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      data = data.filter((a) => a.role === roleFilter);
    }

    return data;
  }, [admins, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAdmins.slice(start, start + itemsPerPage);
  }, [filteredAdmins, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["Admin ID", "Name", "Email", "Phone", "Role"],
      ...filteredAdmins.map((a) => [a.empId, a.name, a.email, a.phone, a.role]),
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
    link.download = "admins.csv";
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

    const rows = filteredAdmins
      .map(
        (a) => `<tr>
          <td>${escapeHtml(a.empId)}</td>
          <td>${escapeHtml(a.name)}</td>
          <td>${escapeHtml(a.email)}</td>
          <td>${escapeHtml(a.phone || "-")}</td>
          <td>${escapeHtml(a.role)}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Admins List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Admins List</h2>
          <table>
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
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

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    await fetch(`${API_URL}/admins/${id}`, { method: "DELETE" });
    fetchAdmins();
  };

  /* ================= EDIT ================= */
  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditForm({
      empId: admin.empId,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      password: "",
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    const payload: any = { ...editForm };
    if (!payload.password) delete payload.password;

    await fetch(`${API_URL}/admins/${editingAdmin._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setEditingAdmin(null);
    setEditForm({});
    fetchAdmins();
    alert("✅ Admin updated successfully");
  };

  if (loading) {
    return <div className={styles.loading}>Loading admins…</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>List of Admin</h1>

      {/* 🔍 SEARCH & FILTER */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name, email or Admin ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filter}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
          <option value="manager">Manager</option>
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
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>

      {/* ================= TABLE ================= */}
      {filteredAdmins.length === 0 ? (
        <div className={styles.noData}>No admins found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact No.</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.phone}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[admin.role]}`}>
                      {admin.role}
                    </span>
                  </td>

                  {/* ✅ ICON ACTIONS */}
                  <td className={styles.actions}>
                    <button
                      className={styles.iconBtn}
                      title="Edit"
                      onClick={() => handleEdit(admin)}
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.iconBtn}
                      title="Delete"
                      onClick={() => handleDelete(admin._id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filteredAdmins.length > 0 && (
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
            Showing {paginatedAdmins.length} of {filteredAdmins.length}
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
      )}

      {/* ================= INLINE EDIT FORM ================= */}
      {editingAdmin && (
        <div className={createStyles.container} style={{ marginTop: 40 }}>
          <h1 className={createStyles.heading}>Edit Admin</h1>

          <form className={createStyles.form} onSubmit={handleEditSubmit}>
            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Admin Information</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Employee ID</label>
                <input
                  value={editForm.empId || ""}
                  disabled
                  className={createStyles.input}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Name</label>
                <input
                  name="name"
                  value={editForm.name || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Email</label>
                <input
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Phone</label>
                <input
                  name="phone"
                  value={editForm.phone || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Role</label>
                <select
                  name="role"
                  value={editForm.role || "admin"}
                  onChange={handleEditChange}
                  className={createStyles.select}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Update Password</h2>
              <div className={createStyles.field}>
                <label className={createStyles.label}>
                  New Password (optional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={editForm.password || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                />
              </div>
            </div>

            <button type="submit" className={createStyles.submitBtn}>
              Update Admin
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

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

  /* ✏️ EDIT STATE */
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Admin & { password?: string }>
  >({});

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
      <h1 className={styles.heading}>Admin Directory</h1>

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
      </div>

      {/* ================= TABLE ================= */}
      {filteredAdmins.length === 0 ? (
        <div className={styles.noData}>No admins found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact No.</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td className={styles.id}>{admin.empId}</td>
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

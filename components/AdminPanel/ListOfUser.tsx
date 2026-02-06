"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import styles from "@/styles/Dashboard/listofuser.module.css";
import editStyles from "@/styles/Dashboard/createuser.module.css";

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

  /* EDIT STATE */
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<
    Partial<User & { password?: string }>
  >({});

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
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id} className={styles.tableRow}>
                <td>{u.patientId}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.contactNo || "-"}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
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
          </tbody>
        </table>
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

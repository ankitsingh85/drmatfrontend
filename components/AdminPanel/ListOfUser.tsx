"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import styles from "@/styles/Dashboard/listofuser.module.css";

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

  /* VIEW MODAL */
  const [viewUser, setViewUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/users`);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  /* SEARCH + FILTER */
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
    fetchUsers();
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

      {/* TABLE */}
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
                    onClick={() => setViewUser(u)}
                  >
                    👁
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

      {/* VIEW MODAL */}
      {viewUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>User Details</h3>

            <p className={styles.modalText}>
              <b>Patient ID:</b> {viewUser.patientId}
            </p>
            <p className={styles.modalText}>
              <b>Name:</b> {viewUser.name}
            </p>
            <p className={styles.modalText}>
              <b>Email:</b> {viewUser.email}
            </p>
            <p className={styles.modalText}>
              <b>Contact:</b> {viewUser.contactNo || "-"}
            </p>
            <p className={styles.modalText}>
              <b>Address:</b> {viewUser.address || "-"}
            </p>
            <p className={styles.modalText}>
              <b>Created At:</b>{" "}
              {new Date(viewUser.createdAt).toLocaleString()}
            </p>

            <button
              className={styles.modalBtn}
              onClick={() => setViewUser(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

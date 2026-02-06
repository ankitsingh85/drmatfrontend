"use client";
import { API_URL } from "@/config/api";

import React, { useState } from "react";
import styles from "@/styles/Dashboard/adminpages.module.css";
import MobileNavbar from "../Layout/MobileNavbar";

// const API_URL =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export default function CreateAdmin() {
  /* ================= AUTO USER ID ================= */
  const [userId] = useState(`ADM-${Date.now().toString().slice(-6)}`);

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accessLevel: "Admin", // Admin | SuperAdmin | Manager
  });
  console.log();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ================= HANDLER ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // ✅ REQUIRED FIELD CHECK (MUST BE FIRST)
  if (
    !form.name.trim() ||
    !form.email.trim() ||
    !form.password.trim()
  ) {
    setError("Name, Email and Password are required");
    return;
  }

  // ✅ PASSWORD MATCH CHECK
  if (form.password !== form.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone?.trim(),
    password: form.password,
    accessLevel: form.accessLevel.toLowerCase(),
  };

  console.log("ADMIN PAYLOAD 👉", payload); // 🧪 DEBUG (keep once)

  try {
    const res = await fetch(`${API_URL}/admins`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    setSuccess("✅ Admin account created successfully");
    setError("");

    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      accessLevel: "Admin",
    });
  } catch (err: any) {
    setError(err.message || "Failed to create admin");
  }
};

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Admin Management</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ================= LOGIN / PROFILE ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Login / Profile</h3>

          <div className={styles.field}>
            <label className={styles.label}>User ID</label>
            <input className={styles.readonlyInput} value={userId} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contact No.</label>
            <input
              className={styles.input}
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= PASSWORD ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Security</h3>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirm Password</label>
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ================= ACCESS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Access Level</h3>

          <div className={styles.field}>
            <label className={styles.label}>Grant Access</label>
            <select
              className={styles.select}
              name="accessLevel"
              value={form.accessLevel}
              onChange={handleChange}
            >
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button className={styles.submitBtn} type="submit">
          Save Admin
        </button>
      </form>

      <MobileNavbar />
    </div>
  );
}

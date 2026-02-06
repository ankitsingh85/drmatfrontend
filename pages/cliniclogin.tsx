"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import styles from "@/styles/cliniclogin.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { API_URL } from "@/config/api";

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export default function ClinicLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/clinics/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Login failed");

      // ⭐ FIX: Cookies with proper flags for HTTPS
      const cookieOptions = {
        expires: 1,
        secure: true,
        sameSite: "None" as const,
      };

      Cookies.set("token", data.token, cookieOptions);
      Cookies.set("role", "clinic", cookieOptions);
      Cookies.set("clinicId", data.clinic.id, cookieOptions);

      router.replace("/ClinicDashboard");
      window.location.href = "/ClinicDashboard"; // Force redirect
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Clinic Login</h2>
        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="clinic@example.com"
            />
          </label>

          <label className={styles.label}>
            Password
            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";
import { API_URL } from "@/config/api";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "@/styles/adminlogin.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (!res.ok) throw new Error(data.message || "Login failed");
    if (!data.token) throw new Error("Token missing from server");

    // ✅ STORE TOKEN
    Cookies.set("token", data.token, { path: "/", sameSite: "lax" });
    Cookies.set("role", data.role.toLowerCase(), { path: "/", sameSite: "lax" });

    // ✅ REDIRECT
    if (data.role.toLowerCase() === "superadmin") {
      router.replace("/Dashboard");
    } else if (data.role.toLowerCase() === "admin") {
      router.replace("/adminDashboard");
    } else {
      router.replace("/adminlogin");
    }
  } catch (err: any) {
    setError(err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.heading}>Admin Login</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            required
            className={styles.input}
          />

          {/* Password */}
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.input}
            />
            <span
              className={styles.eyeIcon}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          {/* Error */}
          {error && <p className={styles.error}>{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

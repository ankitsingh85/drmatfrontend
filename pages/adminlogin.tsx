"use client";

import { API_URL } from "@/config/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import { FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import styles from "@/styles/adminlogin.module.css";

export default function AdminLogin() {
  const router = useRouter();

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
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (!data.token) throw new Error("Token missing from server");

      Cookies.set("token", data.token, { path: "/", sameSite: "lax" });
      Cookies.set("role", data.role.toLowerCase(), { path: "/", sameSite: "lax" });

      const displayName =
        data.admin?.name ||
        data.admin?.fullName ||
        data.user?.name ||
        data.user?.fullName ||
        data.name ||
        data.fullName ||
        data.username ||
        formData.email.split("@")[0];

      Cookies.set("adminName", displayName, { path: "/", sameSite: "lax" });

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
    <div className={styles.page}>
      <div className={styles.logoTop}>
        <Link href="/home" className={styles.logoLink} aria-label="Go to home page">
          <Image
            src="/logo.jpeg"
            alt="Website logo"
            width={170}
            height={52}
            className={styles.websiteLogo}
            priority
            unoptimized
          />
        </Link>
      </div>

      <div className={styles.splitCard}>
        {/* Left: Image */}
        <div className={styles.imagePane}>
          <div className={styles.imageWrap}>
            <Image
              src="/login.jpg"
              alt="Admin login"
              fill
              className={styles.heroImage}
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              unoptimized
            />
          </div>
        </div>

        {/* Right: Form */}
        <div className={styles.formPane}>
          <div className={styles.formCard}>
            <h2 className={styles.title}>
              <span className={styles.titleUnderline}>Login</span> as a Admin 
            </h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Email */}
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
                <span className={styles.inputIcon} aria-hidden>
                  <FiUser size={18} />
                </span>
              </div>

              {/* Password */}
              <div className={styles.inputWrapper}>
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
                  className={styles.inputIcon}
                  onClick={() => setShowPassword((v) => !v)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setShowPassword((v) => !v)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </span>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" disabled={loading} className={styles.button}>
                {loading ? "Logging in..." : "LOGIN"}
              </button>
            </form>

            <Link href="/home" className={styles.homeLink}>
              get back to home page?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

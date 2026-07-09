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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

const [forgotMode, setForgotMode] = useState(false);
const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    password: "",
  });
const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  /* ================= LOGIN ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/auth/admin/login`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.token) {
        throw new Error("Token missing");
      }

      Cookies.set(
        "token",

        data.token,

        {
          path: "/",
          sameSite: "lax",
        },
      );

      Cookies.set(
        "role",

        data.role.toLowerCase(),

        {
          path: "/",
          sameSite: "lax",
        },
      );

      Cookies.set(
        "adminName",

        data.admin?.name || formData.email.split("@")[0],

        {
          path: "/",
          sameSite: "lax",
        },
      );

      if (data.role.toLowerCase() === "superadmin") {
        router.replace("/Dashboard");
      } else {
        router.replace("/adminDashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORGOT PASSWORD ================= */

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/admins/forgot-password/send-otp`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({ email: forgotData.email }),
        },
      );

      const data = await res.json().catch(() => ({
        message: "Server response error",
      }));

      if (!res.ok) {
        setError(data.message);

        return;
      }

      setSuccess(data.message || "Verification OTP sent to your email");

      setForgotStep("reset");
    } catch (error: any) {
      setError(error.message || "Unable to send reset OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/admins/forgot-password/reset`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(forgotData),
        },
      );

      const data = await res.json().catch(() => ({
        message: "Server response error",
      }));

      if (!res.ok) {
        setError(data.message);

        return;
      }

      setSuccess("Password changed successfully. Please login.");

      setForgotData({
        email: "",

        otp: "",

        password: "",
      });

      setTimeout(() => {
        setForgotMode(false);
        setForgotStep("email");
      }, 1000);
    } catch (error: any) {
      setError(error.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setError("");
    setSuccess("");
    setForgotMode(true);
    setForgotStep("email");
    setForgotData({
      email: formData.email,
      otp: "",
      password: "",
    });
  };

  const backToLogin = () => {
    setError("");
    setSuccess("");
    setForgotMode(false);
    setForgotStep("email");
  };

  return (
    <div className={styles.page}>
      <div className={styles.logoTop}>
        <Link href="/home">
          <Image
            src="/logo.jpeg"
            alt="logo"
            width={170}
            height={52}
            unoptimized
          />
        </Link>
      </div>

      <div className={styles.splitCard}>
        <div className={styles.imagePane}>
          <div className={styles.imageWrap}>
            <Image
              src="/login.jpg"
              alt="login"
              fill
              className={styles.heroImage}
              unoptimized
            />
          </div>
        </div>

        <div className={styles.formPane}>
          <div className={styles.formCard}>
            <h2 className={styles.title}>
              {forgotMode ? "Forgot Password" : "Login as Admin"}
            </h2>

            {forgotMode ? (
              <form
                className={styles.form}
                onSubmit={
                  forgotStep === "email" ? handleSendResetOtp : handleResetPassword
                }
              >
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Enter Email"
                  value={forgotData.email}
                  onChange={(e) =>
                    setForgotData({
                      ...forgotData,

                      email: e.target.value,
                    })
                  }
                  required
                  disabled={forgotStep === "reset"}
                />

                {forgotStep === "reset" && (
                  <>
                    <input
                      className={styles.input}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={forgotData.otp}
                      onChange={(e) =>
                        setForgotData({
                          ...forgotData,

                          otp: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      required
                    />

                    <input
                      className={styles.input}
                      type="password"
                      placeholder="New Password"
                      value={forgotData.password}
                      onChange={(e) =>
                        setForgotData({
                          ...forgotData,

                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </>
                )}

                <button className={styles.button} disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : forgotStep === "email"
                      ? "Send OTP"
                      : "Update Password"}
                </button>

                <p
                  className={styles.homeLink}
                  onClick={backToLogin}
                >
                  Back to Login
                </p>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />

                  <span className={styles.inputIcon}>
                    <FiUser />
                  </span>
                </div>

                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter Password"
                    value={formData.password}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />

                  <span
                    className={styles.inputIcon}
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowPassword(!showPassword)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setShowPassword(!showPassword);
                      }
                    }}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>

                <button className={styles.button} disabled={loading}>
                  {loading ? "Logging..." : "LOGIN"}
                </button>

                <p
                  className={styles.homeLink}
                  onClick={openForgotPassword}
                >
                  Forgot Password?
                </p>
              </form>
            )}

            {error && <p className={styles.error}>{error}</p>}

            {success && <p className={styles.success}>{success}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

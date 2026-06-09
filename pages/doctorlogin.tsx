"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import Image from "next/image";
import Topbar from "@/components/Layout/Topbar";
import styles from "@/styles/components/forms/MobileLogin.module.css";
import illustration from "../public/login.jpg";
import otpIllustration from "../public/otp.jpg";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";

type LoginStep = "mobile" | "otp";

export default function DoctorLogin() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [step, setStep] = useState<LoginStep>("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    secure:
      typeof window !== "undefined" && window.location.protocol === "https:",
  };

  const normalizeMobile = () => {
    const normalized = mobile.replace(/\D/g, "");
    if (normalized.length !== 10) {
      alert("Please enter a valid 10 digit mobile number");
      return null;
    }
    return normalized;
  };

  const clearExistingSession = () => {
    [
      "token",
      "role",
      "username",
      "email",
      "contactNo",
      "doctorId",
      "userId",
      "clinicId",
      "clinicName",
      "profileImage",
      "location",
      "cartScope",
    ].forEach((key) => {
      Cookies.remove(key, { path: "/" });
    });

    ["doctorId", "userId", "clinicId", "profileImage", "cartScope"].forEach(
      (key) => {
        localStorage.removeItem(key);
      },
    );
  };

  const completeLogin = (data: any, fallbackMobile: string) => {
    const doctor = data?.doctor || {};
    const doctorId = String(doctor.id || doctor._id || "").trim();
    const displayName = String(
      doctor.name ||
        [doctor.title, doctor.firstName, doctor.lastName]
          .filter(Boolean)
          .join(" ") ||
        "Doctor",
    ).trim();
    const email = String(doctor.email || "")
      .trim()
      .toLowerCase();
    const contactNo = String(
      doctor.contactNo || doctor.phone || fallbackMobile || "",
    )
      .replace(/\D/g, "")
      .trim();
    const cartScope = `doctor:${doctorId || email || contactNo || fallbackMobile}`;
    const profileImage = resolveMediaUrl(doctor.profileImage) || doctor.profileImage || "";

    clearExistingSession();

    Cookies.set("token", data.token, cookieOptions);
    Cookies.set("role", "doctor", cookieOptions);
    Cookies.set("username", displayName, cookieOptions);
    Cookies.set("email", email, cookieOptions);
    Cookies.set("contactNo", contactNo || fallbackMobile, cookieOptions);
    Cookies.set("doctorId", doctorId, cookieOptions);
    Cookies.set("cartScope", cartScope, cookieOptions);
    if (profileImage) {
      Cookies.set("profileImage", profileImage, cookieOptions);
    }

    localStorage.setItem("doctorId", doctorId);
    localStorage.setItem("cartScope", cartScope);
    if (profileImage) {
      localStorage.setItem("profileImage", profileImage);
    }

    window.dispatchEvent(new CustomEvent("user-logged-in"));
    window.location.replace("/home");
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
  e?.preventDefault();

  const normalizedMobile = normalizeMobile();
  if (!normalizedMobile) return;

  setLoading(true);
  setError("");

  try {
    const res = await fetch(`${API_URL}/doctors/send-login-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactNo: normalizedMobile,
      }),
    });

    const data = await res.json();

    // ❌ NOT REGISTERED → STOP HERE
    if (!res.ok || data?.exists === false) {
      setError("Doctor is not registered");
      return;
    }
    // ✅ REGISTERED → GO TO OTP
    setOtp("");
    setOtpSessionId(data.sessionId || "");
    setStep("otp");

  } catch (err) {
    setError("Something went wrong");
  } finally {
    setLoading(false);
  }
};

  const handleConfirmOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otpSessionId) {
      alert("Please request OTP again");
      return;
    }

    const normalizedMobile = normalizeMobile();
    if (!normalizedMobile) return;

    setLoading(true);
    try {
      const verifyRes = await fetch(`${API_URL}/doctors/verify-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: otpSessionId,
          otp,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData?.message || "Invalid OTP");
      }

      const res = await fetch(`${API_URL}/doctors/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNo: normalizedMobile,
          otpSessionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        completeLogin(data, normalizedMobile);
        return;
      }

      if (res.status === 404 || data?.message === "Doctor is not registered") {
        setError("Doctor is not registered");
        setStep("mobile");
        setOtp("");
        return;
      }

      throw new Error(data?.message || "Login failed");
    } catch (err: any) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        <div className={styles.splitCard}>
          <div className={styles.imagePane}>
            <Image
              src={step === "otp" ? otpIllustration : illustration}
              alt="Doctor login"
              className={styles.heroImage}
              priority
            />
          </div>

          <div className={styles.formPane}>
            <div className={styles.formCard}>
              {step !== "mobile" && (
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => {
                    setStep("mobile");
                    setOtp("");
                    setOtpSessionId("");
                  }}
                >
                  {"<"}
                </button>
              )}

              {step === "mobile" && (
                <>
                  <h1 className={styles.title}>Doctor Sign in</h1>
                  <p className={styles.subtitle}>
                    Enter your registered 10 digit mobile number.
                  </p>

                  <form onSubmit={handleSendOtp}>
                    <div className={styles.mobileRow}>
                      <span className={styles.countryCode}>+91</span>
                      <input
                        className={styles.mobileInput}
                        placeholder="Mobile Number"
                        value={mobile}
                        maxLength={10}
                        inputMode="numeric"
                        autoFocus
                        onChange={(e) => {
                          setMobile(e.target.value.replace(/\D/g, ""));
                          setError("");
                        }}
                      />
                    </div>
                    {error && (
                      <p style={{ color: "red", marginTop: "8px" }}>{error}</p>
                    )}
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? "Sending..." : "Get Verification Code"}
                    </button>
                  </form>
                </>
              )}

              {step === "otp" && (
                <>
                  <h2 className={styles.modalTitle}>Verify mobile number</h2>
                  <p className={styles.modalText}>
                    Enter the OTP sent to your registered mobile number.
                  </p>
                  <form onSubmit={handleConfirmOtp}>
                    <input
                      className={styles.otpInput}
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="______"
                      value={otp}
                      autoFocus
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ""))
                      }
                    />
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={loading}
                    >
                      {loading ? "Please wait..." : "Confirm OTP"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

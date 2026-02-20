"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import Image from "next/image";
import Topbar from "@/components/Layout/Topbar";
import styles from "@/styles/components/forms/MobileLogin.module.css";
import illustration from "../public/login.jpg";
import registerIllustration from "../public/register.jpg";
import otpIllustration from "../public/otp.jpg";
import { API_URL } from "@/config/api";

export default function Login() {
  const router = useRouter();
  const nextPath = (router.query?.next as string) || "/home";

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"mobile" | "otp" | "profile">("mobile");
  const [loading, setLoading] = useState(false);

  const completeLogin = (data: any, fallbackMobile: string) => {
    const cookieOptions = {
      path: "/",
      sameSite: "lax" as const,
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    };

    Cookies.set("token", data.token, cookieOptions);
    Cookies.set("email", data.user.email || "", cookieOptions);
    Cookies.set("username", data.user.name || "", cookieOptions);
    Cookies.set("contactNo", data.user.contactNo || fallbackMobile, cookieOptions);
    Cookies.set("role", "user", cookieOptions);
    const userId = String(data.user?.id || data.user?._id || "");
    Cookies.set("userId", userId, cookieOptions);
    localStorage.setItem("userId", userId);

    window.dispatchEvent(new CustomEvent("user-logged-in"));
    window.location.replace(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
  };

  const validateMobile = () => {
    const normalized = mobile.replace(/\D/g, "");
    if (normalized.length !== 10) {
      alert("Please enter a valid 10 digit mobile number");
      return null;
    }
    return normalized;
  };

  const handleSendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateMobile()) return;
    setOtp("");
    setStep("otp");
  };

  const handleConfirmOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp !== "1234") {
      alert("Invalid OTP. Use 1234");
      return;
    }

    const normalizedMobile = validateMobile();
    if (!normalizedMobile) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/user/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNo: normalizedMobile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        completeLogin(data, normalizedMobile);
        return;
      }

      if (data?.message === "Name and email are required") {
        setStep("profile");
        return;
      }

      throw new Error(data?.message || "Login failed");
    } catch (err: any) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedMobile = validateMobile();
    if (!normalizedMobile) return;

    if (!name.trim() || !email.trim()) {
      alert("Name and email are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/user/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNo: normalizedMobile,
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      completeLogin(data, normalizedMobile);
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
              src={step === "otp" ? otpIllustration : step === "profile" ? registerIllustration : illustration}
              alt="Login"
              className={styles.heroImage}
              priority
            />
          </div>

          <div className={styles.formPane}>
            <div className={styles.formCard}>
              {step !== "mobile" && (
                <button className={styles.backBtn} onClick={() => setStep(step === "profile" ? "otp" : "mobile")}>
                  ←
                </button>
              )}

              {step === "mobile" && (
                <>
                  <h1 className={styles.title}>Sign in to continue</h1>
                  <p className={styles.subtitle}>Enter 10 digit mobile no.</p>

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
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>

                    <button type="submit" className={styles.primaryBtn}>
                      Get Verification Code
                    </button>
                  </form>
                </>
              )}

              {step === "otp" && (
                <>
                  <h2 className={styles.modalTitle}>Verify mobile number</h2>
                  <p className={styles.modalText}>Enter OTP (for now use 1234)</p>
                  <form onSubmit={handleConfirmOtp}>
                    <input
                      className={styles.otpInput}
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="____"
                      value={otp}
                      autoFocus
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? "Please wait..." : "Confirm OTP"}
                    </button>
                  </form>
                </>
              )}

              {step === "profile" && (
                <>
                  <h2 className={styles.modalTitle}>Add Your Information</h2>
                  <form onSubmit={handleContinue}>
                    <input
                      className={styles.textInput}
                      placeholder="Full Name"
                      value={name}
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                    />
                    <input
                      className={styles.textInput}
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? "Please wait..." : "Continue"}
                    </button>
                  </form>
                </>
              )}

              <p className={styles.terms}>
                By proceeding, you consent to share your information with Dr.Dermat and agree to privacy policy and terms of service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

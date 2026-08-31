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
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";

export default function BusinessLogin() {
  const router = useRouter();
  const toast = useToast();
  const explicitNextPath = router.query?.next as string | undefined;
  const nextPath = explicitNextPath || "/home";

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<
    "mobile" | "otp" | "profile" | "pending" | "rejected"
  >("mobile");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    secure: typeof window !== "undefined" && window.location.protocol === "https:",
    // Business sessions (clinic/doctor/b2buser) should stay signed in until
    // explicit logout, matching the 30d JWT expiry in authToken.ts.
    expires: 30,
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
      "b2bUserId",
      "profileImage",
      "location",
      "cartScope",
    ].forEach((key) => {
      Cookies.remove(key, { path: "/" });
    });

    ["doctorId", "userId", "clinicId", "b2bUserId", "profileImage", "cartScope"].forEach(
      (key) => {
        localStorage.removeItem(key);
      }
    );
  };

  const completeDoctorLogin = (data: any, fallbackMobile: string) => {
    const doctor = data?.doctor || {};
    const doctorId = String(doctor.id || doctor._id || "").trim();
    const displayName = String(
      doctor.name ||
        [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
        "Doctor"
    ).trim();
    const email = String(doctor.email || "").trim().toLowerCase();
    const contactNo = String(doctor.contactNo || doctor.phone || fallbackMobile || "")
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
    const target = explicitNextPath
      ? explicitNextPath.startsWith("/")
        ? explicitNextPath
        : `/${explicitNextPath}`
      : "/DoctorDashboard";
    window.location.replace(target);
  };

  const completeClinicLogin = (data: any, fallbackMobile: string) => {
    clearExistingSession();

    const clinicName = data?.clinic?.clinicName || "";
    const id = String(data?.clinic?.id || data?.clinic?._id || "");
    const clinicEmail = data?.clinic?.email || "";
    const contactNo =
      data?.clinic?.contactNo || data?.clinic?.contactNumber || fallbackMobile;
    const profileImage =
      resolveMediaUrl(data?.clinic?.profileImage || data?.clinic?.clinicLogo) ||
      data?.clinic?.profileImage ||
      data?.clinic?.clinicLogo ||
      "";

    Cookies.set("token", data.token, cookieOptions);
    Cookies.set("role", "clinic", cookieOptions);
    Cookies.set("clinicId", id, cookieOptions);
    Cookies.set("clinicName", clinicName, cookieOptions);
    Cookies.set("username", clinicName, cookieOptions);
    Cookies.set("email", clinicEmail, cookieOptions);
    Cookies.set("contactNo", contactNo, cookieOptions);
    Cookies.set("cartScope", `clinic:${id || clinicEmail || contactNo}`, cookieOptions);
    if (profileImage) {
      Cookies.set("profileImage", profileImage, cookieOptions);
    }

    localStorage.setItem("clinicId", id);
    localStorage.setItem("cartScope", `clinic:${id || clinicEmail || contactNo}`);
    if (profileImage) {
      localStorage.setItem("profileImage", profileImage);
    }

    window.dispatchEvent(new CustomEvent("user-logged-in"));
    const target = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    window.location.replace(target === "/home" ? "/ClinicDashboard" : target);
  };

  const completeB2BUserLogin = (data: any, fallbackMobile: string) => {
    const b2bUser = data?.b2bUser || {};
    const id = String(b2bUser.id || b2bUser._id || "").trim();
    const name = String(b2bUser.name || "Business User").trim();
    const email = String(b2bUser.email || "").trim().toLowerCase();
    const contactNo = String(b2bUser.contactNo || fallbackMobile || "")
      .replace(/\D/g, "")
      .trim();
    const cartScope = `b2buser:${id || email || contactNo || fallbackMobile}`;

    clearExistingSession();

    Cookies.set("token", data.token, cookieOptions);
    Cookies.set("role", "b2buser", cookieOptions);
    Cookies.set("username", name, cookieOptions);
    Cookies.set("email", email, cookieOptions);
    Cookies.set("contactNo", contactNo || fallbackMobile, cookieOptions);
    Cookies.set("b2bUserId", id, cookieOptions);
    Cookies.set("cartScope", cartScope, cookieOptions);

    localStorage.setItem("b2bUserId", id);
    localStorage.setItem("cartScope", cartScope);

    window.dispatchEvent(new CustomEvent("user-logged-in"));
    const target = explicitNextPath
      ? explicitNextPath.startsWith("/")
        ? explicitNextPath
        : `/${explicitNextPath}`
      : "/home";
    window.location.replace(target);
  };

  const completeLogin = (data: any, fallbackMobile: string) => {
    if (data?.role === "doctor") {
      completeDoctorLogin(data, fallbackMobile);
      return;
    }
    if (data?.role === "b2buser") {
      completeB2BUserLogin(data, fallbackMobile);
      return;
    }
    completeClinicLogin(data, fallbackMobile);
  };

  const validateMobile = () => {
    const normalized = mobile.replace(/\D/g, "");
    if (normalized.length !== 10) {
      toast.error("Please enter a valid 10 digit mobile number");
      return null;
    }
    return normalized;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedMobile = validateMobile();
    if (!normalizedMobile) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/business-auth/send-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactNo: normalizedMobile }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Unable to send OTP");

      setOtp("");
      setOtpSessionId(data.sessionId || "");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otpSessionId) {
      toast.error("Please request OTP again");
      return;
    }

    const normalizedMobile = validateMobile();
    if (!normalizedMobile) return;

    setLoading(true);
    try {
      const verifyRes = await fetch(`${API_URL}/business-auth/verify-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: otpSessionId, otp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData?.message || "Invalid OTP");
      }

      const res = await fetch(`${API_URL}/business-auth/mobile-login`, {
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

      if (data?.needsProfile) {
        setStep("profile");
        return;
      }

      if (data?.pendingApproval) {
        setStatusMessage(data?.message || "");
        setStep("pending");
        return;
      }

      if (data?.rejected) {
        setStatusMessage(data?.message || "");
        setStep("rejected");
        return;
      }

      throw new Error(data?.message || "Login failed");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedMobile = validateMobile();
    if (!normalizedMobile) return;

    if (!name.trim() || !address.trim()) {
      toast.error("Name and address are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/business-auth/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNo: normalizedMobile,
          otpSessionId,
          name: name.trim(),
          email: email.trim(),
          address: address.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.pendingApproval) {
          setStatusMessage(data?.message || "");
          setStep("pending");
          return;
        }
        if (data?.rejected) {
          setStatusMessage(data?.message || "");
          setStep("rejected");
          return;
        }
        throw new Error(data?.message || "Login failed");
      }

      completeLogin(data, normalizedMobile);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
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
              alt="Business login"
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
                    if (step !== "profile") setOtpSessionId("");
                    setStep(step === "profile" ? "otp" : "mobile");
                  }}
                >
                  {"<"}
                </button>
              )}

              {step === "mobile" && (
                <>
                  <h1 className={styles.title}>Business Sign in</h1>
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

                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? "Sending..." : "Get Verification Code"}
                    </button>
                  </form>
                </>
              )}

              {step === "otp" && (
                <>
                  <h2 className={styles.modalTitle}>Verify mobile number</h2>
                  <p className={styles.modalText}>Enter the OTP sent to your mobile number</p>
                  <form onSubmit={handleConfirmOtp}>
                    <input
                      className={styles.otpInput}
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="______"
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

              {step === "pending" && (
                <>
                  <h2 className={styles.modalTitle}>Registration submitted</h2>
                  <p className={styles.modalText}>
                    {statusMessage ||
                      "Your registration is pending admin approval. You'll receive an email once it's reviewed."}
                  </p>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => {
                      setStep("mobile");
                      setMobile("");
                      setOtp("");
                      setOtpSessionId("");
                    }}
                  >
                    Back to Sign in
                  </button>
                </>
              )}

              {step === "rejected" && (
                <>
                  <h2 className={styles.modalTitle}>Registration not approved</h2>
                  <p className={styles.modalText}>
                    {statusMessage || "Your registration was not approved by the admin."}
                  </p>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => {
                      setStep("mobile");
                      setMobile("");
                      setOtp("");
                      setOtpSessionId("");
                    }}
                  >
                    Back to Sign in
                  </button>
                </>
              )}

              {step === "profile" && (
                <>
                  <h2 className={styles.modalTitle}>Complete Your Profile</h2>
                  <p className={styles.modalText}>
                    We couldn't find an account for this number. Enter your details to
                    register as a new business account.
                  </p>
                  <form onSubmit={handleContinue}>
                    <input
                      className={styles.textInput}
                      placeholder="Name"
                      value={name}
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                    />
                    <input
                      className={styles.textInput}
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                      className={styles.textInput}
                      placeholder="Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? "Please wait..." : "Continue"}
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

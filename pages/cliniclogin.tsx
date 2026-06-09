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

export default function ClinicLogin() {
  const router = useRouter();
  const nextPath = (router.query?.next as string) || "/home";

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [step, setStep] = useState<"mobile" | "otp" | "profile">("mobile");
  const [loading, setLoading] = useState(false);

  const completeLogin = (data: any, fallbackMobile: string) => {
    const cookieOptions = {
      path: "/",
      sameSite: "lax" as const,
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    };

    Cookies.remove("userId");
    Cookies.remove("profileImage");
    localStorage.removeItem("profileImage");

    const name = data?.clinic?.clinicName || "";
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
    Cookies.set("clinicName", name, cookieOptions);
    Cookies.set("username", name, cookieOptions);
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

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedMobile = validateMobile();
    if (!normalizedMobile) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clinic-auth/send-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactNo: normalizedMobile, otpSessionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Unable to send OTP");

      setOtp("");
      setOtpSessionId(data.sessionId || "");
      setStep("otp");
    } catch (err: any) {
      alert(err.message || "Unable to send OTP");
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

    const normalizedMobile = validateMobile();
    if (!normalizedMobile) return;

    setLoading(true);
    try {
      const verifyRes = await fetch(`${API_URL}/clinic-auth/verify-login-otp`, {
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

    const res = await fetch(`${API_URL}/clinic-auth/mobile-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contactNo: normalizedMobile,
    otpSessionId: otpSessionId,
  }),
});

const data = await res.json();

if (res.ok) {
  completeLogin(data, normalizedMobile);
  return;
}

if (data?.needsProfile || data?.message === "Clinic details are required") {
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

    if (!clinicName.trim() || !email.trim() || !address.trim()) {
      alert("Clinic name, email and address are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clinic-auth/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNo: normalizedMobile,
          otpSessionId,
          clinicName: clinicName.trim(),
          email: email.trim(),
          address: address.trim(),
          ownerName: ownerName.trim(),
          whatsapp: whatsapp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

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
              alt="Clinic login"
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
                  <h1 className={styles.title}>Clinic Sign in</h1>
                  <p className={styles.subtitle}>Enter 10 digit clinic mobile no.</p>

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
                  <h2 className={styles.modalTitle}>Verify clinic number</h2>
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

              {step === "profile" && (
                <>
                  <h2 className={styles.modalTitle}>Complete Clinic Profile</h2>
                  <form onSubmit={handleContinue}>
                    <input
                      className={styles.textInput}
                      placeholder="Clinic Name"
                      value={clinicName}
                      autoFocus
                      onChange={(e) => setClinicName(e.target.value)}
                    />
                    <input
                      className={styles.textInput}
                      placeholder="Clinic Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                      className={styles.textInput}
                      placeholder="Clinic Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <input
                      className={styles.textInput}
                      placeholder="Owner Name (optional)"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                    <input
                      className={styles.textInput}
                      placeholder="WhatsApp Number (optional)"
                      value={whatsapp}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                    />
                    <button type="submit" className={styles.primaryBtn} disabled={loading}>
                      {loading ? "Please wait..." : "Continue"}
                    </button>
                  </form>
                </>
              )}

              <p className={styles.terms}>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

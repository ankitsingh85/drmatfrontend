"use client";

import React, { useState } from "react";
import { FiX, FiUser, FiPhone, FiMail, FiCheckCircle, FiShield } from "react-icons/fi";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import styles from "@/styles/components/modal/StartTreatmentModal.module.css";

export interface StartTreatmentItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface StartTreatmentPatient {
  name?: string;
  email?: string;
  contactNo?: string;
}

export interface StartTreatmentOrder {
  _id: string;
  createdAt: string;
  totalAmount: number;
  userId?: StartTreatmentPatient | string;
}

type Props = {
  order: StartTreatmentOrder;
  items: StartTreatmentItem[];
  clinicId: string;
  onClose: () => void;
  onStarted: (orderId: string) => void;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
    date
  );
};

const formatMoney = (value: number) => `Rs. ${value.toLocaleString("en-IN")}`;

export default function StartTreatmentModal({
  order,
  items,
  clinicId,
  onClose,
  onStarted,
}: Props) {
  const toast = useToast();
  const patient = typeof order.userId === "object" ? order.userId : null;

  const [otpSessionId, setOtpSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [started, setStarted] = useState(false);

  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      const res = await fetch(`${API_URL}/orders/${order._id}/start-treatment/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clinic-id": clinicId,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to send OTP");

      setOtpSessionId(data.sessionId || "");
      setOtp("");
      toast.success("OTP sent to the patient's mobile number");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!otpSessionId) {
      toast.error("Please send an OTP first");
      return;
    }
    if (otp.trim().length < 4) {
      toast.error("Enter the OTP the patient read out to you");
      return;
    }

    try {
      setVerifying(true);
      const res = await fetch(`${API_URL}/orders/${order._id}/start-treatment/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clinic-id": clinicId,
        },
        body: JSON.stringify({ sessionId: otpSessionId, otp: otp.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Invalid OTP");

      setStarted(true);
      toast.success("Patient verified — treatment started");
      onStarted(order._id);
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>Start Treatment</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        {started ? (
          <div className={styles.successState}>
            <FiCheckCircle size={44} className={styles.successIcon} />
            <h3>Treatment Started</h3>
            <p>The patient has been verified and the treatment has begun.</p>
            <button type="button" className={styles.primaryBtn} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className={styles.patientCard}>
              <p className={styles.sectionLabel}>Patient Details</p>
              <p className={styles.patientName}>
                <FiUser size={14} /> {patient?.name || "Patient"}
              </p>
              {patient?.contactNo && (
                <p className={styles.patientLine}>
                  <FiPhone size={13} /> {patient.contactNo}
                </p>
              )}
              {patient?.email && (
                <p className={styles.patientLine}>
                  <FiMail size={13} /> {patient.email}
                </p>
              )}
            </div>

            <div className={styles.orderMeta}>
              <div>
                <p className={styles.sectionLabel}>Order ID</p>
                <p className={styles.metaValue}>{order._id}</p>
              </div>
              <div>
                <p className={styles.sectionLabel}>Booked On</p>
                <p className={styles.metaValue}>{formatDateTime(order.createdAt)}</p>
              </div>
            </div>

            <p className={styles.sectionLabel}>Treatment(s)</p>
            <div className={styles.itemList}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <span className={styles.itemName}>
                    {item.name} x{item.quantity}
                  </span>
                  <span className={styles.itemPrice}>
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.otpSection}>
              <p className={styles.sectionLabel}>
                <FiShield size={13} /> Identity Verification
              </p>
              <p className={styles.otpHint}>
                Send an OTP to the patient's mobile number above. Ask them to read the code
                back to you, then enter it below to confirm their identity and start the
                treatment.
              </p>

              <button
                type="button"
                className={styles.sendOtpBtn}
                onClick={handleSendOtp}
                disabled={sendingOtp || !patient?.contactNo}
              >
                {sendingOtp
                  ? "Sending OTP..."
                  : otpSessionId
                  ? "Resend OTP"
                  : "Send OTP"}
              </button>

              {otpSessionId && (
                <form className={styles.otpForm} onSubmit={handleVerifyOtp}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP from patient"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                    className={styles.otpInput}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={verifying || otp.trim().length < 4}
                  >
                    {verifying ? "Verifying..." : "Verify & Start Treatment"}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

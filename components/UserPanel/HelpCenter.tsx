"use client";

import React, { useState } from "react";
import { FiMail, FiPhone, FiCopy, FiCheck, FiLifeBuoy, FiClock } from "react-icons/fi";
import styles from "@/styles/userpanel/helpcenter.module.css";

const SUPPORT_EMAIL = "support@drdermat.com";
const SUPPORT_PHONE = "9412516001";
const SUPPORT_PHONE_DISPLAY = "+91 94125 16001";

const HelpCenter: React.FC = () => {
  const [copied, setCopied] = useState<"email" | "phone" | null>(null);

  const handleCopy = async (value: string, key: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((prev) => (prev === key ? null : prev)), 1800);
    } catch {
      // clipboard access denied — the mailto/tel link still works
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroIcon}>
          <FiLifeBuoy />
        </div>
        <div>
          <h2 className={styles.heroTitle}>Help Center</h2>
          <p className={styles.heroSubtitle}>
            Need help with an order, booking, or anything else? Our support team is here for you.
          </p>
        </div>
      </div>

      <div className={styles.cardsGrid}>
        <div className={styles.contactCard}>
          <div className={`${styles.contactIcon} ${styles.contactIconEmail}`}>
            <FiMail />
          </div>
          <p className={styles.contactLabel}>Email Support</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.contactValue}>
            {SUPPORT_EMAIL}
          </a>
          <p className={styles.contactHint}>We usually reply within 24 hours.</p>
          <div className={styles.contactActions}>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.primaryBtn}>
              <FiMail /> Send Email
            </a>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={() => handleCopy(SUPPORT_EMAIL, "email")}
            >
              {copied === "email" ? <FiCheck /> : <FiCopy />}
              {copied === "email" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className={styles.contactCard}>
          <div className={`${styles.contactIcon} ${styles.contactIconPhone}`}>
            <FiPhone />
          </div>
          <p className={styles.contactLabel}>Call Support</p>
          <a href={`tel:+91${SUPPORT_PHONE}`} className={styles.contactValue}>
            {SUPPORT_PHONE_DISPLAY}
          </a>
          <p className={styles.contactHint}>
            <FiClock /> Mon – Sat, 10:00 AM – 7:00 PM
          </p>
          <div className={styles.contactActions}>
            <a href={`tel:+91${SUPPORT_PHONE}`} className={styles.primaryBtn}>
              <FiPhone /> Call Now
            </a>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={() => handleCopy(SUPPORT_PHONE, "phone")}
            >
              {copied === "phone" ? <FiCheck /> : <FiCopy />}
              {copied === "phone" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.footNote}>
        For order or booking cancellations, invoice issues, or any other query, reach out to us
        using the email or phone number above and our team will help you out.
      </div>
    </div>
  );
};

export default HelpCenter;

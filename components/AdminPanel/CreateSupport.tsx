"use client";

import React, { useState } from "react";
import styles from "@/styles/Dashboard/createb2bproduct.module.css";


export default function CreateSupport() {
  const [form, setForm] = useState({
    issueType: "",
    issueDescription: "",
    chatOption: true,
    tollFreeNumber: "",
    email: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("✅ SUPPORT REQUEST PAYLOAD", form);
    alert("Support request submitted successfully (check console)");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Support / Help Center</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ================= SUPPORT DETAILS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Support Request</h3>

          <div className={styles.field}>
            <label className={styles.label}>Choose from list</label>
            <select
              className={styles.select}
              name="issueType"
              onChange={handleChange}
            >
              <option value="">Select Issue Type</option>
              <option>Order Related</option>
              <option>Payment Issue</option>
              <option>Technical Problem</option>
              <option>Account Issue</option>
              <option>Other</option>
            </select>
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Describe your issue in detail</label>
            <textarea
              className={styles.textarea}
              name="issueDescription"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= CONTACT OPTIONS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Contact Options</h3>

          <div className={styles.switchRow}>
            <label>
              <input
                type="checkbox"
                name="chatOption"
                checked={form.chatOption}
                onChange={handleChange}
              />
              Chat Option
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Toll Free Number</label>
            <input
              className={styles.input}
              name="tollFreeNumber"
              placeholder="1800-XXX-XXXX"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Write an Email</label>
            <input
              className={styles.input}
              type="email"
              name="email"
              placeholder="support@example.com"
              onChange={handleChange}
            />
          </div>
        </div>

        <button className={styles.submitBtn} type="submit">
          Submit Support Request
        </button>
      </form>
    </div>
  );
}

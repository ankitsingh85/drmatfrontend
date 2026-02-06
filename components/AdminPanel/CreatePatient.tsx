"use client";

import React, { useState } from "react";
import styles from "@/styles/Dashboard/createpatient.module.css";

export default function CreatePatient() {
  /* ================= AUTO PATIENT ID ================= */
  const [patientId] = useState(`PAT-${Date.now().toString().slice(-6)}`);

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    patientName: "",
    address: "",
    email: "",
    contactNo: "",
    location: "",

    orders: "",
    consultations: "",
    testReports: "",
    prescriptions: "",

    membershipPlan: "",
    paymentMethod: "",

    privacyPolicyAccepted: false,
    helpCenterAccess: true,
    settingsEnabled: true,

    rating: 5,
    active: true,
    profileReset: false,

    notificationsEnabled: true,
    searchHistory: "",
  });

  /* ================= HANDLER ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      patientId,
      ...form,
    };

    console.log("✅ PATIENT PAYLOAD", payload);
    alert("Patient created successfully (check console)");
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Patient</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ================= BASIC INFO ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>Patient ID</label>
            <input className={styles.readonlyInput} value={patientId} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Patient Name</label>
            <input
              className={styles.input}
              name="patientName"
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email ID</label>
            <input
              className={styles.input}
              type="email"
              name="email"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contact No.</label>
            <input
              className={styles.input}
              type="tel"
              name="contactNo"
              onChange={handleChange}
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Address</label>
            <textarea
              className={styles.textarea}
              name="address"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Location</label>
            <input
              className={styles.input}
              name="location"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= MEDICAL & ORDERS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Orders & Medical Records</h3>

          <div className={styles.field}>
            <label className={styles.label}>Your Orders</label>
            <input
              className={styles.input}
              name="orders"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Your Consultations</label>
            <input
              className={styles.input}
              name="consultations"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Online Test Report</label>
            <input
              className={styles.input}
              name="testReports"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Your Prescriptions</label>
            <input
              className={styles.input}
              name="prescriptions"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= MEMBERSHIP & PAYMENT ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Membership & Payment</h3>

          <div className={styles.field}>
            <label className={styles.label}>Membership Plan</label>
            <select
              className={styles.select}
              name="membershipPlan"
              onChange={handleChange}
            >
              <option value="">Select Plan</option>
              <option>Basic</option>
              <option>Premium</option>
              <option>Gold</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Payment Method</label>
            <select
              className={styles.select}
              name="paymentMethod"
              onChange={handleChange}
            >
              <option value="">Select Method</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Cash</option>
              <option>Net Banking</option>
            </select>
          </div>
        </div>

        {/* ================= SETTINGS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Settings & Preferences</h3>

          <div className={styles.switchRow}>
            <label>
              <input
                type="checkbox"
                name="privacyPolicyAccepted"
                checked={form.privacyPolicyAccepted}
                onChange={handleChange}
              />
              Privacy Policy Accepted
            </label>

            <label>
              <input
                type="checkbox"
                name="helpCenterAccess"
                checked={form.helpCenterAccess}
                onChange={handleChange}
              />
              Help Center Access
            </label>

            <label>
              <input
                type="checkbox"
                name="settingsEnabled"
                checked={form.settingsEnabled}
                onChange={handleChange}
              />
              Settings Enabled
            </label>

            <label>
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={form.notificationsEnabled}
                onChange={handleChange}
              />
              Notifications
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Search History</label>
            <textarea
              className={styles.textarea}
              name="searchHistory"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= ADMIN CONTROLS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Admin Controls</h3>

          <div className={styles.switchRow}>
            <label>
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              Active / Block by Admin
            </label>

            <label>
              <input
                type="checkbox"
                name="profileReset"
                checked={form.profileReset}
                onChange={handleChange}
              />
              Profile Reset
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Rate Us (5 Star)</label>
            <select
              className={styles.select}
              name="rating"
              onChange={handleChange}
            >
              <option value="5">★★★★★</option>
              <option value="4">★★★★</option>
              <option value="3">★★★</option>
              <option value="2">★★</option>
              <option value="1">★</option>
            </select>
          </div>
        </div>

        <button className={styles.submitBtn} type="submit">
          Save Patient
        </button>
      </form>
    </div>
  );
}

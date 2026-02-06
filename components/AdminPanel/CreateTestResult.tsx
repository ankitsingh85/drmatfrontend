"use client";

import React, { useState } from "react";
import styles from "@/styles/Dashboard/createtestresult.module.css";

export default function CreateTestResult() {
  /* ================= AUTO PATIENT ID ================= */
  const [patientId] = useState(`PAT-${Date.now().toString().slice(-6)}`);

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    patientName: "",
    contactNo: "",
    email: "",
    address: "",

    orders: "",
    consultations: "",
    testReport: "",
    treatmentImages: "",
    prescriptionUpload: "",

    recommendedProducts: "",
    specialOffers: "",
    vouchers: "",
    recommendedTreatmentPlan: "",
    membershipPlan: "",
  });

  /* ================= HANDLER ================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      patientId,
      ...form,
    };

    console.log("✅ TEST RESULT PAYLOAD", payload);
    alert("Test Result saved successfully (check console)");
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Patient Test Result</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ================= PATIENT INFO ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Patient Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>Patient ID</label>
            <input
              className={styles.readonlyInput}
              value={patientId}
              disabled
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Patient Name</label>
            <input
              className={styles.input}
              name="patientName"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contact No.</label>
            <input
              className={styles.input}
              name="contactNo"
              onChange={handleChange}
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

          <div className={styles.fullField}>
            <label className={styles.label}>Address</label>
            <textarea
              className={styles.textarea}
              name="address"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= HISTORY ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Patient History</h3>

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
              name="testReport"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= TREATMENT & PRESCRIPTION ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Treatment & Prescription</h3>

          <div className={styles.field}>
            <label className={styles.label}>Your Treatment Images</label>
            <input
              className={styles.input}
              name="treatmentImages"
              placeholder="Upload / Link"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Upload Prescription</label>
            <input
              className={styles.input}
              name="prescriptionUpload"
              placeholder="Upload / Link"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= RECOMMENDATIONS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recommendations</h3>

          <div className={styles.field}>
            <label className={styles.label}>Recommended Products</label>
            <input
              className={styles.input}
              name="recommendedProducts"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Recommended Treatment Plan</label>
            <input
              className={styles.input}
              name="recommendedTreatmentPlan"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ================= OFFERS & MEMBERSHIP ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Offers & Membership</h3>

          <div className={styles.field}>
            <label className={styles.label}>Special Offers</label>
            <input
              className={styles.input}
              name="specialOffers"
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Vouchers</label>
            <input
              className={styles.input}
              name="vouchers"
              onChange={handleChange}
            />
          </div>

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
        </div>

        <button className={styles.submitBtn} type="submit">
          Save Test Result
        </button>
      </form>
    </div>
  );
}

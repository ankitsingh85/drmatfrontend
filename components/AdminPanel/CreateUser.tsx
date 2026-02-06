"use client";

import { useState, useEffect } from "react"; // ✅ useEffect added
import styles from "@/styles/Dashboard/createUser.module.css";
import { API_URL } from "@/config/api";

// ✅ helper to generate Patient ID
const generatePatientId = () => `PAT-${Date.now().toString().slice(-6)}`;

export default function CreateUser() {
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    email: "",
    contactNo: "",
    address: "",

    password: "",            // 🔧 ADDED
    confirmPassword: "",     // 🔧 ADDED

    membershipPlan: "",
    paymentMethod: "",
    location: "",
    status: "active",
    notifications: true,
    profileReset: false,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      patientId: generatePatientId(),
    }));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔧 ADDED – REQUIRED FIELD CHECK
    if (
      !formData.patientName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      alert("Name, Email and Password are required");
      return;
    }

    // 🔧 ADDED – PASSWORD MATCH CHECK
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const payload = {
      patientId: formData.patientId, // ✅ SENT TO BACKEND
      name: formData.patientName,
      email: formData.email,
      contactNo: formData.contactNo,
      address: formData.address,

      password: formData.password, // 🔧 ADDED (CRITICAL)
    };

    console.log("CREATE USER PAYLOAD 👉", payload); // 🔧 ADDED

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include", // 🔧 ADDED (safe for prod)
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("✅ User created successfully");

      // 🔁 reset form with NEW patient ID
      setFormData({
        patientId: generatePatientId(),
        patientName: "",
        email: "",
        contactNo: "",
        address: "",
        password: "",            // 🔧 ADDED
        confirmPassword: "",     // 🔧 ADDED
        membershipPlan: "",
        paymentMethod: "",
        location: "",
        status: "active",
        notifications: true,
        profileReset: false,
      });
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create User</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ================= BASIC INFO ================= */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Basic Information</div>

          <div className={styles.field}>
            <label className={styles.label}>Patient ID</label>
            <input
              className={styles.readonlyInput}
              name="patientId"
              value={formData.patientId}
              disabled
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Patient Name</label>
            <input
              className={styles.input}
              name="patientName"
              placeholder="Enter full name"
              value={formData.patientName}
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
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contact No.</label>
            <input
              className={styles.input}
              name="contactNo"
              placeholder="Enter contact number"
              value={formData.contactNo}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Address</label>
            <textarea
              className={styles.textarea}
              name="address"
              placeholder="Enter full address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 🔐 PASSWORD SECTION (ADDED, DOES NOT REMOVE ANYTHING) */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Security</div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirm Password</label>
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ================= SERVICES ================= */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>User Activity</div>

          <div className={styles.field}>
            <label className={styles.label}>Your Orders</label>
            <input className={styles.readonlyInput} readOnly value="Available" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Your Consultations</label>
            <input className={styles.readonlyInput} readOnly value="Available" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Online Test Report</label>
            <input className={styles.readonlyInput} readOnly value="Available" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Your Prescriptions</label>
            <input className={styles.readonlyInput} readOnly value="Available" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Search History</label>
            <input className={styles.readonlyInput} readOnly value="Tracked" />
          </div>
        </div>

        {/* ================= ACCOUNT ================= */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Account & Membership</div>

          <div className={styles.field}>
            <label className={styles.label}>Membership Plan</label>
            <input
              className={styles.input}
              name="membershipPlan"
              placeholder="Free / Premium / Gold"
              value={formData.membershipPlan}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Payment Method</label>
            <input
              className={styles.input}
              name="paymentMethod"
              placeholder="UPI / Card / Net Banking"
              value={formData.paymentMethod}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Location</label>
            <input
              className={styles.input}
              name="location"
              placeholder="City, State"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="blocked">Blocked by Admin</option>
            </select>
          </div>
        </div>

        {/* ================= SETTINGS ================= */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Preferences & Controls</div>

          <div className={styles.switchRow}>
            <label>
              <input
                type="checkbox"
                name="notifications"
                checked={formData.notifications}
                onChange={handleChange}
              />
              Notification
            </label>

            <label>
              <input
                type="checkbox"
                name="profileReset"
                checked={formData.profileReset}
                onChange={handleChange}
              />
              Profile Reset
            </label>

            <label>Privacy Policy</label>
            <label>Help Center</label>
            <label>Settings</label>
            <label>Rate us ⭐⭐⭐⭐⭐</label>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>
          Create User
        </button>
      </form>
    </div>
  );
}

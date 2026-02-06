"use client";
import { API_URL } from "@/config/api";

import React, { useState } from "react";
import styles from "@/styles/Dashboard/createdoctor.module.css";

// const API_URL =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const CreateDoctor = () => {
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    specialist: "",
    email: "",
    password: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const titles = ["Dr.", "Prof.", "Mr.", "Ms."];
  const specialists = [
    "Dermatologist",
    "Cardiologist",
    "Neurologist",
    "Pediatrician",
    "Orthopedic",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/doctors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Doctor created successfully");
        setFormData({
          title: "",
          firstName: "",
          lastName: "",
          specialist: "",
          email: "",
          password: "",
          description: "",
        });
      } else {
        setMessage(data.message || "❌ Failed to create doctor");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Doctor</h1>

      {message && <p>{message}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ===== BASIC INFO ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>

          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <select
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Select Title</option>
              {titles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>First Name</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Last Name</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Specialist</label>
            <select
              name="specialist"
              value={formData.specialist}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Select Specialist</option>
              {specialists.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ===== CREDENTIALS ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Login Credentials</h2>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        </div>

        {/* ===== DESCRIPTION ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Doctor Description</h2>

          <div className={styles.fullField}>
            <label className={styles.label}>About Doctor</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Write doctor profile, experience, qualifications..."
            />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Doctor"}
        </button>
      </form>
    </div>
  );
};

export default CreateDoctor;

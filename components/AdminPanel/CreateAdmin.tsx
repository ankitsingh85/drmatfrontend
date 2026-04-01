"use client";
import { API_URL } from "@/config/api";

import React, { useState } from "react";
import styles from "@/styles/Dashboard/adminpages.module.css";

export default function CreateAdmin() {
  const [userId] = useState(`ADM-${Date.now().toString().slice(-6)}`);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accessLevel: "Admin",
  });

  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accessLevel: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    accessLevel: false,
  });

  const nameRegex = /^[A-Za-z ]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const validateField = (name: string, value: string, currentForm = form) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (!nameRegex.test(value.trim())) {
          return "Name should contain only letters and spaces";
        }
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!emailRegex.test(value.trim())) return "Enter a valid email address";
        return "";
      case "phone":
        if (!value.trim()) return "Contact No. is required";
        if (!/^\d*$/.test(value)) return "Contact No. can contain digits only";
        if (value.length !== 10) return "Contact No. must contain exactly 10 digits";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (!passwordRegex.test(value)) {
          return "Use 8+ chars with a letter, a number, and a symbol";
        }
        return "";
      case "confirmPassword":
        if (!value) return "Confirm password is required";
        if (value !== currentForm.password) return "Passwords do not match";
        return "";
      case "accessLevel":
        if (!value.trim()) return "Access level is required";
        return "";
      default:
        return "";
    }
  };

  const validateForm = (currentForm = form) => {
    const nextErrors = {
      name: validateField("name", currentForm.name, currentForm),
      email: validateField("email", currentForm.email, currentForm),
      phone: validateField("phone", currentForm.phone, currentForm),
      password: validateField("password", currentForm.password, currentForm),
      confirmPassword: validateField(
        "confirmPassword",
        currentForm.confirmPassword,
        currentForm
      ),
      accessLevel: validateField(
        "accessLevel",
        currentForm.accessLevel,
        currentForm
      ),
    };

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    const nextForm = {
      ...form,
      [name]: nextValue,
    };

    setForm(nextForm);
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, nextValue, nextForm),
      ...(name === "password"
        ? {
            confirmPassword: validateField(
              "confirmPassword",
              nextForm.confirmPassword,
              nextForm
            ),
          }
        : {}),
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setSuccess("");
    setSubmitError("");
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, form),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    const hasErrors = Object.values(nextErrors).some(Boolean);
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      accessLevel: true,
    });
    if (hasErrors) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      accessLevel: form.accessLevel.toLowerCase(),
    };

    try {
      const res = await fetch(`${API_URL}/admins`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess("Admin account created successfully");
      setSubmitError("");
      setErrors({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        accessLevel: "",
      });
      setTouched({
        name: false,
        email: false,
        phone: false,
        password: false,
        confirmPassword: false,
        accessLevel: false,
      });
      window.dispatchEvent(new Event("admin-dashboard:create-success"));

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        accessLevel: "Admin",
      });
    } catch (err: any) {
      setSuccess("");
      setSubmitError(err.message || "Failed to create admin");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Login / Profile</h3>

          <div className={styles.field}>
            <label className={styles.label}>User ID</label>
            <input className={styles.readonlyInput} value={userId} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter full name"
              pattern="[A-Za-z ]+"
              title="Use letters and spaces only"
              required
            />
            {touched.name && errors.name && (
              <p className={styles.fieldError}>{errors.name}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter email address"
              required
            />
            {touched.email && errors.email && (
              <p className={styles.fieldError}>{errors.email}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contact No.</label>
            <input
              className={styles.input}
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter contact number"
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Enter exactly 10 digits"
              required
            />
            {touched.phone && errors.phone && (
              <p className={styles.fieldError}>{errors.phone}</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Security</h3>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Create a password"
              minLength={8}
              autoComplete="new-password"
              title="Use at least 8 characters with letters, numbers, and a symbol"
              required
            />
            {touched.password && errors.password && (
              <p className={styles.fieldError}>{errors.password}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirm Password</label>
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Re-enter password"
              minLength={8}
              autoComplete="new-password"
              required
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className={styles.fieldError}>{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Access Level</h3>

          <div className={styles.field}>
            <label className={styles.label}>Grant Access</label>
            <select
              className={styles.select}
              name="accessLevel"
              value={form.accessLevel}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Manager">Manager</option>
            </select>
            {touched.accessLevel && errors.accessLevel && (
              <p className={styles.fieldError}>{errors.accessLevel}</p>
            )}
          </div>
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button className={styles.submitBtn} type="submit">
          Save Admin
        </button>
      </form>
    </div>
  );
}

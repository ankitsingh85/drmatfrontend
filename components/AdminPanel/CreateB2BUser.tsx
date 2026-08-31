"use client";

import { API_URL } from "@/config/api";
import React, { useState } from "react";
import styles from "@/styles/Dashboard/createUser.module.css";

type FormState = {
  name: string;
  email: string;
  contactNo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: "active" | "inactive";
};

type ValidatedField = "name" | "email" | "contactNo" | "pincode";

const initialForm: FormState = {
  name: "",
  email: "",
  contactNo: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  status: "active",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateB2BUser() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<ValidatedField, string>>({
    name: "",
    email: "",
    contactNo: "",
    pincode: "",
  });
  const [touched, setTouched] = useState<Record<ValidatedField, boolean>>({
    name: false,
    email: false,
    contactNo: false,
    pincode: false,
  });
  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (name: string, value: string) => {
    const cleanValue = value.trim();
    switch (name) {
      case "name":
        return cleanValue ? "" : "Name is required";
      case "email":
        if (!cleanValue) return "";
        return emailRegex.test(cleanValue) ? "" : "Enter a valid email address";
      case "contactNo":
        if (!cleanValue) return "Contact number is required";
        return /^\d{10}$/.test(cleanValue)
          ? ""
          : "Contact number must contain exactly 10 digits";
      case "pincode":
        if (!cleanValue) return "";
        return /^\d{6}$/.test(cleanValue) ? "" : "Pincode must contain exactly 6 digits";
      default:
        return "";
    }
  };

  const validateForm = (currentForm = form) => {
    const nextErrors = {
      name: validateField("name", currentForm.name),
      email: validateField("email", currentForm.email),
      contactNo: validateField("contactNo", currentForm.contactNo),
      pincode: validateField("pincode", currentForm.pincode),
    };
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "contactNo"
        ? value.replace(/\D/g, "").slice(0, 10)
        : name === "pincode"
        ? value.replace(/\D/g, "").slice(0, 6)
        : value;

    const nextForm = { ...form, [name]: nextValue } as FormState;
    setForm(nextForm);

    if (name in errors) {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, String(nextValue)),
      }));
    }

    setSuccess("");
    setSubmitError("");
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name in errors) {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setTouched({
      name: true,
      email: true,
      contactNo: true,
      pincode: true,
    });
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/b2b-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          contactNo: form.contactNo.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create B2B user");

      setSuccess(`B2B user created successfully. ID: ${data.b2bUserId || "-"}`);
      setSubmitError("");
      setForm(initialForm);
      setErrors({
        name: "",
        email: "",
        contactNo: "",
        pincode: "",
      });
      setTouched({
        name: false,
        email: false,
        contactNo: false,
        pincode: false,
      });
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
    } catch (err: any) {
      setSuccess("");
      setSubmitError(err.message || "Failed to create B2B user");
    } finally {
      setLoading(false);
    }
  };

  const showError = (name: ValidatedField) => touched[name] && errors[name];

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Business Information</div>

          <div className={styles.field}>
            <label className={styles.label}>
              Name<span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter name"
              required
            />
            {showError("name") && (
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
              placeholder="Enter email"
            />
            {showError("email") && <p className={styles.fieldError}>{errors.email}</p>}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Contact Details</div>

          <div className={styles.field}>
            <label className={styles.label}>
              Contact No.<span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="tel"
              name="contactNo"
              value={form.contactNo}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10 digit contact number"
              required
            />
            {showError("contactNo") && (
              <p className={styles.fieldError}>{errors.contactNo}</p>
            )}
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Address</label>
            <textarea
              className={styles.textarea}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter full address"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>City</label>
            <input
              className={styles.input}
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>State</label>
            <input
              className={styles.input}
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="State"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Pincode</label>
            <input
              className={styles.input}
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="numeric"
              maxLength={6}
              placeholder="Pincode"
            />
            {showError("pincode") && (
              <p className={styles.fieldError}>{errors.pincode}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {submitError && <p className={styles.submitError}>{submitError}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create B2B User"}
        </button>
      </form>
    </div>
  );
}

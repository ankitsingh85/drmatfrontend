"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/createUser.module.css";
import { API_URL } from "@/config/api";

const generatePatientId = () => `PAT-${Date.now().toString().slice(-6)}`;
type ValidatedField = "patientName" | "email" | "contactNo" | "address";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    email: "",
    contactNo: "",
    address: "",
    membershipPlan: "",
    paymentMethod: "",
    location: "",
    status: "active",
    notifications: true,
    profileReset: false,
  });

  const [errors, setErrors] = useState<Record<ValidatedField, string>>({
    patientName: "",
    email: "",
    contactNo: "",
    address: "",
  });
  const [touched, setTouched] = useState<Record<ValidatedField, boolean>>({
    patientName: false,
    email: false,
    contactNo: false,
    address: false,
  });
  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const nameRegex = /^[A-Za-z ]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      patientId: generatePatientId(),
    }));
  }, []);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "patientName":
        if (!value.trim()) return "Patient name is required";
        if (!nameRegex.test(value.trim())) {
          return "Patient name should contain only letters and spaces";
        }
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!emailRegex.test(value.trim())) return "Enter a valid email address";
        return "";
      case "contactNo":
        if (!value.trim()) return "Contact No. is required";
        if (!/^\d*$/.test(value)) return "Contact No. can contain digits only";
        if (value.length !== 10) {
          return "Contact No. must contain exactly 10 digits";
        }
        return "";
      case "address":
        if (!value.trim()) return "Address is required";
        return "";
      default:
        return "";
    }
  };

  const validateForm = (currentForm = formData) => {
    const nextErrors = {
      patientName: validateField("patientName", currentForm.patientName),
      email: validateField("email", currentForm.email),
      contactNo: validateField("contactNo", currentForm.contactNo),
      address: validateField("address", currentForm.address),
    };

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const nextValue =
      name === "contactNo" ? value.replace(/\D/g, "").slice(0, 10) : value;

    const nextForm = {
      ...formData,
      [name]: type === "checkbox" ? checked : nextValue,
    };

    setFormData(nextForm);

    const validatedFields: ValidatedField[] = [
      "patientName",
      "email",
      "contactNo",
      "address",
    ];

    if (validatedFields.includes(name as ValidatedField)) {
      setErrors((prev) => ({
        ...prev,
        [name as ValidatedField]: validateField(
          name,
          String(nextValue)
        ),
      }));
    }

    setTouched((prev) => ({
      ...prev,
      ...(validatedFields.includes(name as ValidatedField)
        ? { [name as ValidatedField]: true }
        : {}),
    }));

    setSuccess("");
    setSubmitError("");
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const validatedFields: ValidatedField[] = [
      "patientName",
      "email",
      "contactNo",
      "address",
    ];

    if (validatedFields.includes(name as ValidatedField)) {
      setTouched((prev) => ({
        ...prev,
        [name as ValidatedField]: true,
      }));
      setErrors((prev) => ({
        ...prev,
        [name as ValidatedField]: validateField(name, value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    const hasErrors = Object.values(nextErrors).some(Boolean);
    setTouched({
      patientName: true,
      email: true,
      contactNo: true,
      address: true,
    });
    if (hasErrors) return;

    const payload = {
      patientId: formData.patientId,
      name: formData.patientName.trim(),
      email: formData.email.trim(),
      contactNo: formData.contactNo.trim(),
      address: formData.address.trim(),
    };

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess("User created successfully");
      setSubmitError("");
      setErrors({
        patientName: "",
        email: "",
        contactNo: "",
        address: "",
      });
      setTouched({
        patientName: false,
        email: false,
        contactNo: false,
        address: false,
      });
      window.dispatchEvent(new Event("admin-dashboard:create-success"));

      setFormData({
        patientId: generatePatientId(),
        patientName: "",
        email: "",
        contactNo: "",
        address: "",
        membershipPlan: "",
        paymentMethod: "",
        location: "",
        status: "active",
        notifications: true,
        profileReset: false,
      });
    } catch (err: any) {
      setSuccess("");
      setSubmitError(err.message || "Failed to create user");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
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
              onBlur={handleBlur}
              pattern="[A-Za-z ]+"
              title="Use letters and spaces only"
              required
            />
            {touched.patientName && errors.patientName && (
              <p className={styles.fieldError}>{errors.patientName}</p>
            )}
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
              onBlur={handleBlur}
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
              name="contactNo"
              placeholder="Enter 10 digit contact number"
              value={formData.contactNo}
              onChange={handleChange}
              onBlur={handleBlur}
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Enter exactly 10 digits"
              required
            />
            {touched.contactNo && errors.contactNo && (
              <p className={styles.fieldError}>{errors.contactNo}</p>
            )}
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Address</label>
            <textarea
              className={styles.textarea}
              name="address"
              placeholder="Enter full address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {touched.address && errors.address && (
              <p className={styles.fieldError}>{errors.address}</p>
            )}
          </div>
        </div>

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

        {submitError && <p className={styles.submitError}>{submitError}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button type="submit" className={styles.submitBtn}>
          Create User
        </button>
      </form>
    </div>
  );
}

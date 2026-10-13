"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/clinicPlan.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import ClinicAddonManager from "@/components/AdminPanel/ClinicAddonManager";

const ClinicPlanSettings = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    planName: "",
    description: "",
    monthlyPrice: "",
    quarterlyPrice: "",
    yearlyPrice: "",
    isActive: true,
  });
  const [featuresText, setFeaturesText] = useState("");

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clinic-subscriptions/plan`);
      const data = await res.json();
      setForm({
        planName: data.planName || "",
        description: data.description || "",
        monthlyPrice: String(data.monthlyPrice ?? ""),
        quarterlyPrice: String(data.quarterlyPrice ?? ""),
        yearlyPrice: String(data.yearlyPrice ?? ""),
        isActive: Boolean(data.isActive),
      });
      setFeaturesText(Array.isArray(data.features) ? data.features.join("\n") : "");
    } catch (err) {
      console.error("Failed to fetch clinic plan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const features = featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch(`${API_URL}/clinic-subscriptions/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: form.planName,
          description: form.description,
          monthlyPrice: Number(form.monthlyPrice),
          quarterlyPrice: Number(form.quarterlyPrice),
          yearlyPrice: Number(form.yearlyPrice),
          isActive: form.isActive,
          features,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update plan");

      toast.success("Clinic subscription plan updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading plan settings...</p>;

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h3 className={styles.cardHeading}>Plan Details</h3>
        <p className={styles.cardSubtext}>
          This is the single base plan every clinic sees on their dashboard. Add-on services
          (below) are optional extras on top of it.
        </p>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Plan Name</label>
            <input
              className={styles.input}
              name="planName"
              value={form.planName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Short description shown to clinics (optional)"
            />
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Features (one per line, shown to clinics)</label>
            <textarea
              className={styles.textarea}
              rows={7}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Monthly Price (₹)</label>
            <input
              type="number"
              min="0"
              className={styles.input}
              name="monthlyPrice"
              value={form.monthlyPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Quarterly Price (₹)</label>
            <input
              type="number"
              min="0"
              className={styles.input}
              name="quarterlyPrice"
              value={form.quarterlyPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Yearly Price (₹)</label>
            <input
              type="number"
              min="0"
              className={styles.input}
              name="yearlyPrice"
              value={form.yearlyPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Plan available for purchase
            </label>
          </div>
        </div>

        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Plan Settings"}
        </button>
      </form>

      <ClinicAddonManager />
    </div>
  );
};

export default ClinicPlanSettings;

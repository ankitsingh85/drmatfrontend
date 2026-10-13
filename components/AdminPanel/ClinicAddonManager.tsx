"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/clinicPlan.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

type Addon = {
  _id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
};

const ClinicAddonManager = () => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [form, setForm] = useState({ name: "", description: "", price: "" });

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clinic-subscriptions/addons/all`);
      const data = await res.json();
      setAddons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch add-ons:", err);
      setAddons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) {
      toast.error("Add-on name and price are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/clinic-subscriptions/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create add-on");

      setAddons((prev) => [data, ...prev]);
      setForm({ name: "", description: "", price: "" });
      toast.success("Add-on created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create add-on");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (addon: Addon) => {
    setEditingId(addon._id);
    try {
      const res = await fetch(`${API_URL}/clinic-subscriptions/addons/${addon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !addon.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update add-on");

      setAddons((prev) => prev.map((a) => (a._id === addon._id ? data : a)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update add-on");
    } finally {
      setEditingId("");
    }
  };

  const handleDelete = async (addon: Addon) => {
    if (!(await confirmDialog(`Delete the "${addon.name}" add-on?`, { danger: true }))) return;

    setEditingId(addon._id);
    try {
      const res = await fetch(`${API_URL}/clinic-subscriptions/addons/${addon._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete add-on");

      setAddons((prev) => prev.filter((a) => a._id !== addon._id));
      toast.success("Add-on deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete add-on");
    } finally {
      setEditingId("");
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.cardHeading}>Add-on Services</h3>
      <p className={styles.cardSubtext}>
        Optional extras clinics can attach to their plan at checkout, charged alongside the base
        subscription (e.g. Priority Placement, Extra WhatsApp Number).
      </p>

      <form className={styles.addonForm} onSubmit={handleCreate}>
        <div className={styles.addonFormField}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Priority Placement"
          />
        </div>
        <div className={styles.addonFormField}>
          <label className={styles.label}>Description</label>
          <input
            className={styles.input}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Shown to the clinic (optional)"
          />
        </div>
        <div className={styles.addonFormField}>
          <label className={styles.label}>Price (₹)</label>
          <input
            type="number"
            min="0"
            className={styles.input}
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          />
        </div>
        <button type="submit" className={styles.addBtn} disabled={creating}>
          {creating ? "Adding..." : "Add Add-on"}
        </button>
      </form>

      {loading ? (
        <p>Loading add-ons...</p>
      ) : addons.length === 0 ? (
        <div className={styles.emptyState}>No add-ons yet. Create one above.</div>
      ) : (
        <div className={styles.addonGrid}>
          {addons.map((addon) => (
            <div key={addon._id} className={`${styles.addonCard} ${addon.isActive ? "" : styles.inactive}`}>
              <div className={styles.addonCardTop}>
                <span className={styles.addonCardName}>{addon.name}</span>
                <span className={styles.addonCardPrice}>₹{addon.price}</span>
              </div>
              {addon.description && <p className={styles.addonCardDescription}>{addon.description}</p>}
              <div className={styles.addonCardActions}>
                <button
                  type="button"
                  className={styles.smallBtn}
                  disabled={editingId === addon._id}
                  onClick={() => handleToggleActive(addon)}
                >
                  {addon.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  className={`${styles.smallBtn} ${styles.smallBtnDanger}`}
                  disabled={editingId === addon._id}
                  onClick={() => handleDelete(addon)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicAddonManager;

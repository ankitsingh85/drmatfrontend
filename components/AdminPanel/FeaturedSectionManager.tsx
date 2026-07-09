"use client";

import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import styles from "@/styles/UpdateOffer.module.css";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const REQUIRED_WIDTH = 473;
const REQUIRED_HEIGHT = 300;

type FeaturedItem = {
  _id: string;
  imageUrl: string;
  heading: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
};

type FormState = {
  heading: string;
  link: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  heading: "",
  link: "/#",
  sortOrder: "0",
  isActive: true,
};

const FeaturedSectionManager = () => {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/featured-section`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch featured section error:", err);
      setError("Failed to load featured section images.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateImage = (file: File) =>
    new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width !== REQUIRED_WIDTH || img.height !== REQUIRED_HEIGHT) {
          reject(
            new Error(
              `Image must be exactly ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px. Selected image is ${img.width}x${img.height}px`,
            ),
          );
          return;
        }
        resolve();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read selected image."));
      };

      img.src = url;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");
    setMessage("");

    if (!file) return;

    try {
      await validateImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
      e.target.value = "";
      setError(err.message || "Invalid image selected.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedFile(null);
    setEditingId("");
    setMessage("");
    setError("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEdit = (item: FeaturedItem) => {
    setEditingId(item._id);
    setForm({
      heading: item.heading || "",
      link: item.link || "/#",
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive !== false,
    });
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.heading.trim()) {
      setError("Heading is required.");
      return;
    }

    if (!editingId && !selectedFile) {
      setError("Please choose a featured image.");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("heading", form.heading.trim());
      formData.append("link", form.link.trim() || "/#");
      formData.append("sortOrder", form.sortOrder || "0");
      formData.append("isActive", String(form.isActive));
      if (selectedFile) formData.append("image", selectedFile);

      if (editingId) {
        await axios.put(`${API_URL}/featured-section/${editingId}`, formData);
        setMessage("Featured item updated successfully.");
      } else {
        await axios.post(`${API_URL}/featured-section`, formData);
        setMessage("Featured item created successfully.");
      }

      resetForm();
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save featured item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this featured image?")) return;

    try {
      await axios.delete(`${API_URL}/featured-section/${id}`);
      await fetchItems();
      if (editingId === id) resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete featured item.");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Featured Section</h1>

      <div className={styles.instructions}>
        <p>Upload images for the homepage featured section.</p>
        <ul>
          <li>
            Required size: <strong>{REQUIRED_WIDTH}px x {REQUIRED_HEIGHT}px</strong>
          </li>
          <li>Any other image size will be rejected.</li>
          <li>The homepage keeps the same banner display size.</li>
        </ul>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p style={{ color: "#15803d", fontWeight: 600 }}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.offerCard}>
        <label className={styles.fieldLabel}>Heading</label>
        <input
          className={styles.field}
          value={form.heading}
          onChange={(e) => setForm({ ...form, heading: e.target.value })}
          placeholder="Book A Clinic Appointment"
        />

        <label className={styles.fieldLabel}>Link</label>
        <input
          className={styles.field}
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="/home/findClinicsPage"
        />

        <label className={styles.fieldLabel}>Sort Order</label>
        <input
          className={styles.field}
          type="number"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
        />

        <label className={styles.fieldLabel}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          Active on homepage
        </label>

        <label className={styles.fieldLabel}>
          Image {editingId ? "(leave empty to keep current image)" : ""}
        </label>
        <input
          ref={fileInputRef}
          className={styles.field}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
        />

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className={styles.offerImage}
            style={{ maxHeight: 300, marginTop: 16 }}
          />
        )}

        <div className={styles.buttons} style={{ marginTop: 18 }}>
          <button className={styles.updateBtn} type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update" : "Upload"}
          </button>
          {editingId && (
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className={styles.offersGrid} style={{ marginTop: 24 }}>
        {items.map((item) => (
          <div key={item._id} className={styles.offerCard}>
            <img
              src={resolveMediaUrl(item.imageUrl) || item.imageUrl}
              alt={item.heading}
              className={styles.offerImage}
            />
            <div className={styles.offerMeta}>
              <p>
                <strong>Heading:</strong> {item.heading}
              </p>
              <p>
                <strong>Link:</strong> {item.link || "/#"}
              </p>
              <p>
                <strong>Sort:</strong> {item.sortOrder ?? 0}
              </p>
              <p>
                <strong>Status:</strong> {item.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.updateBtn}
                onClick={() => startEdit(item)}
              >
                Edit
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => handleDelete(item._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSectionManager;

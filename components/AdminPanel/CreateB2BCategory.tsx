"use client";
import { API_URL } from "@/config/api";


import React, { useState } from "react";
import styles from "@/styles/Dashboard/createcliniccategory.module.css";

// const API_URL =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export default function CreateB2BCategory() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= IMAGE TO BASE64 ================= */
  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    if (!image) {
      setError("Category image is required");
      return;
    }

    try {
      setLoading(true);
      const imageUrl = await convertToBase64(image);

      await fetch(`${API_URL}/b2b-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl,
        }),
      });

      setName("");
      setImage(null);
      setPreview(null);
      alert("✅ B2B Category created successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to create B2B category");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create B2B Category</h1>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ===== BASIC INFO ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Category Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>Category Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter B2B category name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category Image</label>

            <div className={styles.uploadBox}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() =>
                  document.getElementById("b2bImageInput")?.click()
                }
              >
                Upload Image
              </button>

              <span className={styles.uploadHint}>
                PNG / JPG · Max 1MB
              </span>
            </div>

            <input
              id="b2bImageInput"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImage(file);
                  setPreview(URL.createObjectURL(file));
                }
              }}
            />

            {preview ? (
              <img src={preview} className={styles.preview} />
            ) : (
              <span className={styles.noImage}>No image selected</span>
            )}
          </div>
        </div>

        <button
          className={styles.submitBtn}
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create B2B Category"}
        </button>
      </form>
    </div>
  );
}

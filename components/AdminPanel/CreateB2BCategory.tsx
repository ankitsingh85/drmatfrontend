"use client";
import { API_URL } from "@/config/api";
import React, { useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcliniccategory.module.css";

export default function CreateB2BCategory() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const isAllowedImage = (file: File) =>
    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);

  const handleImageSelect = (file: File) => {
    if (!isAllowedImage(file)) {
      setError("Image must be JPG, JPEG, PNG, or WEBP");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Image must be less than or equal to 1MB");
      return;
    }
    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

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

      const res = await fetch(`${API_URL}/b2b-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create category");

      alert("B2B Category created successfully");
      setName("");
      setImage(null);
      setPreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create B2B category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create B2B Category</h1>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
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

          <div className={styles.fullField}>
            <label className={styles.label}>Category Image</label>

            <div className={styles.uploadBox}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => imageInputRef.current?.click()}
              >
                Upload Image
              </button>
              <span className={styles.uploadHint}>JPG/PNG/WEBP - Max 1MB</span>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
            />

            {preview ? (
              <img src={preview} className={styles.preview} alt="B2B category preview" />
            ) : (
              <span className={styles.noImage}>No image selected</span>
            )}
          </div>
        </section>

        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create B2B Category"}
        </button>
      </form>
    </div>
  );
}

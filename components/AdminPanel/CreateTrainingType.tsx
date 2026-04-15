"use client";

import React, { useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";

const CreateTrainingType = () => {
  const [trainingTypeName, setTrainingTypeName] = useState("");
  const [trainingTypeImage, setTrainingTypeImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAllowedImage = (file: File) =>
    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedImage(file)) {
      setError("Training type image must be JPG, JPEG, PNG, or WEBP");
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Training type image must be less than or equal to 1MB");
      return;
    }

    setError("");
    setTrainingTypeImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!trainingTypeName.trim()) {
      setError("Training type name is required");
      return;
    }

    if (!trainingTypeImage) {
      setError("Please upload training type image");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", trainingTypeName.trim());
      formData.append("imageUrl", trainingTypeImage);

      const res = await fetch(`${API_URL}/training-types`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create training type");

      setTrainingTypeName("");
      setTrainingTypeImage(null);
      setPreviewUrl(null);
      setSuccess("Training type created successfully");
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.noImage}>{success}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Training Type Details</h2>

          <div className={styles.field}>
            <label className={styles.label}>Training Type Name</label>
            <input
              className={styles.input}
              value={trainingTypeName}
              onChange={(e) => setTrainingTypeName(e.target.value)}
              placeholder="e.g. Workshop, Seminar, Bootcamp"
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Training Type Image</label>

            <div className={styles.uploadBox}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </button>
              <span className={styles.uploadHint}>JPG/PNG/WEBP - Max 1MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              hidden
              onChange={handleImageChange}
            />

            {previewUrl ? (
              <img
                src={previewUrl}
                className={styles.preview}
                alt="Training type preview"
              />
            ) : (
              <p className={styles.noImage}>No image selected</p>
            )}
          </div>
        </section>

        <button className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Training Type"}
        </button>
      </form>
    </div>
  );
};

export default CreateTrainingType;

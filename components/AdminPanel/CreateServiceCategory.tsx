"use client";

import React, { useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import MobileNavbar from "../Layout/MobileNavbar";
import { API_URL } from "@/config/api";

const CreateServiceCategory = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const isAllowedImage = (file: File) =>
    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedImage(file)) {
      setError("Image must be JPG, JPEG, PNG, or WEBP");
      setCategoryImage(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Image must be less than or equal to 1MB");
      setCategoryImage(null);
      setPreviewUrl(null);
      return;
    }

    setError("");
    setCategoryImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!categoryName.trim()) {
      setError("Service category name is required");
      return;
    }

    if (!categoryImage) {
      setError("Please select an image");
      return;
    }

    try {
      setLoading(true);
      const base64Image = await convertToBase64(categoryImage);

      const response = await fetch(`${API_URL}/service-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName.trim(),
          imageUrl: base64Image,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create category");

      setCategoryName("");
      setCategoryImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert("Service category created successfully");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Service Category</h1>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Service Category Details</h2>

          <div className={styles.field}>
            <label className={styles.label}>Service Category Name</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className={styles.input}
              placeholder="Enter service category name"
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Service Category Image</label>

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
              hidden
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />

            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className={styles.preview} />
            ) : (
              <p className={styles.noImage}>No image selected</p>
            )}
          </div>
        </section>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Add Service Category"}
        </button>
      </form>

      <MobileNavbar />
    </div>
  );
};

export default CreateServiceCategory;

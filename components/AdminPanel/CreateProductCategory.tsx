"use client";

import React, { useState, useRef } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import MobileNavbar from "../Layout/MobileNavbar";
import { API_URL } from "@/config/api";

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const CreateCategory = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [exploreImage, setExploreImage] = useState<File | null>(null);
  const [explorePreview, setExplorePreview] = useState<string | null>(null);

  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exploreInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  /* ================= MAIN IMAGE ================= */
  const handleCategoryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Image must be ≤ 1MB");
      return;
    }

    setError("");
    setCategoryImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* ================= EXPLORE IMAGE ================= */
  const handleExploreImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Explore image must be ≤ 1MB");
      return;
    }

    setError("");
    setExploreImage(file);
    setExplorePreview(URL.createObjectURL(file));
  };

  /* ================= CREATE CATEGORY ================= */
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    if (!categoryImage) {
      setError("Please upload category image");
      return;
    }

    try {
      const base64Image = await convertToBase64(categoryImage);

      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName.trim(),
          imageUrl: base64Image,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Category created successfully");

      setCategoryName("");
      setCategoryImage(null);
      setPreviewUrl(null);
      setError("");

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  /* ================= UPLOAD EXPLORE IMAGE ================= */
  const handleExploreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exploreImage) {
      setError("Please select explore image");
      return;
    }

    try {
      const base64Explore = await convertToBase64(exploreImage);

      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Explore Image Only",
          exploreImage: base64Explore,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Explore image uploaded");

      setExploreImage(null);
      setExplorePreview(null);

      if (exploreInputRef.current) exploreInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Explore upload failed");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Category Management</h1>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleCreateCategory}>
        {/* ================= CATEGORY DETAILS ================= */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Create Category</h2>

          <div className={styles.field}>
            <label className={styles.label}>Category Name</label>
            <input
              className={styles.input}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Dermatology"
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Category Image</label>

            <div className={styles.uploadBox}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </button>
              <span className={styles.uploadHint}>Max size 1MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCategoryImage}
            />

            {previewUrl && (
              <img src={previewUrl} className={styles.preview} />
            )}
          </div>
        </section>

        <button className={styles.submitBtn}>Create Category</button>
      </form>

      {/* ================= EXPLORE IMAGE ================= */}
      <form className={styles.form} onSubmit={handleExploreSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Explore Category Image</h2>

          <div className={styles.uploadBox}>
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => exploreInputRef.current?.click()}
            >
              Upload Explore Image
            </button>
            <span className={styles.uploadHint}>Max size 1MB</span>
          </div>

          <input
            ref={exploreInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleExploreImage}
          />

          {explorePreview ? (
            <img src={explorePreview} className={styles.preview} />
          ) : (
            <p className={styles.noImage}>No explore image uploaded</p>
          )}
        </section>

        <button className={styles.submitBtn}>Save Explore Image</button>
      </form>

      <MobileNavbar />
    </div>
  );
};

export default CreateCategory;

"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/Dashboard/createcliniccategory.module.css";
import MobileNavbar from "../Layout/MobileNavbar";
import { API_URL } from "@/config/api";

// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

/* ✅ AUTO CATEGORY ID GENERATOR */
const generateCategoryId = () =>
  `CAT-${Date.now().toString().slice(-6)}`;

const CreateClinicCategory = () => {
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [exploreImage, setExploreImage] = useState<File | null>(null);
  const [explorePreview, setExplorePreview] = useState<string | null>(null);
  const [latestCategoryId, setLatestCategoryId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exploreInputRef = useRef<HTMLInputElement>(null);

  /* ================= AUTO CATEGORY ID ON LOAD ================= */
  useEffect(() => {
    if (!categoryId) {
      setCategoryId(generateCategoryId());
    }
  }, [categoryId]);

  /* ================= FETCH LATEST CATEGORY ================= */
  const fetchLatestCategory = async () => {
    try {
      const res = await fetch(`${API_URL}/clinic-categories`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLatestCategoryId(data[0]._id);
        setExplorePreview(data[0].exploreImage || null);
      }
    } catch (err) {
      console.error("Failed to fetch latest category:", err);
    }
  };

  useEffect(() => {
    fetchLatestCategory();
  }, []);

  /* ================= BASE64 CONVERTER ================= */
  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  /* ================= IMAGE HANDLERS ================= */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Image must be less than or equal to 1MB.");
      return;
    }

    setError("");
    setCategoryImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleExploreImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Explore image must be less than or equal to 1MB.");
      return;
    }

    setError("");
    setExploreImage(file);
  };

  /* ================= CREATE CATEGORY ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !categoryName || !categoryImage) {
      setError("All fields are required");
      return;
    }

    try {
      const base64 = await convertToBase64(categoryImage);

      const res = await fetch(`${API_URL}/clinic-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: categoryId.trim(),
          name: categoryName.trim(),
          imageUrl: base64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Clinic category created successfully");

      /* 🔄 RESET (AUTO-GENERATE NEW ID AGAIN) */
      setCategoryId(generateCategoryId());
      setCategoryName("");
      setCategoryImage(null);
      setPreviewUrl(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      fetchLatestCategory();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  /* ================= EXPLORE IMAGE UPLOAD ================= */
  const handleExploreUpload = async () => {
    if (!exploreImage || !latestCategoryId) {
      setError("Missing explore image or category");
      return;
    }

    try {
      const base64 = await convertToBase64(exploreImage);

      const res = await fetch(
        `${API_URL}/clinic-categories/explore-image/${latestCategoryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exploreImage: base64 }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Explore image updated");
      setExploreImage(null);
      setExplorePreview(data.exploreImage);
      if (exploreInputRef.current) exploreInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Upload failed");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Clinic Category Management</h1>

      {error && <p className={styles.error}>{error}</p>}

      {/* ================= CREATE CATEGORY ================= */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Create Clinic Category</h3>

          <div className={styles.field}>
            <label className={styles.label}>Category ID</label>
            <input
              className={styles.input}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="Unique category ID"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category Name</label>
            <input
              className={styles.input}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Clinic category name"
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Category Image</label>

            {/* 🔥 PREMIUM CHOOSE IMAGE UX (NO REMOVAL) */}
            

            <input
            // className={styles.uploadBtn}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {previewUrl && (
              <img src={previewUrl} className={styles.preview} />
            )}
          </div>
        </div>

        <button className={styles.submitBtn}>Create Category</button>
      </form>

      {/* ================= EXPLORE IMAGE ================= */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Explore Category Image</h3>

        {explorePreview ? (
          <img src={explorePreview} className={styles.preview} />
        ) : (
          <p className={styles.noImage}>No explore image uploaded</p>
        )}

        <input
          ref={exploreInputRef}
          type="file"
          accept="image/*"
          onChange={handleExploreImageChange}
        />

        <button className={styles.submitBtn} onClick={handleExploreUpload}>
          Upload Explore Image
        </button>
      </div>

      <MobileNavbar />
    </div>
  );
};

export default CreateClinicCategory;

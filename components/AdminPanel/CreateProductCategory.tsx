"use client";

import React, { useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import MobileNavbar from "../Layout/MobileNavbar";
import { API_URL } from "@/config/api";

const CreateCategory = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [exploreImage, setExploreImage] = useState<File | null>(null);
  const [explorePreview, setExplorePreview] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingExplore, setLoadingExplore] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exploreInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const isAllowedImage = (file: File) =>
    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);

  const validateImage = (file: File, label: string) => {
    if (!isAllowedImage(file)) {
      setError(`${label} must be JPG, JPEG, PNG, or WEBP`);
      return false;
    }
    if (file.size > 1024 * 1024) {
      setError(`${label} must be less than or equal to 1MB`);
      return false;
    }
    return true;
  };

  const handleCategoryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file, "Category image")) return;
    setError("");
    setCategoryImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleExploreImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file, "Explore image")) return;
    setError("");
    setExploreImage(file);
    setExplorePreview(URL.createObjectURL(file));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    if (!categoryImage) {
      setError("Please upload category image");
      return;
    }

    try {
      setLoadingCategory(true);
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

      alert("Category created successfully");

      setCategoryName("");
      setCategoryImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoadingCategory(false);
    }
  };

  const handleExploreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!exploreImage) {
      setError("Please select explore image");
      return;
    }

    try {
      setLoadingExplore(true);
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

      alert("Explore image uploaded");
      setExploreImage(null);
      setExplorePreview(null);
      if (exploreInputRef.current) exploreInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Explore upload failed");
    } finally {
      setLoadingExplore(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Product Category</h1>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleCreateCategory}>
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
              <span className={styles.uploadHint}>JPG/PNG/WEBP - Max 1MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              hidden
              onChange={handleCategoryImage}
            />

            {previewUrl ? (
              <img src={previewUrl} className={styles.preview} alt="Category preview" />
            ) : (
              <p className={styles.noImage}>No image selected</p>
            )}
          </div>
        </section>

        <button className={styles.submitBtn} disabled={loadingCategory}>
          {loadingCategory ? "Creating..." : "Create Category"}
        </button>
      </form>

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
            <span className={styles.uploadHint}>JPG/PNG/WEBP - Max 1MB</span>
          </div>

          <input
            ref={exploreInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            hidden
            onChange={handleExploreImage}
          />

          {explorePreview ? (
            <img src={explorePreview} className={styles.preview} alt="Explore preview" />
          ) : (
            <p className={styles.noImage}>No explore image uploaded</p>
          )}
        </section>

        <button className={styles.submitBtn} disabled={loadingExplore}>
          {loadingExplore ? "Saving..." : "Save Explore Image"}
        </button>
      </form>

      <MobileNavbar />
    </div>
  );
};

export default CreateCategory;

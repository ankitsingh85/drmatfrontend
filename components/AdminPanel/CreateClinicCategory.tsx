"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcliniccategory.module.css";
import MobileNavbar from "../Layout/MobileNavbar";
import { API_URL } from "@/config/api";

const generateCategoryId = () => `CAT-${Date.now().toString().slice(-6)}`;

const CreateClinicCategory = () => {
  const [categoryId, setCategoryId] = useState(generateCategoryId());
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [exploreImage, setExploreImage] = useState<File | null>(null);
  const [explorePreview, setExplorePreview] = useState<string | null>(null);
  const [latestCategoryId, setLatestCategoryId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file, "Category image")) return;
    setError("");
    setCategoryImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleExploreImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file, "Explore image")) return;
    setError("");
    setExploreImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!categoryId.trim() || !categoryName.trim() || !categoryImage) {
      setError("Category ID, name and image are required");
      return;
    }

    try {
      setLoading(true);
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

      alert("Clinic category created successfully");
      setCategoryId(generateCategoryId());
      setCategoryName("");
      setCategoryImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchLatestCategory();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleExploreUpload = async () => {
    setError("");
    if (!exploreImage || !latestCategoryId) {
      setError("Please select explore image");
      return;
    }

    try {
      setLoading(true);
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

      alert("Explore image updated");
      setExploreImage(null);
      setExplorePreview(data.exploreImage);
      if (exploreInputRef.current) exploreInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Clinic Category</h1>
      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Category Details</h3>

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
              <img src={previewUrl} className={styles.preview} alt="Category preview" />
            ) : (
              <p className={styles.noImage}>No image selected</p>
            )}
          </div>
        </section>

        <button className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Category"}
        </button>
      </form>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Explore Category Image</h3>

        {explorePreview ? (
          <img src={explorePreview} className={styles.preview} alt="Explore preview" />
        ) : (
          <p className={styles.noImage}>No explore image uploaded</p>
        )}

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
          hidden
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleExploreImageChange}
        />

        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleExploreUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Save Explore Image"}
        </button>
      </section>

      <MobileNavbar />
    </div>
  );
};

export default CreateClinicCategory;

"use client";
import React, { useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcliniccategory.module.css";
import { API_URL } from "@/config/api";

const generateCategoryId = () => `CAT-${Date.now().toString().slice(-6)}`;

const CreateClinicCategory = () => {
  const [categoryId, setCategoryId] = useState(generateCategoryId());
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImage(file, "Category image")) return;
    setError("");
    setCategoryImage(file);
    setPreviewUrl(URL.createObjectURL(file));
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
      const formData = new FormData();
      formData.append("categoryId", categoryId.trim());
      formData.append("name", categoryName.trim());
      formData.append("imageUrl", categoryImage);

      const res = await fetch(`${API_URL}/clinic-categories`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Clinic category created successfully");
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
      setCategoryId(generateCategoryId());
      setCategoryName("");
      setCategoryImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* <h1 className={styles.heading}>Create Clinic Category</h1> */}
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
    </div>
  );
};

export default CreateClinicCategory;

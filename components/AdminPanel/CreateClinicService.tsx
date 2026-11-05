"use client";

import React, { useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";

const CreateClinicService = () => {
  const toast = useToast();
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceImage, setServiceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAllowedImage = (file: File) =>
    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedImage(file)) {
      setError("Image must be JPG, JPEG, PNG, or WEBP");
      setServiceImage(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Image must be less than or equal to 1MB");
      setServiceImage(null);
      setPreviewUrl(null);
      return;
    }

    setError("");
    setServiceImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serviceName.trim()) {
      setError("Clinic service name is required");
      return;
    }

    if (!description.trim()) {
      setError("Clinic service description is required");
      return;
    }

    if (!serviceImage) {
      setError("Please select an image");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", serviceName.trim());
      formData.append("description", description.trim());
      formData.append("imageUrl", serviceImage);

      const response = await fetch(`${API_URL}/clinic-services`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create clinic service");

      setServiceName("");
      setDescription("");
      setServiceImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Clinic service created successfully");
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Clinic Service Details</h2>

          <div className={styles.field}>
            <label className={styles.label}>Service Name</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className={styles.input}
              placeholder="Enter clinic service name"
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.input}
              placeholder="Enter clinic service description"
              rows={4}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>Service Image</label>

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
          {loading ? "Creating..." : "Add Clinic Service"}
        </button>
      </form>
    </div>
  );
};

export default CreateClinicService;

"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/listofcliniccategory.module.css";

interface ClinicCategory {
  _id: string;
  categoryId: string;
  name: string;
  imageUrl: string; // base64 string
}

// ✅ Use environment variable for API base
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ListOfClinicCategory = () => {
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ClinicCategory | null>(null);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/clinic-categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch clinic categories:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this clinic category?")) return;

    try {
      const res = await fetch(`${API_URL}/clinic-categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete clinic category");
        return;
      }

      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (cat: ClinicCategory) => {
    setEditingCategory(cat);
    setEditCategoryId(cat.categoryId);
    setEditName(cat.name);
    setPreviewUrl(cat.imageUrl);
    setEditImage(null);
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError("Image must be ≤ 1MB");
        return;
      }
      setError("");
      setEditImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editCategoryId.trim()) {
      setError("Category ID is required");
      return;
    }

    if (!editName.trim()) {
      setError("Clinic category name is required");
      return;
    }

    try {
      let imageUrl = previewUrl;

      if (editImage) {
        if (editImage.size > 1024 * 1024) {
          setError("Image must be ≤ 1MB");
          return;
        }
        imageUrl = await convertToBase64(editImage);
      }

      const res = await fetch(`${API_URL}/clinic-categories/${editingCategory?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editCategoryId.trim(),
          name: editName.trim(),
          imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to update clinic category");
        return;
      }

      setCategories((prev) =>
        prev.map((cat) => (cat._id === data._id ? data : cat))
      );

      setEditingCategory(null);
      setEditImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Update failed:", error);
      setError("Unexpected error occurred");
    }
  };

  const handleCloseModal = () => {
    setEditingCategory(null);
    setError("");
    setEditImage(null);
    setPreviewUrl(null);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>List of Clinic Categories</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Category ID</th>
            <th>Name</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat._id}>
              <td>{cat.categoryId}</td>
              <td>{cat.name}</td>
              <td>
                <img src={cat.imageUrl} alt={cat.name} className={styles.image} />
              </td>
              <td>
                <button className={styles.editBtn} onClick={() => handleEdit(cat)}>
                  Edit
                </button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(cat._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingCategory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Clinic Category</h3>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleEditSubmit}>
              <label>Category ID (Unique)</label>
              <input
                type="text"
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                required
              />

              <label>Category Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <label>Category Image (Max 1MB)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {previewUrl && (
                <img src={previewUrl} className={styles.preview} alt="Preview" />
              )}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>
                  Save
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfClinicCategory;

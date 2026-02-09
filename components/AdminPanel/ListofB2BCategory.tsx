"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/listofcliniccategory.module.css";

interface Category {
  _id: string;
  name: string;
  imageUrl: string;
}

export default function ListofB2BCategory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/b2b-categories`);
    const data = await res.json();
    setCategories(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;

    await fetch(`${API_URL}/b2b-categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditForm({
      name: cat.name,
    });
    setPreviewUrl(cat.imageUrl);
    setEditImage(null);
    setError("");
    setIsEditing(true);
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
    if (!editName.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      let imageUrl = previewUrl;
      if (editImage) imageUrl = await convertToBase64(editImage);

      const res = await fetch(`${API_URL}/b2b-categories/${editingCategory?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name?.trim(), imageUrl }),
      });

      if (!res.ok) throw new Error("Failed to update category");

      const updated = await res.json();
      setCategories((prev) =>
        prev.map((cat) => (cat._id === updated._id ? updated : cat))
      );

      handleCloseModal();
    } catch (error) {
      console.error("Update failed:", error);
      setError("Failed to update category");
    }
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setEditingCategory(null);
    setEditForm({});
    setEditImage(null);
    setPreviewUrl(null);
    setError("");
  };

  const editName = editForm.name || "";

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>B2B Category List</h2>

      <input
        className={styles.search}
        placeholder="Search category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Image</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((cat, index) => (
              <tr key={cat._id}>
                <td>{index + 1}</td>
                <td>{cat.name}</td>
                <td>
                  <img src={cat.imageUrl} className={styles.image} alt={cat.name} />
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(cat)}
                      title="Edit category"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(cat._id)}
                      title="Delete category"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.noData}>
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && editingCategory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit B2B Category</h3>
            {error && <p className={styles.error}>{error}</p>}

            <form onSubmit={handleEditSubmit}>
              <label>Category Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Category name"
                required
              />

              <label>Category Image (Max 1MB)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />

              {previewUrl && (
                <img src={previewUrl} alt="Preview" className={styles.preview} />
              )}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>
                  Save
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

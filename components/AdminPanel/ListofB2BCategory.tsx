"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcliniccategory.module.css";

interface Category {
  _id: string;
  name: string;
  imageUrl: string;
}

export default function ListofB2BCategory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["Name", "Image URL"],
      ...filtered.map((cat) => [cat.name, cat.imageUrl || ""]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "b2b-categories.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      alert("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filtered
      .map(
        (cat) => `<tr>
          <td>${escapeHtml(cat.name)}</td>
          <td>${escapeHtml(cat.imageUrl || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>B2B Categories List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>B2B Categories List</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Image URL</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>B2B Category List</h2>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${styles.filter} ${styles.pageFilter}`}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadCSV}
        >
          Download CSV
        </button>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>

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
            {paginatedCategories.map((cat, index) => (
              <tr key={cat._id}>
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
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

            {paginatedCategories.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.noData}>
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0 }}>
          Showing {paginatedCategories.length} of {filtered.length}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === 1 ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span style={{ alignSelf: "center" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === totalPages ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
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

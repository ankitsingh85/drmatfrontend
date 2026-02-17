"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";

interface Category {
  _id: string;
  id: string;
  name: string;
  imageUrl: string;
}

// ✅ Use environment variable for API base
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ListOfCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");


  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();

      const validCategories = data
        .map((cat: any) => ({
          _id: cat._id,
          id: cat.id,
          name: cat.name,
          imageUrl: cat.imageUrl,
        }))
        .filter((cat: Category) => cat._id && cat.id);

      setCategories(validCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
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
    if (!editName.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      let imageUrl = previewUrl;
      if (editImage) imageUrl = await convertToBase64(editImage);

      const res = await fetch(
        `${API_URL}/categories/${editingCategory?._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName.trim(), imageUrl }),
        }
      );
      if (!res.ok) throw new Error("Failed to update category");

      const updated = await res.json();
      setCategories((prev) =>
        prev.map((cat) => (cat._id === updated._id ? updated : cat))
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

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        cat.id.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const rows = [
      ["ID", "Name", "Image URL"],
      ...filteredCategories.map((cat) => [cat.id, cat.name, cat.imageUrl || ""]),
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
    link.download = "categories.csv";
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

    const rows = filteredCategories
      .map(
        (cat) => `<tr>
          <td>${escapeHtml(cat.id)}</td>
          <td>${escapeHtml(cat.name)}</td>
          <td>${escapeHtml(cat.imageUrl || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Categories List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Categories List</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
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
      <h2 className={styles.title}>List of Product Categories</h2>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by category ID or name..."
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
      <div className={styles.tableWrap}>
        <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCategories.map((cat) => (
            <tr key={cat._id}>
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>
                <img src={cat.imageUrl} alt={cat.name} className={styles.image} />
              </td>
              <td className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(cat)}>
                  ✏️
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(cat._id)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
          {paginatedCategories.length === 0 && (
            <tr>
              <td colSpan={4}>No categories found.</td>
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
          Showing {paginatedCategories.length} of {filteredCategories.length}
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

      {editingCategory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Category</h3>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleEditSubmit}>
              <label>Category ID</label>
              <input type="text" value={editingCategory.id} disabled />

              <label>Category Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <label>Category Image (Max 1MB)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {previewUrl && <img src={previewUrl} className={styles.preview} />}

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

export default ListOfCategory;

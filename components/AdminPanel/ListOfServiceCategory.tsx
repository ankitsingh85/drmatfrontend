"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import { API_URL } from "@/config/api";

interface ServiceCategory {
  _id: string;
  name: string;
  imageUrl: string; // base64
}

// ✅ Use environment variable for API
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ListOfServiceCategory = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const premiumButtonStyle: React.CSSProperties = {
    border: "1px solid #d6d6d6",
    borderRadius: 10,
    padding: "9px 14px",
    background: "linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
  };

  const premiumButtonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/service-categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch service categories:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service category?")) return;

    try {
      const res = await fetch(`${API_URL}/service-categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete service category");
        return;
      }

      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (cat: ServiceCategory) => {
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

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError("Service category name is required");
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

      const res = await fetch(
        `${API_URL}/service-categories/${editingCategory?._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName.trim(),
            imageUrl,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update service category");
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

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
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
      ["#", "Name", "Image URL"],
      ...filteredCategories.map((cat, index) => [
        `ServiceCat-${index + 1}`,
        cat.name,
        cat.imageUrl || "",
      ]),
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
    link.download = "service-categories.csv";
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
        (cat, index) => `<tr>
          <td>${escapeHtml(`ServiceCat-${index + 1}`)}</td>
          <td>${escapeHtml(cat.name)}</td>
          <td>${escapeHtml(cat.imageUrl || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Service Categories List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Service Categories List</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
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
      <h2 className={styles.title}>List of Service Categories</h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <input
          className={styles.search}
          placeholder="Search by service category name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadCSV}>
          Download CSV
        </button>
        <button type="button" style={premiumButtonStyle} onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCategories.map((cat, index) => (
            <tr key={cat._id}>
              <td>{`ServiceCat-${(currentPage - 1) * itemsPerPage + index + 1}`}</td>
              <td>{cat.name}</td>
              <td>
                <img src={cat.imageUrl} alt={cat.name} className={styles.image} />
              </td>
              <td>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEdit(cat)}
                >
                  Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(cat._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {paginatedCategories.length === 0 && (
            <tr>
              <td colSpan={4}>No service categories found.</td>
            </tr>
          )}
        </tbody>
      </table>
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
            style={{
              ...premiumButtonStyle,
              ...(currentPage === 1 ? premiumButtonDisabledStyle : {}),
            }}
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
            style={{
              ...premiumButtonStyle,
              ...(currentPage === totalPages ? premiumButtonDisabledStyle : {}),
            }}
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
            <h3>Edit Service Category</h3>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleEditSubmit}>
              <label>Service Category Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <label>Service Category Image (Max 1MB)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewUrl && (
                <img src={previewUrl} className={styles.preview} alt="Preview" />
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
};

export default ListOfServiceCategory;

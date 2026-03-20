"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";

interface CourseType {
  _id: string;
  id: string;
  name: string;
  imageUrl: string;
}

const ListOfCourseType = () => {
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingCourseType, setEditingCourseType] = useState<CourseType | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourseTypes();
  }, []);

  const fetchCourseTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/course-types`);
      const data = await res.json().catch(() => []);

      const validCourseTypes = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          _id: item._id,
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
        }))
        .filter((item: CourseType) => item._id && item.id);

      setCourseTypes(validCourseTypes);
    } catch (fetchError) {
      console.error("Failed to fetch course types:", fetchError);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course type?")) return;

    try {
      const res = await fetch(`${API_URL}/course-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete course type");
      setCourseTypes((prev) => prev.filter((item) => item._id !== id));
    } catch (deleteError) {
      console.error("Delete error:", deleteError);
    }
  };

  const handleEdit = (item: CourseType) => {
    setEditingCourseType(item);
    setEditName(item.name);
    setPreviewUrl(item.imageUrl);
    setEditImage(null);
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Image must be less than or equal to 1MB");
      return;
    }

    setError("");
    setEditImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim()) {
      setError("Course type name is required");
      return;
    }

    try {
      let imageUrl = previewUrl;
      if (editImage) {
        imageUrl = await convertToBase64(editImage);
      }

      const res = await fetch(`${API_URL}/course-types/${editingCourseType?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          imageUrl,
        }),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated.message || "Failed to update course type");

      setCourseTypes((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );

      handleCloseModal();
    } catch (updateError: any) {
      setError(updateError.message || "Unexpected error occurred");
    }
  };

  const handleCloseModal = () => {
    setEditingCourseType(null);
    setEditName("");
    setEditImage(null);
    setPreviewUrl(null);
    setError("");
  };

  const filteredCourseTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courseTypes;
    return courseTypes.filter(
      (item) =>
        item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    );
  }, [courseTypes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCourseTypes.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCourseTypes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourseTypes.slice(start, start + itemsPerPage);
  }, [filteredCourseTypes, currentPage, itemsPerPage]);

  return (
    <div className={styles.container}>
      {/* <h2 className={styles.title}>List of Course Types</h2> */}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by course type ID or name..."
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
            {paginatedCourseTypes.map((item) => (
              <tr key={item._id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>
                  <img src={item.imageUrl} alt={item.name} className={styles.image} />
                </td>
                <td className={styles.actions}>
                  <button className={styles.editBtn} onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {paginatedCourseTypes.length === 0 && (
              <tr>
                <td colSpan={4}>No course types found.</td>
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
          Showing {paginatedCourseTypes.length} of {filteredCourseTypes.length}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === 1 ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {editingCourseType && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Course Type</h3>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleEditSubmit}>
              <label>Course Type ID</label>
              <input type="text" value={editingCourseType.id} disabled />

              <label>Course Type Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <label>Course Type Image (Max 1MB)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {previewUrl && <img src={previewUrl} className={styles.preview} alt="Preview" />}

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

export default ListOfCourseType;

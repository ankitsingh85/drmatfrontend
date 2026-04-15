"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import { resolveMediaUrl } from "@/lib/media";

interface TrainingType {
  _id: string;
  name: string;
  imageUrl: string;
}

const notifyTrainingTypeChange = () => {
  window.dispatchEvent(new Event("admin-dashboard:create-success"));
};

const ListOfTrainingType = () => {
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingTrainingType, setEditingTrainingType] =
    useState<TrainingType | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrainingTypes();
  }, []);

  const fetchTrainingTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/training-types`);
      const data = await res.json().catch(() => []);

      const validTrainingTypes = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          _id: String(item._id || ""),
          name: item.name,
          imageUrl: item.imageUrl,
        }))
        .filter((item: TrainingType) => item._id && item.name);

      setTrainingTypes(validTrainingTypes);
    } catch (fetchError) {
      console.error("Failed to fetch training types:", fetchError);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training type?")) return;

    try {
      const res = await fetch(`${API_URL}/training-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete training type");
      setTrainingTypes((prev) => prev.filter((item) => item._id !== id));
      notifyTrainingTypeChange();
    } catch (deleteError) {
      console.error("Delete error:", deleteError);
    }
  };

  const handleEdit = (item: TrainingType) => {
    setEditingTrainingType(item);
    setEditName(item.name);
    setPreviewUrl(resolveMediaUrl(item.imageUrl));
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim()) {
      setError("Training type name is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      if (editImage) {
        formData.append("imageUrl", editImage);
      }

      const res = await fetch(`${API_URL}/training-types/${editingTrainingType?._id}`, {
        method: "PUT",
        body: formData,
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated.message || "Failed to update training type");

      setTrainingTypes((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );

      notifyTrainingTypeChange();
      handleCloseModal();
    } catch (updateError: any) {
      setError(updateError.message || "Unexpected error occurred");
    }
  };

  const handleCloseModal = () => {
    setEditingTrainingType(null);
    setEditName("");
    setEditImage(null);
    setPreviewUrl(null);
    setError("");
  };

  const filteredTrainingTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainingTypes;
    return trainingTypes.filter(
      (item) => item.name.toLowerCase().includes(q)
    );
  }, [trainingTypes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTrainingTypes.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedTrainingTypes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrainingTypes.slice(start, start + itemsPerPage);
  }, [filteredTrainingTypes, currentPage, itemsPerPage]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by training type name..."
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
              <th>Name</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrainingTypes.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>
                  <img
                    src={resolveMediaUrl(item.imageUrl) || item.imageUrl}
                    alt={item.name}
                    className={styles.image}
                  />
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
            {paginatedTrainingTypes.length === 0 && (
              <tr>
                <td colSpan={3}>No training types found.</td>
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
          Showing {paginatedTrainingTypes.length} of {filteredTrainingTypes.length}
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

      {editingTrainingType && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Training Type</h3>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleEditSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Training Type Name</label>
                <input
                  className={styles.input}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className={styles.fullField}>
                <label className={styles.label}>Training Type Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={styles.preview}
                    style={{ marginTop: 12 }}
                  />
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>
                  Update
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

export default ListOfTrainingType;

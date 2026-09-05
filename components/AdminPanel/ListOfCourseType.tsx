"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";

interface CourseType {
  _id: string;
  id: string;
  name: string;
  imageUrl: string;
}

type ListOfCourseTypeProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const ListOfCourseType = ({ canEdit = true, canDelete = true }: ListOfCourseTypeProps) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingCourseType, setEditingCourseType] = useState<CourseType | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
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
    if (!(await confirmDialog("Are you sure you want to delete this course type?", { danger: true }))) return;

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
    setPreviewUrl(resolveMediaUrl(item.imageUrl));
    setExistingImageUrl(item.imageUrl);
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
      setError("Course type name is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      if (editImage) {
        formData.append("imageUrl", editImage);
      }

      const res = await fetch(`${API_URL}/course-types/${editingCourseType?._id}`, {
        method: "PUT",
        body: formData,
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
    setExistingImageUrl("");
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

  const bulkSelection = useBulkSelection(paginatedCourseTypes, (item) => item._id);

  const handleDownloadCSV = () => {
    const rows = [
      ["ID", "Name", "Image URL"],
      ...filteredCourseTypes.map((item) => [
        item.id,
        item.name,
        item.imageUrl || "",
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
    link.download = "course-types.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredCourseTypes
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.id)}</td>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.imageUrl || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Course Types List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Course Types List</h2>
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

      <BulkSelectBar
        endpointPath="course-types"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="course types"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setCourseTypes((prev) => prev.filter((item) => !deletedIds.includes(item._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />

      <div className={`${styles.tableWrap} ${bulkStyles.tableScroll}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              {canDelete && (
                <th className={bulkStyles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={bulkSelection.isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = bulkSelection.isSomeSelected;
                    }}
                    onChange={bulkSelection.toggleAll}
                    aria-label="Select all course types on this page"
                  />
                </th>
              )}
              <th>ID</th>
              <th>Name</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCourseTypes.map((item) => (
              <tr key={item._id}>
                {canDelete && (
                  <td className={bulkStyles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isSelected(item._id)}
                      onChange={() => bulkSelection.toggle(item._id)}
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                )}
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>
                  <img
                    src={resolveMediaUrl(item.imageUrl) || item.imageUrl}
                    alt={item.name}
                    className={styles.image}
                  />
                </td>
                <td className={styles.actions}>
                  <TableActions
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item._id)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
            {paginatedCourseTypes.length === 0 && (
              <tr>
                <td colSpan={canDelete ? 5 : 4}>No course types found.</td>
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
              {!editImage && existingImageUrl && (
                <p className={styles.noImage}>Using existing uploaded image</p>
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

export default ListOfCourseType;

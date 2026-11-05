"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Dashboard/listofcategory.module.css";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";

interface ClinicService {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
}

type ListOfClinicServiceProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const ListOfClinicService = ({ canEdit = true, canDelete = true }: ListOfClinicServiceProps) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [services, setServices] = useState<ClinicService[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
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
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/clinic-services`);
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error("Failed to fetch clinic services:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Are you sure you want to delete this clinic service?", { danger: true }))) return;

    try {
      const res = await fetch(`${API_URL}/clinic-services/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete clinic service");
        return;
      }

      setServices((prev) => prev.filter((s) => s._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (service: ClinicService) => {
    setEditingService(service);
    setEditName(service.name);
    setEditDescription(service.description);
    setPreviewUrl(resolveMediaUrl(service.imageUrl));
    setExistingImageUrl(service.imageUrl);
    setEditImage(null);
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Image must be <= 1MB");
      return;
    }

    setError("");
    setEditImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError("Clinic service name is required");
      return;
    }
    if (!editDescription.trim()) {
      setError("Clinic service description is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      formData.append("description", editDescription.trim());
      if (editImage) {
        formData.append("imageUrl", editImage);
      }

      const res = await fetch(
        `${API_URL}/clinic-services/${editingService?._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update clinic service");
        return;
      }

      setServices((prev) =>
        prev.map((s) => (s._id === data._id ? data : s))
      );
      setEditingService(null);
      setEditImage(null);
      setPreviewUrl(null);
      setExistingImageUrl("");
    } catch (error) {
      console.error("Update failed:", error);
      setError("Unexpected error occurred");
    }
  };

  const handleCloseModal = () => {
    setEditingService(null);
    setError("");
    setEditImage(null);
    setPreviewUrl(null);
    setExistingImageUrl("");
  };

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [services, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  const bulkSelection = useBulkSelection(paginatedServices, (s) => s._id);

  const handleDownloadCSV = () => {
    const rows = [
      ["#", "Name", "Description", "Image URL"],
      ...filteredServices.map((s, index) => [
        `ClinicService-${index + 1}`,
        s.name,
        s.description,
        s.imageUrl || "",
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
    link.download = "clinic-services.csv";
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

    const rows = filteredServices
      .map(
        (s, index) => `<tr>
          <td>${escapeHtml(`ClinicService-${index + 1}`)}</td>
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.description || "-")}</td>
          <td>${escapeHtml(s.imageUrl || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Clinic Services List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Clinic Services List</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
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
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={itemsPerPage} style={premiumButtonStyle}
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
      <BulkSelectBar
        endpointPath="clinic-services"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="clinic services"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setServices((prev) => prev.filter((s) => !deletedIds.includes(s._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />
      <div className={bulkStyles.tableScroll}>
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
                  aria-label="Select all clinic services on this page"
                />
              </th>
            )}
            <th
              className={styles.frozenCell}
              style={{ left: canDelete ? 36 : 0, width: 100, minWidth: 100 }}
            >
              #
            </th>
            <th
              className={styles.frozenCell}
              style={{ left: canDelete ? 136 : 100, width: 160, minWidth: 160 }}
            >
              Name
            </th>
            <th>Description</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedServices.map((service, index) => (
            <tr key={service._id}>
              {canDelete && (
                <td className={bulkStyles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={bulkSelection.isSelected(service._id)}
                    onChange={() => bulkSelection.toggle(service._id)}
                    aria-label={`Select ${service.name}`}
                  />
                </td>
              )}
              <td
                className={styles.frozenCell}
                style={{ left: canDelete ? 36 : 0, width: 100, minWidth: 100 }}
              >
                {`ClinicService-${(currentPage - 1) * itemsPerPage + index + 1}`}
              </td>
              <td
                className={styles.frozenCell}
                style={{ left: canDelete ? 136 : 100, width: 160, minWidth: 160 }}
              >
                {service.name}
              </td>
              <td style={{ maxWidth: 320 }}>{service.description}</td>
              <td>
                <img
                  src={resolveMediaUrl(service.imageUrl) || service.imageUrl}
                  alt={service.name}
                  className={styles.image}
                />
              </td>
              <td>
                <TableActions
                  onEdit={() => handleEdit(service)}
                  onDelete={() => handleDelete(service._id)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              </td>
            </tr>
          ))}
          {paginatedServices.length === 0 && (
            <tr>
              <td colSpan={canDelete ? 6 : 5}>No clinic services found.</td>
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
          Showing {paginatedServices.length} of {filteredServices.length}
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

      {editingService && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit Clinic Service</h3>
            {error && <p className={styles.error}>{error}</p>}
            <form onSubmit={handleEditSubmit}>
              <label>Service Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <label>Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                style={{ resize: "vertical", width: "100%" }}
                required
              />

              <label>Service Image (Max 1MB)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewUrl && (
                <img src={previewUrl} className={styles.preview} alt="Preview" />
              )}
              {!editImage && existingImageUrl && (
                <p className={styles.noImage}>Using existing uploaded image</p>
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

export default ListOfClinicService;

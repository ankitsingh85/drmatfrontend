"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "@/styles/Dashboard/listofdoctor.module.css";
import createStyles from "@/styles/Dashboard/createdoctor.module.css";
import { API_URL } from "@/config/api";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";
import { resolveMediaUrl, getExportSafeMediaValue } from "@/lib/media";
// import { ListOfDoctors } from '@/components/ClinicAdmin/ListOfDoctors';

interface Doctor {
  _id: string;
  doctorCode: string;
  title?: string;
  firstName: string;
  lastName: string;
  specialist: string;
  email: string;
  phone?: string;
  description?: string;
  profileImage?: string;
  address?: string;
  isAvailableForConsultation?: boolean;
  createdAt: string;
}

const titles = ["Dr.", "Prof.", "Mr.", "Ms."];
const specialists = [
  "Dermatologist",
  "Cardiologist",
  "Neurologist",
  "Pediatrician",
  "Orthopedic",
];

type ListOfDoctorProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const ListOfDoctor: React.FC<ListOfDoctorProps> = ({ canEdit = true, canDelete = true }) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Doctor & { password?: string }>
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [editProfilePreview, setEditProfilePreview] = useState("");

  const [modalOpen, setModalOpen] = useState(false); // kept
  const [error, setError] = useState("");

  /* ================= FETCH ================= */
  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/doctoradmin`);
      setDoctors(res.data);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Are you sure you want to delete this doctor?", { danger: true }))) return;
    await axios.delete(`${API_URL}/doctoradmin/${id}`);
    fetchDoctors();
  };

  /* ================= EDIT ================= */
  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditForm({
      title: doctor.title,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialist: doctor.specialist,
      email: doctor.email, // ✅ PREFILL EMAIL
      phone: doctor.phone || "",
      description: doctor.description || "",
      address: doctor.address || "",
      password: "",
    });
    setEditProfileImage(null);
    setEditProfilePreview(doctor.profileImage ? resolveMediaUrl(doctor.profileImage) || "" : "");
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setEditProfileImage(file);
    setEditProfilePreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      const payload = new FormData();
      payload.append("title", editForm.title || "");
      payload.append("firstName", editForm.firstName || "");
      payload.append("lastName", editForm.lastName || "");
      payload.append("specialist", editForm.specialist || "");
      payload.append("email", editForm.email || ""); // ✅ EMAIL INCLUDED
      payload.append("phone", editForm.phone || "");
      payload.append("description", editForm.description || "");
      payload.append("address", editForm.address || "");

      if (editForm.password && editForm.password.trim()) {
        payload.append("password", editForm.password.trim());
      }

      if (editProfileImage) {
        payload.append("profileImage", editProfileImage);
      }

      await axios.put(
        `${API_URL}/doctoradmin/${editingDoctor._id}`,
        payload
      );

      toast.success("Doctor updated successfully");
      setIsEditing(false);
      setEditingDoctor(null);
      setEditForm({});
      setEditProfileImage(null);
      setEditProfilePreview("");
      fetchDoctors();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update doctor");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingDoctor(null);
    setEditForm({});
    setEditProfileImage(null);
    setEditProfilePreview("");
  };

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) =>
      [d.doctorCode, d.title, d.firstName, d.lastName, d.specialist, d.email, d.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [doctors, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDoctors.length / itemsPerPage)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDoctors.slice(start, start + itemsPerPage);
  }, [filteredDoctors, currentPage, itemsPerPage]);

  const bulkSelection = useBulkSelection(paginatedDoctors, (d) => d._id);

  const stripHtmlToText = (value: string | undefined, maxLength = 60) => {
    if (!value) return "-";
    const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  };

  const handleDownloadCSV = () => {
    const rows = [
      [
        "Doctor ID",
        "Photo",
        "Title",
        "First Name",
        "Last Name",
        "Specialist",
        "Email",
        "Phone",
        "Address",
        "Description",
        "Available",
        "Created",
      ],
      ...filteredDoctors.map((d) => [
        d.doctorCode,
        getExportSafeMediaValue(d.profileImage),
        d.title || "",
        d.firstName,
        d.lastName,
        d.specialist,
        d.email,
        d.phone || "",
        d.address || "-",
        stripHtmlToText(d.description),
        d.isAvailableForConsultation ? "Yes" : "No",
        d.createdAt ? String(d.createdAt).slice(0, 10) : "-",
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
    link.download = "doctors.csv";
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

    const rows = filteredDoctors
      .map(
        (d) =>
          `<tr>
            <td>${escapeHtml(d.doctorCode || "-")}</td>
            <td>${escapeHtml(getExportSafeMediaValue(d.profileImage))}</td>
            <td>${escapeHtml(d.title || "-")}</td>
            <td>${escapeHtml(d.firstName)}</td>
            <td>${escapeHtml(d.lastName)}</td>
            <td>${escapeHtml(d.specialist)}</td>
            <td>${escapeHtml(d.email)}</td>
            <td>${escapeHtml(d.phone || "-")}</td>
            <td>${escapeHtml(d.address || "-")}</td>
            <td>${escapeHtml(stripHtmlToText(d.description))}</td>
            <td>${d.isAvailableForConsultation ? "Yes" : "No"}</td>
            <td>${escapeHtml(d.createdAt ? String(d.createdAt).slice(0, 10) : "-")}</td>
          </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Doctors List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Doctors List</h2>
          <table>
            <thead>
              <tr>
                <th>Doctor ID</th>
                <th>Photo</th>
                <th>Title</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Specialist</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Description</th>
                <th>Available</th>
                <th>Created</th>
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

  if (loading) return <FullPageLoader />;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      {/* <h2 className={styles.title}>List of Doctors</h2> */}
      <div className={styles.toolbar}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by Doctor ID, name, title, specialist, email or phone"
          className={styles.search}
        />
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className={`${styles.filter} ${styles.pageFilter}`}
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

      {/* ================= TABLE ================= */}
      <BulkSelectBar
        endpointPath="doctoradmin"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="doctors"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setDoctors((prev) => prev.filter((d) => !deletedIds.includes(d._id)));
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
                  aria-label="Select all doctors on this page"
                />
              </th>
            )}
              <th className={styles.th}>Doctor ID</th>
            <th className={styles.th}>Photo</th>
            <th className={styles.th}>Title</th>
            <th className={styles.th}>First Name</th>
            <th className={styles.th}>Last Name</th>
            <th className={styles.th}>Specialist</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Phone</th>
            <th className={styles.th}>Address</th>
            <th className={styles.th}>Description</th>
            <th className={styles.th}>Available</th>
            <th className={styles.th}>Created</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedDoctors.map((d) => (
        <tr key={d._id}>
  {canDelete && (
    <td className={bulkStyles.checkboxCell}>
      <input
        type="checkbox"
        checked={bulkSelection.isSelected(d._id)}
        onChange={() => bulkSelection.toggle(d._id)}
        aria-label={`Select ${d.firstName} ${d.lastName}`}
      />
    </td>
  )}
  <td className={styles.td}>{d.doctorCode || "-"}</td>
  <td className={styles.td}>
    {d.profileImage ? (
      <img
        src={resolveMediaUrl(d.profileImage) || d.profileImage}
        alt={`${d.firstName} ${d.lastName}`}
        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
      />
    ) : (
      "-"
    )}
  </td>
  <td className={styles.td}>{d.title || "-"}</td>
  <td className={styles.td}>{d.firstName}</td>
  <td className={styles.td}>{d.lastName}</td>
  <td className={styles.td}>{d.specialist}</td>
  <td className={styles.td}>{d.email}</td>
  <td className={styles.td}>{d.phone || "-"}</td>
  <td className={styles.td}>{d.address || "-"}</td>
  <td className={styles.td}>{stripHtmlToText(d.description)}</td>
  <td className={styles.td}>{d.isAvailableForConsultation ? "Yes" : "No"}</td>
  <td className={styles.td}>{d.createdAt ? String(d.createdAt).slice(0, 10) : "-"}</td>

  <td className={styles.td}>
    <TableActions
      onEdit={() => handleEdit(d)}
      onDelete={() => handleDelete(d._id)}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  </td>
</tr>
          ))}
          {paginatedDoctors.length === 0 && (
            <tr>
              <td className={styles.td} colSpan={canDelete ? 13 : 12}>
                No doctors found.
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
          Showing {paginatedDoctors.length} of {filteredDoctors.length}
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

      {/* ================= INLINE EDIT FORM ================= */}
      {isEditing && editingDoctor && (
        <div className={createStyles.container} style={{ marginTop: 40 }}>
          <h1 className={createStyles.heading}>Edit Doctor</h1>

          <form className={createStyles.form} onSubmit={handleEditSubmit}>
            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Basic Information</h2>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Title</label>
                <select
                  name="title"
                  value={editForm.title || ""}
                  onChange={handleEditChange}
                  className={createStyles.select}
                >
                  <option value="">Select Title</option>
                  {titles.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>First Name</label>
                <input
                  name="firstName"
                  value={editForm.firstName || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Last Name</label>
                <input
                  name="lastName"
                  value={editForm.lastName || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                  required
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                />
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Specialist</label>
                <select
                  name="specialist"
                  value={editForm.specialist || ""}
                  onChange={handleEditChange}
                  className={createStyles.select}
                >
                  <option value="">Select Specialist</option>
                  {specialists.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className={createStyles.profileImageField}>
                <label className={createStyles.label}>Profile Picture</label>
                <div className={createStyles.profileImageRow}>
                  <div className={createStyles.profilePreview}>
                    {editProfilePreview ? (
                      <img src={editProfilePreview} alt="Doctor profile preview" />
                    ) : (
                      <span>Photo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditProfileImageChange}
                    className={createStyles.input}
                  />
                </div>
              </div>

              <div className={createStyles.field}>
                <label className={createStyles.label}>Address</label>
                <input
                  name="address"
                  value={editForm.address || ""}
                  onChange={handleEditChange}
                  className={createStyles.input}
                />
              </div>
            </div>

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Doctor Description</h2>
              <textarea
                name="description"
                value={editForm.description || ""}
                onChange={handleEditChange}
                className={createStyles.textarea}
              />
            </div>

            <div className={createStyles.section}>
              <h2 className={createStyles.sectionTitle}>Update Password</h2>
              <input
                type="password"
                name="password"
                value={editForm.password || ""}
                onChange={handleEditChange}
                className={createStyles.input}
                placeholder="Leave empty to keep current password"
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={createStyles.submitBtn}>
                Update Doctor
              </button>
              <button
                type="button"
                className={createStyles.submitBtn}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {modalOpen && editingDoctor && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Edit doctor</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfDoctor;

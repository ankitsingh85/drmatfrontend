"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "@/styles/Dashboard/listofdoctor.module.css";
import createStyles from "@/styles/Dashboard/createdoctor.module.css";
import { API_URL } from "@/config/api";
// import { ListOfDoctors } from '@/components/ClinicAdmin/ListOfDoctors';

interface Doctor {
  _id: string;
  title?: string;
  firstName: string;
  lastName: string;
  specialist: string;
  email: string;
  description?: string;
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

const ListOfDoctor: React.FC = () => {
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

  const [modalOpen, setModalOpen] = useState(false); // kept
  const [error, setError] = useState("");

  const premiumButtonStyle: React.CSSProperties = {
    border: "1px solid #d6d6d6",
    borderRadius: 10,
    padding: "9px 14px",
    background:
      "linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const premiumButtonDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

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
    if (!confirm("Are you sure you want to delete this doctor?")) return;
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
      description: doctor.description || "",
      password: "",
    });
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      const payload: any = {
        title: editForm.title,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        specialist: editForm.specialist,
        email: editForm.email, // ✅ EMAIL INCLUDED
        description: editForm.description,
      };

      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      await axios.put(
        `${API_URL}/doctoradmin/${editingDoctor._id}`,
        payload
      );

      alert("✅ Doctor updated successfully");
      setIsEditing(false);
      setEditingDoctor(null);
      setEditForm({});
      fetchDoctors();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Failed to update doctor");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingDoctor(null);
    setEditForm({});
  };

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) =>
      [d.title, d.firstName, d.lastName, d.specialist, d.email]
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

  const handleDownloadCSV = () => {
    const rows = [
      ["Title", "First Name", "Last Name", "Specialist", "Email"],
      ...filteredDoctors.map((d) => [
        d.title || "",
        d.firstName,
        d.lastName,
        d.specialist,
        d.email,
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

    const rows = filteredDoctors
      .map(
        (d) =>
          `<tr>
            <td>${escapeHtml(d.title || "-")}</td>
            <td>${escapeHtml(d.firstName)}</td>
            <td>${escapeHtml(d.lastName)}</td>
            <td>${escapeHtml(d.specialist)}</td>
            <td>${escapeHtml(d.email)}</td>
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
                <th>Title</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Specialist</th>
                <th>Email</th>
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

  if (loading) return <p>Loading doctors...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>List of Doctors</h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, title, specialist, email"
          className={createStyles.input}
          style={{ maxWidth: 360 }}
        />
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className={createStyles.select}
          style={{ width: 110 }}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
            </option>
          ))}
        </select>
        <button
          type="button"
          style={premiumButtonStyle}
          onClick={handleDownloadCSV}
        >
          Download CSV
        </button>
        <button
          type="button"
          style={premiumButtonStyle}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Title</th>
            <th className={styles.th}>First Name</th>
            <th className={styles.th}>Last Name</th>
            <th className={styles.th}>Specialist</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedDoctors.map((d) => (
            <tr key={d._id}>
              <td className={styles.td}>{d.title || "-"}</td>
              <td className={styles.td}>{d.firstName}</td>
              <td className={styles.td}>{d.lastName}</td>
              <td className={styles.td}>{d.specialist}</td>
              <td className={styles.td}>{d.email}</td>
              <td className={styles.td}>
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(d)}
                >
                  ✏️
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(d._id)}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
          {paginatedDoctors.length === 0 && (
            <tr>
              <td className={styles.td} colSpan={6}>
                No doctors found.
              </td>
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
          Showing {paginatedDoctors.length} of {filteredDoctors.length}
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

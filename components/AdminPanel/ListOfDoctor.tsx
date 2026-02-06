"use client";

import React, { useEffect, useState } from "react";
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

  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Doctor & { password?: string }>
  >({});
  const [isEditing, setIsEditing] = useState(false);

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

  if (loading) return <p>Loading doctors...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>List of Doctors</h2>

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
          {doctors.map((d) => (
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
                  Edit
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(d._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

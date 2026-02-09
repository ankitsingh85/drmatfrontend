"use client";
export const dynamic = "force-dynamic";

import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/listofclinic.module.css";
import createStyles from "@/styles/Dashboard/createclinic.module.css";

type ClinicCategory = {
  _id: string;
  name: string;
};

type Doctor = {
  name: string;
  regNo: string;
  specialization: string;
};

type Clinic = {
  _id: string;
  cuc: string;
  clinicName: string;
  website?: string;
  contactNumber?: string;
  email: string;
  dermaCategory?: ClinicCategory;
  address: string;
  clinicStatus?: string;
  doctors: Doctor[];

  clinicLogo?: string;
  bannerImage?: string;
  photos?: string[];
};

function ListOfClinic() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [editForm, setEditForm] = useState<Partial<Clinic>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [viewClinic, setViewClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    fetchClinics();
    fetchCategories();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/clinics`);
    const data = await res.json();
    setClinics(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/clinic-categories`);
    const data = await res.json();
    setCategories(data);
  };

  const filteredClinics = clinics.filter((c) =>
    c.clinicName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this clinic?")) return;
    await fetch(`${API_URL}/clinics/${id}`, { method: "DELETE" });
    setClinics((prev) => prev.filter((c) => c._id !== id));
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setEditForm({
      clinicName: clinic.clinicName,
      website: clinic.website,
      contactNumber: clinic.contactNumber,
      email: clinic.email,
      address: clinic.address,
      clinicStatus: clinic.clinicStatus,
      dermaCategory: clinic.dermaCategory,
    });
    setIsEditing(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinic) return;

    const payload = {
      ...editForm,
      dermaCategory: editForm.dermaCategory?._id,
    };

    const res = await fetch(`${API_URL}/clinics/${editingClinic._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();

    setClinics((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );

    setIsEditing(false);
    setEditingClinic(null);
    setEditForm({});
    alert("✅ Clinic updated successfully");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingClinic(null);
    setEditForm({});
  };

  const getImage = (img?: string) =>
    img?.startsWith("data:") ? img : img || "";

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Clinic Management</h1>

      <input
        className={styles.search}
        placeholder="Search clinic..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className={styles.status}>Loading clinics...</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Logo</th>
                <th>CUC</th>
                <th>Name</th>
                <th>Website</th>
                <th>Contact</th>
                <th>Category</th>
                <th>View</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredClinics.map((clinic) => (
                <tr key={clinic._id}>
                  <td>
                    {clinic.clinicLogo ? (
                      <img
                        src={getImage(clinic.clinicLogo)}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{clinic.cuc}</td>
                  <td>{clinic.clinicName}</td>
                  <td>{clinic.website || "—"}</td>
                  <td>{clinic.contactNumber || "—"}</td>
                  <td>{clinic.dermaCategory?.name || "—"}</td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => setViewClinic(clinic)}
                    >
                      👁
                    </button>
                  </td>
                  <td>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(clinic)}
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(clinic._id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}



{/* ================= INLINE EDIT FORM (RESTORED) ================= */}
{isEditing && editingClinic && (
  <div className={createStyles.container} style={{ marginTop: 40 }}>
    <h1 className={createStyles.heading}>Edit Clinic</h1>

    <form className={createStyles.form} onSubmit={handleEditSubmit}>
      {/* ===== BASIC INFO ===== */}
      <div className={createStyles.section}>
        <h2 className={createStyles.sectionTitle}>Basic Information</h2>

        <div className={createStyles.field}>
          <label className={createStyles.label}>CUC</label>
          <input
            value={editingClinic.cuc}
            disabled
            className={createStyles.input}
          />
        </div>

        <div className={createStyles.field}>
          <label className={createStyles.label}>Clinic Name</label>
          <input
            name="clinicName"
            value={editForm.clinicName || ""}
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
          />
        </div>

        <div className={createStyles.field}>
          <label className={createStyles.label}>Contact Number</label>
          <input
            name="contactNumber"
            value={editForm.contactNumber || ""}
            onChange={handleEditChange}
            className={createStyles.input}
          />
        </div>

        <div className={createStyles.field}>
          <label className={createStyles.label}>Website</label>
          <input
            name="website"
            value={editForm.website || ""}
            onChange={handleEditChange}
            className={createStyles.input}
          />
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

      {/* ===== CATEGORY & STATUS ===== */}
      <div className={createStyles.section}>
        <h2 className={createStyles.sectionTitle}>Category & Status</h2>

        <div className={createStyles.field}>
          <label className={createStyles.label}>Category</label>
          <select
            value={editForm.dermaCategory?._id || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                dermaCategory: { _id: e.target.value, name: "" },
              })
            }
            className={createStyles.input}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className={createStyles.field}>
          <label className={createStyles.label}>Clinic Status</label>
          <select
            name="clinicStatus"
            value={editForm.clinicStatus || ""}
            onChange={handleEditChange}
            className={createStyles.input}
          >
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" className={createStyles.submitBtn}>
          Update Clinic
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


      {/* ================= VIEW MODAL (FIXED) ================= */}
      {viewClinic && (
        <div className={styles.modalOverlay}>
          <div className={styles.viewModal}>
            <h2>{viewClinic.clinicName}</h2>

            {viewClinic.bannerImage && (
              <img
                src={getImage(viewClinic.bannerImage)}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              />
            )}

            <div className={styles.viewGrid}>
              <p><b>CUC:</b> {viewClinic.cuc}</p>
              <p><b>Email:</b> {viewClinic.email}</p>
              <p><b>Contact:</b> {viewClinic.contactNumber}</p>
              <p><b>Website:</b> {viewClinic.website}</p>
              <p><b>Category:</b> {viewClinic.dermaCategory?.name}</p>
              <p><b>Status:</b> {viewClinic.clinicStatus}</p>
              <p><b>Address:</b> {viewClinic.address}</p>
            </div>

            {viewClinic.doctors?.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>Doctors</h3>
                <ul>
                  {viewClinic.doctors.map((d, i) => (
                    <li key={i}>
                      {d.name} – {d.specialization}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {viewClinic.photos && viewClinic.photos.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>Clinic Photos</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {viewClinic.photos.map((img, i) => (
                    <img
                      key={i}
                      src={getImage(img)}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <button
              className={styles.closeBtn}
              onClick={() => setViewClinic(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListOfClinic;

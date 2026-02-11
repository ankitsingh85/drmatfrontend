"use client";
export const dynamic = "force-dynamic";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
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
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [editForm, setEditForm] = useState<Partial<Clinic>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [viewClinic, setViewClinic] = useState<Clinic | null>(null);

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

  const filteredClinics = useMemo(() => {
    let data = [...clinics];
    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter((c) =>
        [c.clinicName, c.cuc, c.email, c.contactNumber, c.address]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (filterCategory !== "all") {
      data = data.filter((c) => c.dermaCategory?._id === filterCategory);
    }

    return data;
  }, [clinics, search, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredClinics.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedClinics = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClinics.slice(start, start + itemsPerPage);
  }, [filteredClinics, currentPage, itemsPerPage]);

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

  const handleDownloadCSV = () => {
    const rows = [
      ["CUC", "Clinic Name", "Email", "Contact", "Website", "Category", "Status"],
      ...filteredClinics.map((c) => [
        c.cuc,
        c.clinicName,
        c.email || "",
        c.contactNumber || "",
        c.website || "",
        c.dermaCategory?.name || "",
        c.clinicStatus || "",
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
    link.download = "clinics.csv";
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

    const rows = filteredClinics
      .map(
        (c) => `<tr>
          <td>${escapeHtml(c.cuc)}</td>
          <td>${escapeHtml(c.clinicName)}</td>
          <td>${escapeHtml(c.email || "-")}</td>
          <td>${escapeHtml(c.contactNumber || "-")}</td>
          <td>${escapeHtml(c.website || "-")}</td>
          <td>${escapeHtml(c.dermaCategory?.name || "-")}</td>
          <td>${escapeHtml(c.clinicStatus || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Clinics List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Clinics List</h2>
          <table>
            <thead>
              <tr>
                <th>CUC</th>
                <th>Clinic Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Website</th>
                <th>Category</th>
                <th>Status</th>
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
      <h1 className={styles.heading}>Clinic Management</h1>

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
          placeholder="Search clinic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select           className={styles.search}

          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select           className={styles.search}

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
              {paginatedClinics.map((clinic) => (
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
              {paginatedClinics.length === 0 && (
                <tr>
                  <td colSpan={8}>No clinics found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
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
            Showing {paginatedClinics.length} of {filteredClinics.length}
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

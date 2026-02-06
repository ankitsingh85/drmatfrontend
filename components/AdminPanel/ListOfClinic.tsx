  "use client";
  import { API_URL } from "@/config/api";

  import React, { useEffect, useState } from "react";
  import styles from "@/styles/Dashboard/listofclinic.module.css";

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

    /* ✅ ADDED: MEDIA FROM CREATE CLINIC */
    clinicLogo?: string;          // base64
    bannerImage?: string;         // base64
    photos?: string[];            // base64[]
  };

  function ListOfClinic() {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
    const [categories, setCategories] = useState<ClinicCategory[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ================= EDIT MODAL ================= */
    const [showModal, setShowModal] = useState(false);
    const [editClinic, setEditClinic] = useState<Clinic | null>(null);

    /* ================= VIEW MODAL ================= */
    const [viewClinic, setViewClinic] = useState<Clinic | null>(null);

    useEffect(() => {
      fetchClinics();
      fetchCategories();
    }, []);

    /* ✅ FILTER */
    useEffect(() => {
      const query = search.toLowerCase();
      const filtered = clinics.filter((c) =>
        (c.clinicName || "").toLowerCase().includes(query)
      );
      setFilteredClinics(filtered);
    }, [search, clinics]);

    const fetchClinics = async () => {
      try {
        const res = await fetch(`${API_URL}/clinics`);
        const data = await res.json();
        setClinics(data);
        setFilteredClinics(data);
      } catch {
        setError("Failed to load clinics.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/clinic-categories`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    const handleDelete = async (id: string) => {
      if (!confirm("Delete this clinic?")) return;
      await fetch(`${API_URL}/clinics/${id}`, { method: "DELETE" });
      setClinics((prev) => prev.filter((c) => c._id !== id));
    };

    const openEditModal = (clinic: Clinic) => {
      setEditClinic(JSON.parse(JSON.stringify(clinic)));
      setShowModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editClinic) return;

      const res = await fetch(`${API_URL}/clinics/${editClinic._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editClinic,
          dermaCategory: editClinic.dermaCategory?._id,
        }),
      });

      const updated = await res.json();

      setClinics((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c))
      );
      setShowModal(false);
    };

    /* ✅ BASE64 SAFE IMAGE */
    const getImage = (img?: string) => {
      if (!img) return "";
      if (img.startsWith("data:")) return img;
      return img;
    };

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
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : filteredClinics.length === 0 ? (
          <p className={styles.status}>No clinics found</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Logo</th> {/* ✅ ADDED */}
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
                          alt="Logo"
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 8,
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
                      <div className={styles.actions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => openEditModal(clinic)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(clinic._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= VIEW MODAL ================= */}
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
                <p><b>Address:</b> {viewClinic.address}</p>
                <p><b>Status:</b> {viewClinic.clinicStatus}</p>
              </div>

              {viewClinic.photos && viewClinic.photos.length > 0 && (
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

        {/* ================= EDIT MODAL (UNCHANGED) ================= */}
        {showModal && editClinic && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Edit Clinic</h2>
              <form onSubmit={handleUpdate}>
                <input
                  value={editClinic.clinicName}
                  onChange={(e) =>
                    setEditClinic({ ...editClinic, clinicName: e.target.value })
                  }
                  placeholder="Clinic Name"
                />

                <input
                  value={editClinic.contactNumber || ""}
                  onChange={(e) =>
                    setEditClinic({ ...editClinic, contactNumber: e.target.value })
                  }
                  placeholder="Contact"
                />

                <select
                  value={editClinic.dermaCategory?._id || ""}
                  onChange={(e) =>
                    setEditClinic({
                      ...editClinic,
                      dermaCategory: { _id: e.target.value, name: "" },
                    })
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <div className={styles.modalActions}>
                  <button type="submit" className={styles.saveBtn}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={styles.cancelBtn}
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
  }

  export default ListOfClinic;

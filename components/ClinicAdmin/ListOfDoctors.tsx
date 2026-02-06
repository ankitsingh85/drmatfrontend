"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/clinicdashboard/listofdoctors.module.css";
import { API_URL } from "@/config/api";

// ✅ Use environment variable for API base URL
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

type Doctor = {
  _id: string;
  title: string;
  firstName: string;
  lastName: string;
  specialist: string;
};

function ListOfDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_URL}/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Delete Doctor
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await fetch(`${API_URL}/doctors/${id}`, { method: "DELETE" });
      setDoctors(doctors.filter((doc) => doc._id !== id));
    } catch (err) {
      console.error("Error deleting doctor:", err);
    }
  };

  // Update Doctor
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      const res = await fetch(`${API_URL}/doctors/${selectedDoctor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedDoctor),
      });
      if (res.ok) {
        setDoctors(
          doctors.map((doc) =>
            doc._id === selectedDoctor._id ? selectedDoctor : doc
          )
        );
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Error updating doctor:", err);
    }
  };

  // Search Filter
  const filteredDoctors = doctors.filter((doc) =>
    `${doc.firstName} ${doc.lastName} ${doc.specialist}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Doctors List</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search doctors..."
        className={styles.searchBar}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading doctors...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Name</th>
              <th>Specialist</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.map((doctor) => (
              <tr key={doctor._id}>
                <td>{doctor.title}</td>
                <td>{doctor.firstName} {doctor.lastName}</td>
                <td>{doctor.specialist}</td>
                <td>
                  <button
                    className={styles.updateBtn}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setIsModalOpen(true);
                    }}
                  >
                    Update
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(doctor._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Update Modal */}
      {isModalOpen && selectedDoctor && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Update Doctor</h2>
            <form onSubmit={handleUpdate}>
              <input
                type="text"
                value={selectedDoctor.firstName}
                onChange={(e) =>
                  setSelectedDoctor({ ...selectedDoctor, firstName: e.target.value })
                }
                className={styles.inputField}
                placeholder="First Name"
                required
              />
              <input
                type="text"
                value={selectedDoctor.lastName}
                onChange={(e) =>
                  setSelectedDoctor({ ...selectedDoctor, lastName: e.target.value })
                }
                className={styles.inputField}
                placeholder="Last Name"
                required
              />
              <input
                type="text"
                value={selectedDoctor.specialist}
                onChange={(e) =>
                  setSelectedDoctor({ ...selectedDoctor, specialist: e.target.value })
                }
                className={styles.inputField}
                placeholder="Specialist"
                required
              />

              <div className={styles.modalActions}>
                <button type="submit" className={styles.updateBtn}>
                  Save
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
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

export default ListOfDoctors;

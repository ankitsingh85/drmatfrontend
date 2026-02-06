"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/doctordashboard/listofappointments.module.css";
import { API_URL } from "@/config/api";

type Appointment = {
  _id: string;
  firstName: string;
  lastName: string;
  date: string;
  doctor: string;
};

// ✅ Use environment variable or fallback to localhost
// const BASE_URL =
//   process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api/appointments";

const ListOfAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterMode, setFilterMode] = useState<"today" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("All Doctors");
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    date: "",
    doctor: "",
  });

  const doctors = ["All Doctors", "Dr. John Smith", "Dr. Lisa Ray", "Dr. Rajiv Mehta", "Dr. Emily Clark"];

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setAppointments(data);
      setFilteredAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Apply filters
  useEffect(() => {
    let results = [...appointments];

    if (filterMode === "today") {
      const today = new Date().toISOString().split("T")[0];
      results = results.filter((appt) => appt.date.split("T")[0] === today);
    }

    if (searchQuery.trim() !== "") {
      results = results.filter((appt) =>
        `${appt.firstName} ${appt.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDoctor !== "All Doctors") {
      results = results.filter((appt) => appt.doctor === selectedDoctor);
    }

    setFilteredAppointments(results);
  }, [filterMode, searchQuery, selectedDoctor, appointments]);

  // Delete appointment
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setAppointments(appointments.filter((appt) => appt._id !== id));
    } catch (err) {
      console.error("Error deleting appointment:", err);
    }
  };

  // Open modal for editing
  const openEditModal = (appt: Appointment) => {
    setEditingAppt(appt);
    setEditForm({
      firstName: appt.firstName,
      lastName: appt.lastName,
      date: appt.date.split("T")[0],
      doctor: appt.doctor,
    });
  };

  const closeModal = () => setEditingAppt(null);

  // Update appointment
  const handleUpdate = async () => {
    if (!editingAppt) return;
    try {
      const res = await fetch(`${API_URL}/${editingAppt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        await fetchAppointments();
        closeModal();
      }
    } catch (err) {
      console.error("Error updating appointment:", err);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>📅 Appointments</h2>

      {/* Filters */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="🔍 Search by patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className={styles.filterSelect}
        >
          {doctors.map((doc, i) => (
            <option key={i} value={doc}>{doc}</option>
          ))}
        </select>
      </div>

      {/* Filter Buttons */}
      <div className={styles.buttonGroup}>
        <button
          className={`${styles.filterBtn} ${filterMode === "today" ? styles.active : ""}`}
          onClick={() => setFilterMode("today")}
        >
          Today’s Appointments
        </button>
        <button
          className={`${styles.filterBtn} ${filterMode === "all" ? styles.active : ""}`}
          onClick={() => setFilterMode("all")}
        >
          All Appointments
        </button>
      </div>

      {/* Appointment List */}
      {filteredAppointments.length === 0 ? (
        <p className={styles.noData}>No appointments found.</p>
      ) : (
        <>
          {/* Table (Desktop) */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appt) => (
                <tr key={appt._id}>
                  <td>{appt.firstName} {appt.lastName}</td>
                  <td>{new Date(appt.date).toLocaleDateString()}</td>
                  <td>{appt.doctor}</td>
                  <td>
                    <button onClick={() => openEditModal(appt)} className={styles.editBtn}>✏️</button>
                    <button onClick={() => handleDelete(appt._id)} className={styles.deleteBtn}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards (Mobile) */}
          <div className={styles.cardGrid}>
            {filteredAppointments.map((appt) => (
              <div key={appt._id} className={styles.card}>
                <h3 className={styles.patientName}>{appt.firstName} {appt.lastName}</h3>
                <p><strong>Date:</strong> {new Date(appt.date).toLocaleDateString()}</p>
                <p><strong>Doctor:</strong> {appt.doctor}</p>
                <div className={styles.actionButtons}>
                  <button onClick={() => openEditModal(appt)} className={styles.editBtn}>✏️ Update</button>
                  <button onClick={() => handleDelete(appt._id)} className={styles.deleteBtn}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {editingAppt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Edit Appointment</h3>
            <input
              type="text"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              placeholder="First Name"
            />
            <input
              type="text"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              placeholder="Last Name"
            />
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
            <select
              value={editForm.doctor}
              onChange={(e) => setEditForm({ ...editForm, doctor: e.target.value })}
            >
              {doctors.filter((d) => d !== "All Doctors").map((doc, i) => (
                <option key={i} value={doc}>{doc}</option>
              ))}
            </select>
            <div className={styles.modalButtons}>
              <button onClick={handleUpdate} className={styles.saveBtn}>💾 Save</button>
              <button onClick={closeModal} className={styles.cancelBtn}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListOfAppointments;

"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/clinicdashboard/listofappointments.module.css";
import Cookies from "js-cookie";
import { API_URL } from "@/config/api";

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

type Appointment = {
  _id: string;
  firstName: string;
  lastName: string;
  date: string;
  doctor: string;
};

export default function ListOfAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    date: "",
    doctor: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // 🔥 NEW STATES FOR PURCHASED SERVICES
  const [showAssignSection, setShowAssignSection] = useState(false);
  const [purchased, setPurchased] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const clinicId = Cookies.get("clinicId");

  const appointmentDoctors = [
    "All Doctors",
    "Dr. John Smith",
    "Dr. Lisa Ray",
    "Dr. Rajiv Mehta",
    "Dr. Emily Clark",
  ];

  /* -----------------------------------------------
      📌 FETCHING APPOINTMENTS
  ----------------------------------------------- */
  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/appointments`);
      const data = await res.json();
      setAppointments(data);
      setFilteredAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  /* -----------------------------------------------
      📌 FETCH PURCHASED SERVICES
  ----------------------------------------------- */
  const fetchPurchased = async () => {
    try {
      const res = await fetch(`${API_URL}/clinics/${clinicId}/purchased-services`);
      const data = await res.json();
      setPurchased(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading purchased services:", err);
    }
  };

  /* -----------------------------------------------
      📌 FETCH DOCTORS
  ----------------------------------------------- */
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_URL}/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Error loading doctors:", err);
    }
  };

  /* -----------------------------------------------
      📌 Assign Doctor to Purchased Service
  ----------------------------------------------- */
  const assignDoctor = async (serviceEntryId: string, doctorId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/clinics/purchased-services/${serviceEntryId}/assign-doctor`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctorId }),
        }
      );

      if (!res.ok) return alert("Failed to assign doctor");

      await fetchPurchased();
      alert("Doctor assigned successfully");
    } catch (err) {
      console.error("Assign doctor error:", err);
    }
  };

  /* -----------------------------------------------
      📌 Initial Load
  ----------------------------------------------- */
  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPurchased();
  }, []);

  /* -----------------------------------------------
      🔍 Search + Filter Logic
  ----------------------------------------------- */
  useEffect(() => {
    let results = appointments;

    if (searchQuery.trim() !== "") {
      results = results.filter((appt) =>
        `${appt.firstName} ${appt.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDoctor !== "" && selectedDoctor !== "All Doctors") {
      results = results.filter((appt) => appt.doctor === selectedDoctor);
    }

    setFilteredAppointments(results);
  }, [searchQuery, selectedDoctor, appointments]);

  /* -----------------------------------------------
      ✏️ Edit Appointment
  ----------------------------------------------- */
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

  const handleUpdate = async () => {
    if (!editingAppt) return;

    try {
      const res = await fetch(`${API_URL}/appointments/${editingAppt._id}`, {
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

  /* -----------------------------------------------
      🗑 Delete Appointment
  ----------------------------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      await fetch(`${API_URL}/appointments/${id}`, { method: "DELETE" });
      setAppointments(appointments.filter((appt) => appt._id !== id));
    } catch (err) {
      console.error("Error deleting appointment:", err);
    }
  };

  /* -----------------------------------------------
      🟦 PAGE RETURN
  ----------------------------------------------- */
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>📅 Appointment Dashboard</h2>

      {/* 🔥 NEW SWITCH BUTTON */}
      <button
        className={styles.assignSwitch}
        onClick={() => setShowAssignSection(!showAssignSection)}
      >
        {showAssignSection ? "← Back to Appointments" : "Assign Doctor to Purchased Services"}
      </button>

      {/* ===========================
          SHOW PURCHASED SERVICES
      =========================== */}
      {showAssignSection ? (
        <div className={styles.purchasedContainer}>
          <h2 className={styles.subHeading}>Purchased Services</h2>

          {purchased.length === 0 ? (
            <p className={styles.noData}>No purchased services found.</p>
          ) : (
            <table className={styles.purchasedTable}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>User</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Assigned Doctor</th>
                  <th>Assign</th>
                </tr>
              </thead>

              <tbody>
                {purchased.map((p: any, i: number) => (
                  <tr key={p._id || i}>
                    <td>{p.serviceId?.serviceName}</td>
                    <td>{p.userId?.name}</td>
                    <td>{p.quantity}</td>
                    <td>₹{p.totalPrice}</td>

                    <td>
                      {p.assignedDoctor
                        ? `${p.assignedDoctor.title} ${p.assignedDoctor.firstName}`
                        : "Not Assigned"}
                    </td>

                    <td>
                      <select
                        className={styles.doctorSelect}
                        onChange={(e) => assignDoctor(p._id, e.target.value)}
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.title} {d.firstName}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <>
          {/* ----------------------
              FILTER BAR
          ---------------------- */}
          <div className={styles.filterBar}>
            <input
              type="text"
              placeholder="Search by patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />

            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className={styles.filterSelect}
            >
              {appointmentDoctors.map((doc, idx) => (
                <option key={idx} value={doc}>
                  {doc}
                </option>
              ))}
            </select>

            <button
              className={styles.toggleBtn}
              onClick={() =>
                setViewMode(viewMode === "card" ? "table" : "card")
              }
            >
              {viewMode === "card" ? "📋 Table View" : "🗂 Card View"}
            </button>
          </div>

          {/* ----------------------
              CARD VIEW
          ---------------------- */}
          {viewMode === "card" ? (
            <div className={styles.cardGrid}>
              {filteredAppointments.map((appt) => (
                <div className={styles.card} key={appt._id}>
                  <h3>
                    {appt.firstName} {appt.lastName}
                  </h3>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(appt.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Doctor:</strong> {appt.doctor}
                  </p>

                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => openEditModal(appt)}
                      className={styles.editBtn}
                    >
                      ✏️ Update
                    </button>

                    <button
                      onClick={() => handleDelete(appt._id)}
                      className={styles.deleteBtn}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ----------------------
                TABLE VIEW
            ---------------------- */
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
                    <td>
                      {appt.firstName} {appt.lastName}
                    </td>
                    <td>{new Date(appt.date).toLocaleDateString()}</td>
                    <td>{appt.doctor}</td>

                    <td>
                      <button
                        onClick={() => openEditModal(appt)}
                        className={styles.editBtn}
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => handleDelete(appt._id)}
                        className={styles.deleteBtn}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ----------------------
          MODAL
      ---------------------- */}
      {editingAppt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Edit Appointment</h3>

            <input
              type="text"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm({ ...editForm, firstName: e.target.value })
              }
              placeholder="First Name"
            />

            <input
              type="text"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm({ ...editForm, lastName: e.target.value })
              }
              placeholder="Last Name"
            />

            <input
              type="date"
              value={editForm.date}
              onChange={(e) =>
                setEditForm({ ...editForm, date: e.target.value })
              }
            />

            <select
              value={editForm.doctor}
              onChange={(e) =>
                setEditForm({ ...editForm, doctor: e.target.value })
              }
            >
              {appointmentDoctors
                .filter((d) => d !== "All Doctors")
                .map((doc, idx) => (
                  <option key={idx} value={doc}>
                    {doc}
                  </option>
                ))}
            </select>

            <div className={styles.modalButtons}>
              <button onClick={handleUpdate} className={styles.saveBtn}>
                💾 Save
              </button>

              <button onClick={closeModal} className={styles.cancelBtn}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

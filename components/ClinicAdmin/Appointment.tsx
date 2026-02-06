"use client";
import React, { useState } from "react";
import styles from "@/styles/clinicdashboard/appointments.module.css";
import { API_URL } from "@/config/api";

// ✅ Use environment variable for API base URL
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const Appointment: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    date: "",
    doctor: "",
  });

  const doctors = ["Dr. John Smith", "Dr. Lisa Ray", "Dr. Rajiv Mehta", "Dr. Emily Clark"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Appointment Created:", data);
        alert("Appointment booked successfully ✅");

        // Reset form after successful submit
        setFormData({
          firstName: "",
          lastName: "",
          date: "",
          doctor: "",
        });
      } else {
        const errorData = await response.json();
        console.error("Error creating appointment:", errorData);
        alert(`Error: ${errorData.message || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Failed to connect to server 🚨");
    }
  };

  return (
    <div className={styles.appointmentContainer}>
      <h2 className={styles.heading}>Book an Appointment</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="firstName" className={styles.label}>First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={styles.inputField}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastName" className={styles.label}>Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={styles.inputField}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="date" className={styles.label}>Date of Appointment</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={styles.inputField}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="doctor" className={styles.label}>Assign to Doctor</label>
          <select
            id="doctor"
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className={styles.selectField}
            required
          >
            <option value="" disabled>Select Doctor</option>
            {doctors.map((doc, index) => (
              <option key={index} value={doc}>{doc}</option>
            ))}
          </select>
        </div>

        <button type="submit" className={styles.submitButton}>
          Create Appointment
        </button>
      </form>
    </div>
  );
};

export default Appointment;

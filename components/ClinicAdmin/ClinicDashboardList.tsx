"use client";
import React, { useEffect, useState } from "react";
import styles from "@/styles/clinicdashboard/clinicdashboard.module.css";
import { API_URL } from "@/config/api";

type Doctor = {
  _id: string;
  firstName: string;
  lastName: string;
  specialist: string;
};

type Appointment = {
  _id: string;
  firstName: string;
  lastName: string;
  date: string;
  doctor: string;
};

type Service = {
  _id: string;
  serviceName: string;
};

type Review = {
  _id: string;
  patientName: string;
  comment: string;
  rating: number;
  date: string;
};

// ✅ Use environment variable for API base URL
// const API_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

function ClinicDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [doctorsRes, apptsRes, servicesRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/doctors`),
        fetch(`${API_URL}/appointments`),
        fetch(`${API_URL}/services`),
        fetch(`${API_URL}/reviews`),
      ]);

      setDoctors(await doctorsRes.json());
      setAppointments(await apptsRes.json());
      setServices(await servicesRes.json());
      setReviews(await reviewsRes.json());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <p className={styles.loading}>Loading Dashboard...</p>;

  // Sort appointments by date (upcoming first)
  const upcomingAppointments = [...appointments]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>🏥 Clinic Dashboard</h1>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h3>👨‍⚕️ Doctors</h3>
          <p>{doctors.length}</p>
        </div>
        <div className={styles.card}>
          <h3>📅 Appointments</h3>
          <p>{appointments.length}</p>
        </div>
        <div className={styles.card}>
          <h3>💊 Services</h3>
          <p>{services.length}</p>
        </div>
        <div className={styles.card}>
          <h3>⭐ Reviews</h3>
          <p>{reviews.length}</p>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className={styles.section}>
        <h2>📌 Upcoming Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <p>No upcoming appointments.</p>
        ) : (
          <ul className={styles.list}>
            {upcomingAppointments.map((appt) => (
              <li key={appt._id} className={styles.listItem}>
                <div>
                  <strong>
                    {appt.firstName} {appt.lastName}
                  </strong>{" "}
                  with <em>{appt.doctor}</em>
                </div>
                <small className={styles.date}>
                  {new Date(appt.date).toLocaleDateString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Reviews */}
      <div className={styles.section}>
        <h2>📝 Recent Reviews</h2>
        {reviews.length === 0 ? (
          <p>No reviews available.</p>
        ) : (
          <ul className={styles.reviewList}>
            {reviews.slice(0, 5).map((review) => (
              <li key={review._id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <strong>{review.patientName}</strong>
                  <span className={styles.rating}>⭐ {review.rating}</span>
                </div>
                <p className={styles.comment}>{review.comment}</p>
                <small className={styles.date}>
                  {new Date(review.date).toLocaleDateString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ClinicDashboard;

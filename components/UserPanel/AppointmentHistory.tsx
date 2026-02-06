"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { API_URL } from "@/config/api";

interface AppointmentItem {
  serviceName: string;
  status: "active" | "pending";
  doctorName?: string | null;
}

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

function AppointmentHistory() {
  const { user, loading } = useUser();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user?._id) return;

    const fetchAppointments = async () => {
      setFetching(true);

      const res = await axios.get(`${API_URL}/clinics/user/services`, {
        headers: { "x-user-id": user._id },
      });

      const mapped = res.data.map((item: any) => ({
        serviceName: item.serviceName,
        status: item.status,
        doctorName: item.doctorName || null,
      }));

      setAppointments(mapped);
      setFetching(false);
    };

    fetchAppointments();
  }, [user?._id, loading]);

  if (loading || fetching) return <p>Loading appointments...</p>;
  if (!user?._id) return <p>Please log in.</p>;

  // INTERNAL CSS
  const card = {
    background: "#fff",
    padding: "16px",
    borderRadius: "12px",
    boxShadow: "0px 3px 8px rgba(0,0,0,0.12)",
    marginBottom: "14px",
    borderLeft: "6px solid #0d6efd",
  };

  const title = {
    marginBottom: "6px",
    fontSize: "17px",
    fontWeight: "600",
  };

  const badgePending = {
    background: "#ffcccc",
    color: "#b10000",
    padding: "4px 10px",
    fontSize: "12px",
    borderRadius: "6px",
    fontWeight: "600",
    display: "inline-block",
    marginTop: "6px",
  };

  const badgeActive = {
    background: "#d2f5d2",
    color: "#0a7007",
    padding: "4px 10px",
    fontSize: "12px",
    borderRadius: "6px",
    fontWeight: "600",
    display: "inline-block",
    marginTop: "6px",
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📅 Appointment Status</h2>

      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        appointments.map((a, i) => (
          <div key={i} style={card}>
            <h3 style={title}>{a.serviceName}</h3>

            {a.status === "pending" && (
              <span style={badgePending}>Pending (Not Assigned)</span>
            )}

            {a.status === "active" && (
              <span style={badgeActive}>
                Active — Doctor: {a.doctorName}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AppointmentHistory;

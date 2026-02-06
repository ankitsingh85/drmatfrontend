"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { API_URL } from "@/config/api";

interface ServiceHistoryItem {
  clinicName: string;
  serviceName: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  purchasedAt: string;
}

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

const ServiceHistory: React.FC = () => {
  const { user, loading } = useUser();
  const [services, setServices] = useState<ServiceHistoryItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user?._id) return;

    const fetchServices = async () => {
      try {
        setFetching(true);
        setError("");

        const res = await axios.get(`${API_URL}/clinics/user/services`, {
          headers: { "x-user-id": user._id },
        });

        // Remove status + doctor for this page
        const cleaned = res.data.map((item: any) => ({
          clinicName: item.clinicName,
          serviceName: item.serviceName,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          purchasedAt: item.purchasedAt,
        }));

        setServices(cleaned);
      } catch (err: any) {
        console.error("❌ Failed:", err);
        setError(err.response?.data?.message || "Failed to load services");
      } finally {
        setFetching(false);
      }
    };

    fetchServices();
  }, [user?._id, loading]);

  if (loading) return <p>Loading user...</p>;
  if (!user?._id) return <p>Please log in.</p>;
  if (fetching) return <p>Loading service history...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const cardStyle = {
    background: "#fff",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    gap: "16px",
    borderLeft: "6px solid #4c7cf5",
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧾 Service Purchase History</h2>

      {services.length === 0 ? (
        <p>No purchased services found.</p>
      ) : (
        services.map((s, i) => (
          <div style={cardStyle} key={i}>
            {s.image && (
              <img
                src={s.image}
                alt={s.serviceName}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "8px",
                  objectFit: "cover",
                }}
              />
            )}

            <div>
              <h3 style={{ marginBottom: "6px" }}>{s.serviceName}</h3>
              <p><strong>Clinic:</strong> {s.clinicName}</p>
              <p><strong>Quantity:</strong> {s.quantity}</p>
              <p>
                <strong>Total Paid:</strong>{" "}
                ₹{s.price.toLocaleString("en-IN")}
              </p>
              <small style={{ color: "#777" }}>
                {new Date(s.purchasedAt).toLocaleString()}
              </small>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ServiceHistory;

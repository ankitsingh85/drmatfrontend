"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_URL } from "@/config/api";
import { useCart } from "@/context/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import { FiBookOpen, FiCalendar, FiUser } from "react-icons/fi";

type WorkshopTraining = {
  _id: string;
  trainingName?: string;
  trainingUniqueCode?: string;
  trainingType?: string;
  instituteName?: string;
  trainingDuration?: string;
  modeOfTraining?: string;
  startDate?: string;
  endDate?: string;
  trainerInstructorName?: string;
  currentAvailability?: string;
  feesInr?: number;
  trainingImage?: string;
};

const endpointCandidates = [
  `${API_URL}/workshop-trainings`,
  `${API_URL}/workshop-tranings`,
  `${API_URL}/workshop-training`,
];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const getPrice = (item: WorkshopTraining) => {
  const price = Number(item.feesInr || 0);
  return Number.isFinite(price) && price > 0 ? price : 0;
};

const cardLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

export default function TraningWorkshop() {
  const router = useRouter();
  const { addToCart, cartItems } = useCart();
  const [items, setItems] = useState<WorkshopTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchWorkshopTrainings = async () => {
      try {
        setLoading(true);
        setError("");

        let lastError = "Failed to load workshop trainings";

        for (const endpoint of endpointCandidates) {
          const res = await fetch(endpoint);
          const data = await res.json().catch(() => []);

          if (res.ok) {
            if (mounted) setItems(Array.isArray(data) ? data : []);
            return;
          }

          lastError = data?.message || lastError;
        }

        throw new Error(lastError);
      } catch (err: any) {
        if (mounted) {
          setItems([]);
          setError(err?.message || "Failed to load workshop trainings");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWorkshopTrainings();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = (training: WorkshopTraining) => {
    const cartId = `workshop:${training._id}`;
    if (cartItems.some((item) => item.id === cartId)) {
      router.push("/home/Cart");
      return;
    }

    const price = getPrice(training);
    addToCart({
      id: cartId,
      name: training.trainingName || "Workshop Training",
      price,
      mrp: undefined,
      company: training.instituteName,
      image: resolveMediaUrl(training.trainingImage || undefined) || undefined,
      itemType: "product",
    });
  };

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 1380,
        margin: "0 auto",
        padding: "10px 0 26px",
      }}
    >
      <div
        style={{
          marginBottom: 20,
          padding: "18px 22px",
          borderRadius: 24,
          background: "linear-gradient(135deg, #111827 0%, #1d4ed8 100%)",
          color: "#fff",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.14)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15, fontWeight: 800 }}>
          Workshop Trainings
        </h2>
        <p style={{ margin: "8px 0 0", maxWidth: 760, color: "rgba(255,255,255,0.84)" }}>
          Browse available training programs and add the one you want to your cart.
        </p>
      </div>

      {error ? (
        <p style={{ margin: "0 0 14px", color: "#b91c1c", fontWeight: 600 }}>{error}</p>
      ) : null}

      {loading ? <p style={{ margin: 0 }}>Loading workshop trainings...</p> : null}

      {!loading && items.length === 0 ? (
        <p style={{ margin: 0, color: "#64748b" }}>No workshop trainings found.</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 22,
            justifyContent: "center",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 320px))",
          }}
        >
          {items.map((item) => {
            const cartId = `workshop:${item._id}`;
            const inCart = cartItems.some((entry) => entry.id === cartId);
            const price = getPrice(item);
            const image = resolveMediaUrl(item.trainingImage || undefined);
            return (
              <article
                key={item._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 28,
                  overflow: "hidden",
                  boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(15,23,42,0.04) 100%)",
                  }}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={item.trainingName || "Workshop training"}
                      style={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 150,
                        display: "grid",
                        placeItems: "center",
                        padding: 20,
                        textAlign: "center",
                        color: "#334155",
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {item.trainingName || "Workshop Training"}
                    </div>
                  )}
                </div>

                <div style={{ padding: 18, display: "grid", gap: 14, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 20, lineHeight: 1.25, color: "#111827" }}>
                        {item.trainingName || "Workshop Training"}
                      </h3>
                      <p style={{ margin: "6px 0 0", color: "#475569", lineHeight: 1.45 }}>
                        {item.instituteName || "Institute not specified"}
                      </p>
                    </div>

                    <span
                      style={{
                        ...cardLabelStyle,
                        background: "rgba(239, 68, 68, 0.08)",
                        color: "#ef4444",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <FiBookOpen />
                      Enroll
                    </span>
                  </div>

                  <div>
                    <div style={{ marginBottom: 10, color: "#6b7280", fontSize: 13, fontWeight: 700 }}>
                      Training Details
                    </div>
                    <div style={{ display: "grid", gap: 8, color: "#475569", fontSize: 14 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <FiUser />
                        <span>Trainer: {item.trainerInstructorName || "-"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <FiCalendar />
                        <span>
                          {formatDate(item.startDate)} - {formatDate(item.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px dashed #e5e7eb",
                      paddingTop: 14,
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Fee</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>
                          {price > 0 ? `INR ${price}` : "Free"}
                        </div>
                      </div>

                      <span
                        style={{
                          ...cardLabelStyle,
                          background: "#f3f4f6",
                          color: "#374151",
                        }}
                      >
                        {item.modeOfTraining || "Mode not specified"}
                      </span>
                    </div>

                    <div
                      style={{
                        background: "#111827",
                        borderRadius: 16,
                        padding: "8px 10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.14)",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FiUser />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>Course Instructor</div>
                          <div style={{ fontWeight: 700 }}>
                            {item.trainerInstructorName || "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    style={{
                      border: "none",
                      borderRadius: 14,
                      padding: "11px 16px",
                      background: inCart ? "#0f172a" : "#1d4ed8",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                      width: "100%",
                      fontSize: 14,
                      boxShadow: "0 10px 20px rgba(29, 78, 216, 0.18)",
                    }}
                  >
                    {inCart ? "Go to Cart" : "Enroll Now"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

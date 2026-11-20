"use client";

import React, { useState } from "react";
import Cookies from "js-cookie";
import { FiX } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";

type Props = {
  productId: string;
  productName: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export default function ProductReviewModal({
  productId,
  productName,
  onClose,
  onSubmitted,
}: Props) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) {
      toast.error("Please provide a rating and a comment");
      return;
    }

    const token = Cookies.get("token") || "";

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to submit review");

      toast.success("Review submitted — thank you!");
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 24,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              Write a Review
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: 999,
              width: 30,
              height: 30,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <FiX />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <FaStar
              key={value}
              size={26}
              onClick={() => setRating(value)}
              style={{
                cursor: "pointer",
                color: value <= rating ? "#facc15" : "#e2e8f0",
              }}
            />
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          style={{
            width: "100%",
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 16,
            width: "100%",
            border: "none",
            borderRadius: 999,
            padding: "11px 16px",
            background: "linear-gradient(135deg, #10306b 0%, #1f49be 55%, #2981b7 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

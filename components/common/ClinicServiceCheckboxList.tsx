"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";

export interface ClinicServiceCatalogItem {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

// Shared across the admin Create/Edit Clinic forms and the clinic's own
// portal "Services" tab — all three need the same "pick from the admin's
// ClinicService catalog" list, fetched independently since each lives in
// its own component tree.
export function useClinicServiceCatalog() {
  const [catalog, setCatalog] = useState<ClinicServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/clinic-services`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setCatalog(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setCatalog([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { catalog, loading };
}

type ClinicServiceCheckboxListProps = {
  catalog: ClinicServiceCatalogItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export default function ClinicServiceCheckboxList({
  catalog,
  selectedIds,
  onToggle,
}: ClinicServiceCheckboxListProps) {
  if (!catalog.length) {
    return (
      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
        No clinic services have been added by the admin yet.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 10,
        maxHeight: 340,
        overflowY: "auto",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: 12,
      }}
    >
      {catalog.map((service) => {
        const checked = selectedIds.includes(service._id);
        return (
          <label
            key={service._id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              padding: 8,
              border: checked ? "1px solid #2981b7" : "1px solid #e2e8f0",
              borderRadius: 8,
              cursor: "pointer",
              background: checked ? "#eef6fb" : "#fff",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(service._id)}
              style={{ marginTop: 3, flexShrink: 0 }}
            />
            {service.imageUrl && (
              <img
                src={resolveMediaUrl(service.imageUrl) || service.imageUrl}
                alt={service.name}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            <span>
              <strong style={{ display: "block", fontSize: 13 }}>{service.name}</strong>
              {service.description && (
                <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>
                  {service.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

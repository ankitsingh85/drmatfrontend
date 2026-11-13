"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import ClinicServiceCheckboxList, {
  useClinicServiceCatalog,
} from "@/components/common/ClinicServiceCheckboxList";

type ClinicServicesTabProps = {
  clinicId: string;
  initialSelectedIds: string[];
  onSaved?: (selectedIds: string[]) => void;
};

export default function ClinicServicesTab({
  clinicId,
  initialSelectedIds,
  onSaved,
}: ClinicServicesTabProps) {
  const toast = useToast();
  const { catalog, loading } = useClinicServiceCatalog();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [saving, setSaving] = useState(false);

  // Keep the checkbox state in sync if the clinic record is refetched
  // (e.g. after switching tabs and coming back) with a different set.
  useEffect(() => {
    setSelectedIds(initialSelectedIds);
  }, [initialSelectedIds]);

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!clinicId) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("clinicServices", JSON.stringify(selectedIds));

      const res = await fetch(`${API_URL}/clinics/${clinicId}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save selected services");

      toast.success("Services updated successfully");
      onSaved?.(selectedIds);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save selected services");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Services offered at your clinic
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Pick the services you offer from the list below. Selected services will
          show up on your clinic's public profile page.
        </p>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: "#64748b" }}>Loading services...</p>
      ) : (
        <ClinicServiceCheckboxList
          catalog={catalog}
          selectedIds={selectedIds}
          onToggle={toggle}
        />
      )}

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            background: "linear-gradient(180deg, #2981b7 0%, #10678c 100%)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.2,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Services"}
        </button>
      </div>
    </div>
  );
}

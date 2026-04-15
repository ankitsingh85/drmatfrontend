"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

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
  createdAt?: string;
};

type WorkshopTrainingEditForm = {
  trainingName: string;
  trainingType: string;
  instituteName: string;
  trainingDuration: string;
  modeOfTraining: string;
  startDate: string;
  endDate: string;
  trainerInstructorName: string;
  currentAvailability: string;
  feesInr: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const iconButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const editIconStyle: React.CSSProperties = {
  ...iconButtonStyle,
  background: "#dbeafe",
  color: "#1d4ed8",
};

const deleteIconStyle: React.CSSProperties = {
  ...iconButtonStyle,
  background: "#fee2e2",
  color: "#b91c1c",
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  color: "#b91c1c",
  fontWeight: 500,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 760,
};

const thTdStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
};

export default function ListOfWorkshopTraning() {
  const [items, setItems] = useState<WorkshopTraining[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState<WorkshopTraining | null>(null);
  const [editForm, setEditForm] = useState<WorkshopTrainingEditForm>({
    trainingName: "",
    trainingType: "",
    instituteName: "",
    trainingDuration: "",
    modeOfTraining: "",
    startDate: "",
    endDate: "",
    trainerInstructorName: "",
    currentAvailability: "",
    feesInr: "",
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWorkshopTrainings = async () => {
    try {
      setLoading(true);
      setError("");

      const endpointCandidates = [
        `${API_URL}/workshop-trainings`,
        `${API_URL}/workshop-tranings`,
        `${API_URL}/workshop-training`,
      ];

      let lastError = "Failed to fetch workshop trainings";

      for (const endpoint of endpointCandidates) {
        const res = await fetch(endpoint);
        const data = await res.json().catch(() => []);

        if (res.ok) {
          setItems(Array.isArray(data) ? data : []);
          return;
        }

        lastError = data?.message || lastError;
      }

      throw new Error(lastError);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch workshop trainings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshopTrainings();
  }, []);

  useEffect(() => {
    const refresh = () => fetchWorkshopTrainings();
    window.addEventListener("admin-dashboard:create-success", refresh);
    return () => window.removeEventListener("admin-dashboard:create-success", refresh);
  }, []);

  const trainingTypeOptions = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      const type = String(item.trainingType || "").trim();
      if (type) values.add(type);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = [
        item.trainingName,
        item.trainingUniqueCode,
        item.trainingType,
        item.instituteName,
        item.modeOfTraining,
        item.trainerInstructorName,
        item.currentAvailability,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const matchesType =
        filterType === "all" ||
        String(item.trainingType || "").trim().toLowerCase() === filterType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [items, search, filterType]);

  const stripHtml = (value?: string) =>
    (value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const handleDownloadCSV = () => {
    const rows = [
      [
        "Training Name",
        "Training Code",
        "Training Type",
        "Institute Name",
        "Training Duration",
        "Mode Of Training",
        "Trainer Name",
        "Start Date",
        "End Date",
        "Fees",
        "Availability",
      ],
      ...filteredItems.map((item) => [
        stripHtml(item.trainingName),
        stripHtml(item.trainingUniqueCode),
        stripHtml(item.trainingType),
        stripHtml(item.instituteName),
        stripHtml(item.trainingDuration),
        stripHtml(item.modeOfTraining),
        stripHtml(item.trainerInstructorName),
        formatDate(item.startDate),
        formatDate(item.endDate),
        typeof item.feesInr === "number" ? String(item.feesInr) : "",
        stripHtml(item.currentAvailability),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workshop-trainings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      alert("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredItems
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.trainingName || "-")}</td>
          <td>${escapeHtml(item.trainingUniqueCode || "-")}</td>
          <td>${escapeHtml(item.trainingType || "-")}</td>
          <td>${escapeHtml(item.instituteName || "-")}</td>
          <td>${escapeHtml(item.trainingDuration || "-")}</td>
          <td>${escapeHtml(item.modeOfTraining || "-")}</td>
          <td>${escapeHtml(item.trainerInstructorName || "-")}</td>
          <td>${escapeHtml(formatDate(item.startDate))}</td>
          <td>${escapeHtml(formatDate(item.endDate))}</td>
          <td>${escapeHtml(typeof item.feesInr === "number" ? String(item.feesInr) : "-")}</td>
          <td>${escapeHtml(item.currentAvailability || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Workshop Trainings</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Workshop Trainings</h2>
          <table>
            <thead>
              <tr>
                <th>Training</th>
                <th>Code</th>
                <th>Type</th>
                <th>Institute</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Trainer</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Fee</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workshop training?")) return;

    try {
      const endpointCandidates = [
        `${API_URL}/workshop-trainings/${id}`,
        `${API_URL}/workshop-tranings/${id}`,
        `${API_URL}/workshop-training/${id}`,
      ];

      let lastError = "Failed to delete workshop training";
      for (const endpoint of endpointCandidates) {
        const res = await fetch(endpoint, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setItems((prev) => prev.filter((item) => item._id !== id));
          return;
        }
        lastError = data?.message || lastError;
      }

      throw new Error(lastError);
    } catch (err: any) {
      setError(err?.message || "Failed to delete workshop training");
    }
  };

  const handleEdit = (item: WorkshopTraining) => {
    setEditingItem(item);
    setEditForm({
      trainingName: item.trainingName || "",
      trainingType: item.trainingType || "",
      instituteName: item.instituteName || "",
      trainingDuration: item.trainingDuration || "",
      modeOfTraining: item.modeOfTraining || "",
      startDate: toDateInputValue(item.startDate),
      endDate: toDateInputValue(item.endDate),
      trainerInstructorName: item.trainerInstructorName || "",
      currentAvailability: item.currentAvailability || "",
      feesInr: typeof item.feesInr === "number" ? String(item.feesInr) : "",
    });
    setEditError("");
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;

    if (!editForm.trainingName.trim()) {
      setEditError("Training name is required");
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const payload: Record<string, string> = {
        trainingName: editForm.trainingName.trim(),
        trainingType: editForm.trainingType.trim(),
        instituteName: editForm.instituteName.trim(),
        trainingDuration: editForm.trainingDuration.trim(),
        modeOfTraining: editForm.modeOfTraining.trim(),
        trainerInstructorName: editForm.trainerInstructorName.trim(),
        currentAvailability: editForm.currentAvailability.trim(),
      };

      if (editForm.startDate) payload.startDate = editForm.startDate;
      if (editForm.endDate) payload.endDate = editForm.endDate;
      if (editForm.feesInr.trim()) payload.feesInr = editForm.feesInr.trim();

      const endpointCandidates = [
        `${API_URL}/workshop-trainings/${editingItem._id}`,
        `${API_URL}/workshop-tranings/${editingItem._id}`,
        `${API_URL}/workshop-training/${editingItem._id}`,
      ];

      let lastError = "Failed to update workshop training";
      for (const endpoint of endpointCandidates) {
        const res = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setItems((prev) =>
            prev.map((item) =>
              item._id === editingItem._id
                ? {
                    ...item,
                    ...payload,
                    feesInr: payload.feesInr ? Number(payload.feesInr) : item.feesInr,
                    startDate: payload.startDate || item.startDate,
                    endDate: payload.endDate || item.endDate,
                  }
                : item
            )
          );
          setEditingItem(null);
          return;
        }
        lastError = data?.message || lastError;
      }

      throw new Error(lastError);
    } catch (err: any) {
      setEditError(err?.message || "Failed to update workshop training");
    } finally {
      setSaving(false);
    }
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditForm({
      trainingName: "",
      trainingType: "",
      instituteName: "",
      trainingDuration: "",
      modeOfTraining: "",
      startDate: "",
      endDate: "",
      trainerInstructorName: "",
      currentAvailability: "",
      feesInr: "",
    });
    setEditError("");
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
        >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workshop trainings"
            style={{
              ...inputStyle,
              maxWidth: 420,
            }}
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              ...inputStyle,
              maxWidth: 260,
            }}
          >
            <option value="all">All Training Types</option>
            {trainingTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={handleDownloadCSV} style={buttonStyle}>
            Download Excel
          </button>
          <button type="button" onClick={handleDownloadPDF} style={buttonStyle}>
            Download PDF
          </button>
        </div>
      </div>

      {error ? <p style={errorStyle}>{error}</p> : null}
      {loading ? <p style={{ margin: 0 }}>Loading workshop trainings...</p> : null}

      {!loading && filteredItems.length === 0 ? (
        <p style={{ margin: 0, color: "#64748b" }}>No workshop trainings found.</p>
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Training</th>
                <th style={thTdStyle}>Code</th>
                <th style={thTdStyle}>Type</th>
                <th style={thTdStyle}>Institute</th>
                <th style={thTdStyle}>Trainer</th>
                <th style={thTdStyle}>Start Date</th>
                <th style={thTdStyle}>Fee</th>
                <th style={thTdStyle}>Availability</th>
                <th style={thTdStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  <td style={thTdStyle}>{item.trainingName || "-"}</td>
                  <td style={thTdStyle}>{item.trainingUniqueCode || "-"}</td>
                  <td style={thTdStyle}>{item.trainingType || "-"}</td>
                  <td style={thTdStyle}>{item.instituteName || "-"}</td>
                  <td style={thTdStyle}>{item.trainerInstructorName || "-"}</td>
                  <td style={thTdStyle}>{formatDate(item.startDate)}</td>
                  <td style={thTdStyle}>
                    {typeof item.feesInr === "number" ? `INR ${item.feesInr}` : "-"}
                  </td>
                  <td style={thTdStyle}>{item.currentAvailability || "-"}</td>
                  <td style={thTdStyle}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        style={editIconStyle}
                        title="Edit workshop training"
                        aria-label="Edit workshop training"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        style={deleteIconStyle}
                        title="Delete workshop training"
                        aria-label="Delete workshop training"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {editingItem ? (
        <div
          style={{
            marginTop: 8,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0 }}>Edit Workshop Training</h3>
            <button
              type="button"
              onClick={closeEditModal}
              style={{ ...buttonStyle, background: "#64748b" }}
            >
              Close
            </button>
          </div>

          {editError ? <p style={errorStyle}>{editError}</p> : null}

          <form onSubmit={handleEditSubmit} style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              }}
            >
              <input
                value={editForm.trainingName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, trainingName: e.target.value }))
                }
                placeholder="Training name"
                style={inputStyle}
              />
              <input
                value={editForm.trainingType}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, trainingType: e.target.value }))
                }
                placeholder="Training type"
                style={inputStyle}
              />
              <input
                value={editForm.instituteName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, instituteName: e.target.value }))
                }
                placeholder="Institute name"
                style={inputStyle}
              />
              <input
                value={editForm.trainingDuration}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, trainingDuration: e.target.value }))
                }
                placeholder="Training duration"
                style={inputStyle}
              />
              <input
                value={editForm.modeOfTraining}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, modeOfTraining: e.target.value }))
                }
                placeholder="Mode of training"
                style={inputStyle}
              />
              <input
                value={editForm.trainerInstructorName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, trainerInstructorName: e.target.value }))
                }
                placeholder="Trainer name"
                style={inputStyle}
              />
              <input
                type="date"
                value={editForm.startDate}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                type="date"
                value={editForm.endDate}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                value={editForm.currentAvailability}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    currentAvailability: e.target.value,
                  }))
                }
                placeholder="Current availability"
                style={inputStyle}
              />
              <input
                value={editForm.feesInr}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    feesInr: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder="Fees"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={closeEditModal}
                style={{ ...buttonStyle, background: "#64748b" }}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} style={buttonStyle}>
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

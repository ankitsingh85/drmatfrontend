"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  FiClock,
  FiDownload,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { API_URL } from "@/config/api";
import { resolveMediaUrl } from "@/lib/media";

type LeadActionType = "call" | "whatsapp";

type LeadItem = {
  _id: string;
  clinicId: string;
  actionType: LeadActionType;
  clinicName?: string;
  clinicSlug?: string;
  userName?: string;
  userEmail?: string;
  userContactNo?: string;
  userPatientId?: string;
  userProfileImage?: string;
  createdAt?: string;
};

type JwtPayload = {
  id: string;
  role: string;
  exp: number;
};

type LeadProps = {
  clinicId: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const csvEscape = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const pdfEscape = (value: unknown) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ")
    .replace(/[^\x20-\x7E]/g, "?");

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const buildCsv = (leads: LeadItem[]) => {
  const rows = [
    [
      "Lead Type",
      "Clinic Name",
      "User Name",
      "User Email",
      "User Contact No",
      "Patient Id",
      "Created At",
    ],
    ...leads.map((lead) => [
      lead.actionType,
      lead.clinicName || "",
      lead.userName || "",
      lead.userEmail || "",
      lead.userContactNo || "",
      lead.userPatientId || "",
      lead.createdAt ? new Date(lead.createdAt).toISOString() : "",
    ]),
  ];

  return "\ufeff" + rows.map((row) => row.map(csvEscape).join(",")).join("\n");
};

const buildPdfBlob = (leads: LeadItem[], clinicId: string) => {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 48;
  const startY = 740;
  const lineHeight = 14;
  const maxLinesPerPage = 42;

  const lines: string[] = [
    "Lead Inbox Report",
    `Clinic ID: ${clinicId}`,
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    "",
  ];

  leads.forEach((lead, index) => {
    lines.push(`Lead ${index + 1}`);
    lines.push(`Type: ${lead.actionType === "whatsapp" ? "WhatsApp" : "Call"}`);
    lines.push(`User: ${lead.userName || "Unknown user"}`);
    lines.push(`Email: ${lead.userEmail || "No email"}`);
    lines.push(`Contact: ${lead.userContactNo || "No contact number"}`);
    lines.push(`Patient ID: ${lead.userPatientId || "No patient id"}`);
    lines.push(`Created: ${formatDateTime(lead.createdAt)}`);
    lines.push("");
  });

  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }
  if (pages.length === 0) pages.push(lines);

  const objectBodies: string[] = [];
  objectBodies[0] = "<< /Type /Catalog /Pages 2 0 R >>";

  const pageRefs: string[] = [];
  let nextObjectNumber = 4;

  pages.forEach((pageLines) => {
    const contentObjectNumber = nextObjectNumber++;
    const pageObjectNumber = nextObjectNumber++;
    pageRefs.push(`${pageObjectNumber} 0 R`);

    const contentLines: string[] = [];
    contentLines.push("BT");
    contentLines.push("/F1 12 Tf");

    pageLines.forEach((line, index) => {
      const y = startY - index * lineHeight;
      contentLines.push(`1 0 0 1 ${marginX} ${y} Tm`);
      contentLines.push(`(${pdfEscape(line)}) Tj`);
    });

    contentLines.push("ET");

    const contentBody = contentLines.join("\n");
    objectBodies[contentObjectNumber - 1] =
      `<< /Length ${contentBody.length} >>\nstream\n${contentBody}\nendstream`;
    objectBodies[pageObjectNumber - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
  });

  objectBodies[1] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`;
  objectBodies[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let i = 0; i < objectBodies.length; i += 1) {
    const body = objectBodies[i];
    if (!body) continue;
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf + xref], { type: "application/pdf" });
};

export default function Lead({ clinicId }: LeadProps) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingLeadId, setDeletingLeadId] = useState("");

  const token = Cookies.get("token") || "";

  const fetchLeads = async () => {
    if (!clinicId || !token) {
      setLoading(false);
      setError(!clinicId ? "Clinic id is missing." : "Clinic session not found.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/leads/clinic/${clinicId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load leads");
      }

      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setLeads([]);
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verifyClinicSession = () => {
      if (!token) {
        setLoading(false);
        setError("Clinic session not found.");
        return false;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded.role?.toLowerCase() !== "clinic") {
          setLoading(false);
          setError("Clinic access denied.");
          return false;
        }
      } catch {
        setLoading(false);
        setError("Invalid clinic session.");
        return false;
      }

      return true;
    };

    if (verifyClinicSession()) {
      void fetchLeads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm("Delete this lead?")) return;

    setDeletingLeadId(leadId);
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete lead");
      }

      setLeads((prev) => prev.filter((lead) => lead._id !== leadId));
    } catch (err: any) {
      alert(err.message || "Failed to delete lead");
    } finally {
      setDeletingLeadId("");
    }
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([buildCsv(leads)], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, `lead-inbox-${clinicId}.csv`);
  };

  const handleDownloadPdf = () => {
    const blob = buildPdfBlob(leads, clinicId);
    downloadBlob(blob, `lead-inbox-${clinicId}.pdf`);
  };

  const leadCount = leads.length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#163252" }}>
            Lead Inbox
          </h3>
          <p style={{ margin: "6px 0 0", color: "#5f718a" }}>
            Calls and WhatsApp clicks from logged-in users for this clinic.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={leads.length === 0}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(153,169,192,0.25)",
              background: "#fff",
              color: "#173252",
              fontWeight: 700,
              cursor: leads.length === 0 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiDownload />
            CSV
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={leads.length === 0}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(153,169,192,0.25)",
              background: "#fff",
              color: "#173252",
              fontWeight: 700,
              cursor: leads.length === 0 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiDownload />
            PDF
          </button>

          <span
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              background: "#eef5ff",
              color: "#173252",
              fontWeight: 800,
            }}
          >
            {leadCount} lead{leadCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            background: "#f9fbff",
            border: "1px dashed rgba(114,130,154,0.35)",
            color: "#41556f",
          }}
        >
          Loading leads...
        </div>
      ) : error ? (
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            background: "#fff5f5",
            border: "1px solid rgba(220, 38, 38, 0.16)",
            color: "#b42318",
          }}
        >
          {error}
        </div>
      ) : leads.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            background: "#f9fbff",
            border: "1px dashed rgba(114,130,154,0.35)",
            color: "#41556f",
          }}
        >
          No leads yet. When a logged-in user taps Call or WhatsApp on your
          clinic card, the details will appear here.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {leads.map((lead) => (
            <article
              key={lead._id}
              style={{
                padding: 18,
                borderRadius: 20,
                background: "#fff",
                border: "1px solid rgba(153,169,192,0.2)",
                boxShadow: "0 10px 24px rgba(23, 43, 73, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {lead.actionType === "whatsapp" ? (
                    <FiMessageCircle color="#16a34a" />
                  ) : (
                    <FiPhone color="#2563eb" />
                  )}
                  <strong style={{ color: "#163252" }}>
                    {lead.actionType === "whatsapp"
                      ? "WhatsApp lead"
                      : "Call lead"}
                  </strong>
                </div>

                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "#6d7f98",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiClock />
                  {formatDateTime(lead.createdAt)}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  marginTop: 14,
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#314461" }}>
                  {lead.userProfileImage ? (
                    <img
                      src={resolveMediaUrl(lead.userProfileImage) || lead.userProfileImage}
                      alt={lead.userName || "User"}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid rgba(153,169,192,0.25)",
                      }}
                    />
                  ) : (
                    <FiUser />
                  )}
                  <span>{lead.userName || "Unknown user"}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    color: "#314461",
                  }}
                >
                  <FiMail />
                  <span>{lead.userEmail || "No email"}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    color: "#314461",
                  }}
                >
                  <FiPhone />
                  <span>{lead.userContactNo || "No contact number"}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    color: "#314461",
                  }}
                >
                  <FiUser />
                  <span>{lead.userPatientId || "No patient id"}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => handleDeleteLead(lead._id)}
                  disabled={deletingLeadId === lead._id}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: "10px 14px",
                    background: "#fff1f2",
                    color: "#be123c",
                    fontWeight: 700,
                    cursor:
                      deletingLeadId === lead._id ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiTrash2 />
                  {deletingLeadId === lead._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

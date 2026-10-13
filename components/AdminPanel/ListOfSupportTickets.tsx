"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { Ticket } from "@/components/tickets/TicketThread";
import AdminTicketPanel from "./AdminTicketPanel";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";

type ListOfSupportTicketsProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const REQUESTER_TYPE_LABEL: Record<Ticket["requesterType"], string> = {
  clinic: "Clinic",
  doctor: "Doctor",
  b2buser: "B2B User",
};

const STATUS_STYLE: Record<Ticket["status"], React.CSSProperties> = {
  open: { background: "rgba(37, 99, 235, 0.1)", color: "#1d4ed8" },
  answered: { background: "rgba(22, 163, 74, 0.12)", color: "#15803d" },
  closed: { background: "rgba(100, 116, 139, 0.12)", color: "#475569" },
};

const PRIORITY_STYLE: Record<Ticket["priority"], React.CSSProperties> = {
  high: { background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" },
  medium: { background: "rgba(245, 158, 11, 0.14)", color: "#b45309" },
  low: { background: "rgba(100, 116, 139, 0.12)", color: "#475569" },
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: 999,
  fontSize: 11.5,
  fontWeight: 800,
  textTransform: "capitalize",
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ListOfSupportTickets({
  canEdit = true,
  canDelete = true,
}: ListOfSupportTicketsProps) {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`${API_URL}/support-tickets${query}`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (ticket) =>
        ticket.ticketNumber.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.requesterName.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const handleTicketUpdate = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const bulkSelection = useBulkSelection(filteredTickets, (ticket) => ticket._id);

  const handleDownloadCSV = () => {
    const rows = [
      [
        "Ticket #",
        "Requester",
        "Requester Type",
        "Email",
        "Phone",
        "Department",
        "Subject",
        "Priority",
        "Status",
        "Last Updated",
      ],
      ...filteredTickets.map((ticket) => [
        ticket.ticketNumber,
        ticket.requesterName,
        REQUESTER_TYPE_LABEL[ticket.requesterType],
        ticket.requesterEmail || "-",
        ticket.requesterPhone || "-",
        ticket.department || "-",
        ticket.subject,
        ticket.priority,
        ticket.status,
        formatDate(ticket.updatedAt),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "support-tickets.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredTickets
      .map(
        (ticket) => `<tr>
          <td>${escapeHtml(ticket.ticketNumber)}</td>
          <td>${escapeHtml(ticket.requesterName)}</td>
          <td>${escapeHtml(REQUESTER_TYPE_LABEL[ticket.requesterType])}</td>
          <td>${escapeHtml(ticket.requesterEmail || "-")}</td>
          <td>${escapeHtml(ticket.requesterPhone || "-")}</td>
          <td>${escapeHtml(ticket.department || "-")}</td>
          <td>${escapeHtml(ticket.subject)}</td>
          <td>${escapeHtml(ticket.priority)}</td>
          <td>${escapeHtml(ticket.status)}</td>
          <td>${escapeHtml(formatDate(ticket.updatedAt))}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Support Tickets</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Support Tickets</h2>
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Requester</th>
                <th>Requester Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Last Updated</th>
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

  if (selectedTicketId) {
    return (
      <div style={{ padding: 4 }}>
        <AdminTicketPanel
          ticketId={selectedTicketId}
          canEdit={canEdit}
          onTicketUpdate={handleTicketUpdate}
          onBack={() => setSelectedTicketId("")}
        />
      </div>
    );
  }

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
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ticket #, subject, or requester"
          style={{
            flex: "1 1 280px",
            padding: "11px 14px",
            borderRadius: 12,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "11px 14px",
            borderRadius: 12,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="answered">Answered</option>
          <option value="closed">Closed</option>
        </select>
        <button
          type="button"
          onClick={handleDownloadCSV}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            background: "linear-gradient(180deg, #2981b7 0%, #10678c 100%)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(15, 23, 42, 0.14)",
          }}
        >
          Download CSV
        </button>
        <button
          type="button"
          onClick={handleDownloadPDF}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            background: "linear-gradient(180deg, #2981b7 0%, #10678c 100%)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(15, 23, 42, 0.14)",
          }}
        >
          Download PDF
        </button>
      </div>

      <BulkSelectBar
        endpointPath="support-tickets"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="tickets"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setTickets((prev) => prev.filter((t) => !deletedIds.includes(t._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />

      {loading ? (
        <p>Loading tickets...</p>
      ) : filteredTickets.length === 0 ? (
        <p style={{ color: "#64748b" }}>No support tickets found.</p>
      ) : (
        <div className={bulkStyles.tableScroll}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                {canDelete && (
                  <th
                    className={bulkStyles.checkboxCell}
                    style={{
                      background: "linear-gradient(135deg, #0a4b83 0%, #1264a3 100%)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelection.isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = bulkSelection.isSomeSelected;
                      }}
                      onChange={bulkSelection.toggleAll}
                      aria-label="Select all tickets on this page"
                    />
                  </th>
                )}
                {[
                  "Ticket #",
                  "Requester",
                  "Email",
                  "Phone",
                  "Department",
                  "Subject",
                  "Priority",
                  "Status",
                  "Last Updated",
                ].map((label) => (
                  <th
                    key={label}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      background: "linear-gradient(135deg, #0a4b83 0%, #1264a3 100%)",
                      color: "#eaf3ff",
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  onClick={() => setSelectedTicketId(ticket._id)}
                  style={{ cursor: "pointer" }}
                >
                  {canDelete && (
                    <td
                      className={bulkStyles.checkboxCell}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(ticket._id)}
                        onChange={() => bulkSelection.toggle(ticket._id)}
                        aria-label={`Select ${ticket.ticketNumber}`}
                      />
                    </td>
                  )}
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>
                    {ticket.ticketNumber}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    {ticket.requesterName}
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                      {REQUESTER_TYPE_LABEL[ticket.requesterType]}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    {ticket.requesterEmail || "-"}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    {ticket.requesterPhone || "-"}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    {ticket.department || "-"}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    {ticket.subject}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ ...pillStyle, ...PRIORITY_STYLE[ticket.priority] }}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb" }}>
                    <span style={{ ...pillStyle, ...STATUS_STYLE[ticket.status] }}>
                      {ticket.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>
                    {formatDate(ticket.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

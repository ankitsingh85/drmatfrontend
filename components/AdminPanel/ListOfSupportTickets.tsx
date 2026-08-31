"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import { Ticket } from "@/components/tickets/TicketThread";
import AdminTicketPanel from "./AdminTicketPanel";

type ListOfSupportTicketsProps = {
  canEdit?: boolean;
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

export default function ListOfSupportTickets({ canEdit = true }: ListOfSupportTicketsProps) {
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
      </div>

      {loading ? (
        <p>Loading tickets...</p>
      ) : filteredTickets.length === 0 ? (
        <p style={{ color: "#64748b" }}>No support tickets found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                {["Ticket #", "Requester", "Subject", "Priority", "Status", "Last Updated"].map(
                  (label) => (
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
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  onClick={() => setSelectedTicketId(ticket._id)}
                  style={{ cursor: "pointer" }}
                >
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

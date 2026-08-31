"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";
import TicketThread, { Ticket } from "@/components/tickets/TicketThread";

type AdminTicketPanelProps = {
  ticketId: string;
  canEdit?: boolean;
  onBack?: () => void;
  onTicketUpdate?: (ticket: Ticket) => void;
  showHiringDetails?: boolean;
};

export default function AdminTicketPanel({
  ticketId,
  canEdit = true,
  onBack,
  onTicketUpdate,
  showHiringDetails = true,
}: AdminTicketPanelProps) {
  const toast = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/support-tickets/${ticketId}`);
      const data = await res.json();
      if (res.ok) setTicket(data);
    } catch (err) {
      console.error("Failed to fetch ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleReply = async (message: string, files: File[]) => {
    if (!ticket || !canEdit) return;

    try {
      setReplying(true);
      const formData = new FormData();
      formData.append("message", message);
      formData.append("senderName", "Support Team");
      files.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${API_URL}/support-tickets/${ticket._id}/reply`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send reply");

      setTicket(data.ticket);
      onTicketUpdate?.(data.ticket);
      toast.success("Reply sent");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: Ticket["status"]) => {
    if (!ticket || !canEdit) return;

    try {
      const res = await fetch(`${API_URL}/support-tickets/${ticket._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update status");

      setTicket(data.ticket);
      onTicketUpdate?.(data.ticket);
      toast.success(`Ticket marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  if (loading || !ticket) {
    return <p>Loading ticket...</p>;
  }

  return (
    <TicketThread
      ticket={ticket}
      viewerRole="admin"
      onReply={handleReply}
      onStatusChange={canEdit ? handleStatusChange : undefined}
      replying={replying}
      onBack={onBack}
      showHiringDetails={showHiringDetails}
    />
  );
}

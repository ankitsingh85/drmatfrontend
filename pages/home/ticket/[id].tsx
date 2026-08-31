"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import FullPageLoader from "@/components/common/FullPageLoader";
import { API_URL } from "@/config/api";
import TicketThread, { Ticket } from "@/components/tickets/TicketThread";
import styles from "@/styles/hiringSummary.module.css";

export default function TicketDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replying, setReplying] = useState(false);

  const token = Cookies.get("token") || "";
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/support-tickets/${id}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load ticket");
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) {
      router.replace(`/businesslogin?next=/home/ticket/${id}`);
      return;
    }
    void fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id]);

  const handleReply = async (message: string, files: File[]) => {
    if (!ticket) return;
    try {
      setReplying(true);
      const formData = new FormData();
      formData.append("message", message);
      files.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${API_URL}/support-tickets/${ticket._id}/reply`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send reply");
      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || "Unable to send reply");
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: Ticket["status"]) => {
    if (!ticket) return;
    try {
      const res = await fetch(`${API_URL}/support-tickets/${ticket._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update ticket");
      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || "Unable to update ticket");
    }
  };

  if (loading) return <FullPageLoader />;

  return (
    <>
      <Topbar />
      <main className={styles.page} style={{ maxWidth: 1080 }}>
        {error && !ticket ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push("/home/ClinicHiringPortal")}
              style={{ marginTop: 16 }}
            >
              Back to Hiring Portal
            </button>
          </div>
        ) : ticket ? (
          <TicketThread
            ticket={ticket}
            viewerRole="requester"
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            replying={replying}
            onBack={() => router.push("/home/ClinicHiringPortal")}
          />
        ) : null}
      </main>
      <Footer />
    </>
  );
}

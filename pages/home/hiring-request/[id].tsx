"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { FiSend } from "react-icons/fi";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import FullPageLoader from "@/components/common/FullPageLoader";
import { API_URL } from "@/config/api";
import HiringDetailsCard from "@/components/tickets/HiringDetailsCard";
import TicketThread, { Ticket, TicketHiringDetails } from "@/components/tickets/TicketThread";
import styles from "@/styles/supportTicket.module.css";
import summaryStyles from "@/styles/hiringSummary.module.css";

type HiringRequestStatus = "pending" | "in_review" | "fulfilled" | "cancelled";

type HiringRequest = {
  _id: string;
  requestNumber: string;
  requesterType: "clinic" | "doctor" | "b2buser";
  requesterName: string;
  status: HiringRequestStatus;
  hiringDetails: TicketHiringDetails;
  createdAt?: string;
  updatedAt?: string;
};

const STATUS_LABEL: Record<HiringRequestStatus, string> = {
  pending: "Request Sent",
  in_review: "In Review",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_CLASS: Record<HiringRequestStatus, string> = {
  pending: styles.statusPending,
  in_review: styles.statusInReview,
  fulfilled: styles.statusFulfilled,
  cancelled: styles.statusCancelled,
};

const TICKET_STATUS_CLASS: Record<Ticket["status"], string> = {
  open: styles.statusOpen,
  answered: styles.statusAnswered,
  closed: styles.statusClosed,
};

export default function HiringRequestDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const [request, setRequest] = useState<HiringRequest | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replying, setReplying] = useState(false);

  const [raiseOpen, setRaiseOpen] = useState(false);
  const [querySubject, setQuerySubject] = useState("");
  const [queryMessage, setQueryMessage] = useState("");
  const [raising, setRaising] = useState(false);

  const token = Cookies.get("token") || "";
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchTicketDetail = async (ticketId: string) => {
    try {
      const res = await fetch(`${API_URL}/support-tickets/${ticketId}`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setSelectedTicket(data);
    } catch {
      // keep whatever was already selected
    }
  };

  const fetchAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");

      const reqRes = await fetch(`${API_URL}/hiring-requests/${id}`, { headers: authHeaders });
      const reqData = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqData?.message || "Failed to load request");
      setRequest(reqData);

      const ticketsRes = await fetch(`${API_URL}/support-tickets/mine?hiringRequestId=${id}`, {
        headers: authHeaders,
      });
      const ticketsData = await ticketsRes.json();
      const list: Ticket[] = Array.isArray(ticketsData) ? ticketsData : [];
      setTickets(list);

      const active = list.find((t) => t.status !== "closed");
      const chosen = active || list[0];
      if (chosen) {
        void fetchTicketDetail(chosen._id);
      } else {
        setSelectedTicket(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) {
      router.replace(`/businesslogin?next=/home/hiring-request/${id}`);
      return;
    }
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id]);

  const handleReply = async (message: string, files: File[]) => {
    if (!selectedTicket) return;
    try {
      setReplying(true);
      const formData = new FormData();
      formData.append("message", message);
      files.forEach((file) => formData.append("attachments", file));

      const res = await fetch(`${API_URL}/support-tickets/${selectedTicket._id}/reply`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send reply");
      setSelectedTicket(data.ticket);
      setTickets((prev) => prev.map((t) => (t._id === data.ticket._id ? data.ticket : t)));
    } catch (err: any) {
      setError(err.message || "Unable to send reply");
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: Ticket["status"]) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`${API_URL}/support-tickets/${selectedTicket._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update ticket");
      setSelectedTicket(data.ticket);
      setTickets((prev) => prev.map((t) => (t._id === data.ticket._id ? data.ticket : t)));
    } catch (err: any) {
      setError(err.message || "Unable to update ticket");
    }
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !queryMessage.trim()) return;

    try {
      setRaising(true);
      setError("");
      const formData = new FormData();
      formData.append("message", queryMessage.trim());
      formData.append(
        "subject",
        querySubject.trim() || `Query on ${request.hiringDetails.roleRequired}`
      );
      formData.append("priority", "medium");

      const res = await fetch(`${API_URL}/hiring-requests/${request._id}/tickets`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to raise ticket");

      setTickets((prev) => [data.ticket, ...prev]);
      setSelectedTicket(data.ticket);
      setQuerySubject("");
      setQueryMessage("");
      setRaiseOpen(false);
    } catch (err: any) {
      setError(err.message || "Unable to raise ticket");
    } finally {
      setRaising(false);
    }
  };

  if (loading) return <FullPageLoader />;

  if (error && !request) {
    return (
      <>
        <Topbar />
        <main className={summaryStyles.page} style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>
          <button
            type="button"
            className={summaryStyles.secondaryBtn}
            onClick={() => router.push("/home/ClinicHiringPortal")}
            style={{ marginTop: 16 }}
          >
            Back to Hiring Portal
          </button>
        </main>
        <Footer />
      </>
    );
  }

  if (!request) return null;

  const hasActiveTicket = tickets.some((t) => t.status !== "closed");

  return (
    <>
      <Topbar />
      <main className={styles.wrap} style={{ maxWidth: 1080, margin: "28px auto 60px", padding: "0 20px" }}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => router.push("/home/ClinicHiringPortal")}
        >
          ← Back to Hiring Portal
        </button>

        <div className={styles.headerBanner}>
          <div>
            <p className={styles.breadcrumb}>Hiring &gt; Requests &gt; {request.requestNumber}</p>
            <h1 className={styles.title}>{request.hiringDetails.roleRequired}</h1>
            <span className={styles.ticketNumberTag}>{request.requestNumber}</span>
          </div>
          <div className={styles.headerBadges}>
            <span className={`${styles.badge} ${styles.badgeLg} ${STATUS_CLASS[request.status]}`}>
              {STATUS_LABEL[request.status]}
            </span>
          </div>
        </div>

        <HiringDetailsCard details={request.hiringDetails} />

        <div className={styles.ticketListCard}>
          <h4>Tickets on this request</h4>

          {tickets.length === 0 ? (
            <p className={styles.emptyMessages} style={{ padding: "10px 0" }}>
              No tickets raised yet. If you have a query about this request, raise a ticket below.
            </p>
          ) : (
            <div className={styles.ticketListItems}>
              {tickets.map((t) => (
                <button
                  type="button"
                  key={t._id}
                  className={`${styles.ticketListItem} ${
                    selectedTicket?._id === t._id ? styles.ticketListItemActive : ""
                  }`}
                  onClick={() => fetchTicketDetail(t._id)}
                >
                  <div className={styles.ticketListItemMeta}>
                    <strong>{t.subject}</strong>
                    <span>{t.ticketNumber}</span>
                  </div>
                  <span className={`${styles.badge} ${TICKET_STATUS_CLASS[t.status]}`}>{t.status}</span>
                </button>
              ))}
            </div>
          )}

          {hasActiveTicket ? (
            <p className={styles.activeTicketNotice}>
              You have an open ticket for this request. You can raise a new one once it's closed.
            </p>
          ) : raiseOpen ? (
            <form className={styles.raiseTicketForm} onSubmit={handleRaiseTicket}>
              <input
                className={styles.raiseTicketInput}
                value={querySubject}
                onChange={(e) => setQuerySubject(e.target.value)}
                placeholder="Subject (optional)"
              />
              <textarea
                className={styles.raiseTicketInput}
                rows={3}
                value={queryMessage}
                onChange={(e) => setQueryMessage(e.target.value)}
                placeholder="Describe your query..."
                autoFocus
              />
              <div className={styles.raiseFormActions}>
                <button type="submit" className={styles.raiseTicketBtn} disabled={raising}>
                  {raising ? "Raising..." : "Raise Ticket"}
                </button>
                <button
                  type="button"
                  className={styles.cancelRaiseBtn}
                  onClick={() => setRaiseOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className={styles.raiseTicketBtn}
              onClick={() => setRaiseOpen(true)}
            >
              <FiSend /> Raise a Ticket
            </button>
          )}
        </div>

        {error && <p className={summaryStyles.errorText}>{error}</p>}

        {selectedTicket && (
          <TicketThread
            ticket={selectedTicket}
            viewerRole="requester"
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            replying={replying}
            showHiringDetails={false}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import {
  FiCalendar,
  FiFolder,
  FiPaperclip,
  FiRefreshCw,
  FiSend,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { resolveMediaUrl } from "@/lib/media";
import styles from "@/styles/supportTicket.module.css";
import HiringDetailsCard from "./HiringDetailsCard";

export type TicketMessage = {
  senderType: "requester" | "admin";
  senderName?: string;
  message: string;
  attachments?: { url: string; name: string }[];
  createdAt?: string;
};

export type TicketHiringDetails = {
  roleRequired?: string;
  jobType?: string;
  teamMembersRequired?: number;
  experienceRequired?: string;
  location?: string;
  salaryRange?: string;
  requiredSkills?: string;
  additionalInfo?: string;
};

export type Ticket = {
  _id: string;
  ticketNumber: string;
  requesterType: "clinic" | "doctor" | "b2buser";
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  department: string;
  subject: string;
  priority: "low" | "medium" | "high";
  status: "open" | "answered" | "closed";
  hiringDetails?: TicketHiringDetails;
  messages: TicketMessage[];
  createdAt?: string;
  updatedAt?: string;
};

const REQUESTER_TYPE_LABEL: Record<Ticket["requesterType"], string> = {
  clinic: "Clinic",
  doctor: "Doctor",
  b2buser: "B2B User",
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

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

interface TicketThreadProps {
  ticket: Ticket;
  viewerRole: "requester" | "admin";
  onReply: (message: string, files: File[]) => Promise<void> | void;
  onStatusChange?: (status: Ticket["status"]) => Promise<void> | void;
  replying?: boolean;
  onBack?: () => void;
  // Hidden when this thread is embedded under a hiring-request detail
  // page that already renders the same hiring details above it.
  showHiringDetails?: boolean;
}

export default function TicketThread({
  ticket,
  onReply,
  onStatusChange,
  replying = false,
  onBack,
  showHiringDetails = true,
}: TicketThreadProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const messagesNewestFirst = useMemo(
    () => [...(ticket.messages || [])].reverse(),
    [ticket.messages]
  );

  const isClosed = ticket.status === "closed";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && files.length === 0) return;
    await onReply(message.trim(), files);
    setMessage("");
    setFiles([]);
    setReplyOpen(false);
  };

  const statusBadgeClass =
    ticket.status === "closed"
      ? styles.statusClosed
      : ticket.status === "answered"
      ? styles.statusAnswered
      : styles.statusOpen;

  const priorityBadgeClass =
    ticket.priority === "high"
      ? styles.priorityHigh
      : ticket.priority === "low"
      ? styles.priorityLow
      : styles.priorityMedium;

  return (
    <div className={styles.wrap}>
      {onBack && (
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Back to tickets
        </button>
      )}

      {/* ============ HEADER BANNER ============ */}
      <div className={styles.headerBanner}>
        <div>
          <p className={styles.breadcrumb}>Support &gt; Tickets &gt; {ticket.ticketNumber}</p>
          <h1 className={styles.title}>{ticket.subject}</h1>
          <span className={styles.ticketNumberTag}>{ticket.ticketNumber}</span>
        </div>
        <div className={styles.headerBadges}>
          <span className={`${styles.badge} ${styles.badgeLg} ${statusBadgeClass}`}>
            {ticket.status}
          </span>
          <span className={`${styles.badge} ${styles.badgeLg} ${priorityBadgeClass}`}>
            {ticket.priority} priority
          </span>
        </div>
      </div>

      {/* ============ HIRING REQUEST DETAILS ============ */}
      {showHiringDetails && ticket.hiringDetails && (
        <HiringDetailsCard details={ticket.hiringDetails} />
      )}

      <div className={styles.layout}>
        {/* ============ SIDEBAR ============ */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h4>Ticket Information</h4>

            <div className={styles.sidebarRow}>
              <span>
                <FiUser /> Requestor
              </span>
              <strong>
                {ticket.requesterName}
                <span className={styles.roleBadgeOwner}>
                  {REQUESTER_TYPE_LABEL[ticket.requesterType]}
                </span>
              </strong>
            </div>

            <div className={styles.sidebarRow}>
              <span>
                <FiFolder /> Department
              </span>
              <strong>{ticket.department}</strong>
            </div>

            <div className={styles.sidebarRow}>
              <span>
                <FiCalendar /> Submitted
              </span>
              <strong>{formatDate(ticket.createdAt)}</strong>
            </div>

            <div className={styles.sidebarRow}>
              <span>
                <FiRefreshCw /> Last Updated
              </span>
              <strong>{formatDate(ticket.updatedAt)}</strong>
            </div>

            <div className={styles.sidebarActions}>
              <button
                type="button"
                className={styles.replyActionBtn}
                onClick={() => setReplyOpen((prev) => !prev)}
              >
                <FiSend /> Reply
              </button>
              {onStatusChange && (
                <button
                  type="button"
                  className={styles.closedActionBtn}
                  onClick={() => onStatusChange(isClosed ? "open" : "closed")}
                >
                  <FiXCircle /> {isClosed ? "Reopen" : "Closed"}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ============ MAIN ============ */}
        <div className={styles.main}>
          {isClosed && (
            <div className={styles.closedBanner}>
              This ticket is closed. You may reply to this ticket to reopen it.
            </div>
          )}

          <div className={styles.replyPanel}>
            <button
              type="button"
              className={styles.replyToggle}
              onClick={() => setReplyOpen((prev) => !prev)}
            >
              <FiSend /> Reply {replyOpen ? "−" : "+"}
            </button>

            {replyOpen && (
              <form className={styles.replyForm} onSubmit={handleSubmitReply}>
                <textarea
                  className={styles.replyTextarea}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  autoFocus
                />
                <div className={styles.replyFormFooter}>
                  <label className={styles.attachLabel}>
                    <FiPaperclip />
                    {files.length > 0 ? `${files.length} file(s) selected` : "Attach files"}
                    <input type="file" multiple hidden onChange={handleFileChange} />
                  </label>
                  <button type="submit" className={styles.sendBtn} disabled={replying}>
                    {replying ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className={styles.messages}>
            {messagesNewestFirst.map((msg, index) => {
              const isRequester = msg.senderType === "requester";
              return (
                <div
                  key={index}
                  className={`${styles.messageCard} ${
                    isRequester ? styles.messageCardRequester : styles.messageCardAdmin
                  }`}
                >
                  <div className={styles.messageHeader}>
                    <span
                      className={`${styles.messageAvatar} ${
                        isRequester ? styles.messageAvatarRequester : styles.messageAvatarAdmin
                      }`}
                    >
                      {isRequester ? getInitials(msg.senderName || "U") : <FiUser />}
                    </span>
                    <div className={styles.messageMeta}>
                      <span className={styles.messageSender}>
                        {msg.senderName || (isRequester ? "Requester" : "Support Team")}
                        <span
                          className={
                            isRequester ? styles.roleBadgeOwner : styles.roleBadgeOperator
                          }
                        >
                          {isRequester ? "Owner" : "Operator"}
                        </span>
                      </span>
                      <span className={styles.messageSub}>{isRequester ? "Owner" : "Staff"}</span>
                    </div>
                    <span className={styles.messageTime}>{formatDate(msg.createdAt)}</span>
                  </div>

                  {msg.message && <p className={styles.messageBody}>{msg.message}</p>}

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={styles.attachmentsRow}>
                      <span>Attachments ({msg.attachments.length})</span>
                      <div>
                        {msg.attachments.map((att, attIndex) => (
                          <a
                            key={attIndex}
                            href={resolveMediaUrl(att.url) || att.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {att.name || `Attachment ${attIndex + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {messagesNewestFirst.length === 0 && (
              <p className={styles.emptyMessages}>No messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { API_URL } from "@/config/api";
import Cookies from "js-cookie";
import React, { useEffect, useMemo, useState } from "react";
import { FiMessageSquare, FiRefreshCcw, FiSend } from "react-icons/fi";
import styles from "@/styles/ClinicHiringPortal.module.css";

type HiringStatus =
  | "pending"
  | "in_review"
  | "accepted"
  | "rejected"
  | "fulfilled";

type HiringMessage = {
  _id?: string;
  senderType: "clinic" | "admin";
  senderName?: string;
  message: string;
  createdAt?: string;
};

type HiringRequest = {
  _id: string;
  clinicName: string;
  clinicEmail?: string;
  clinicPhone?: string;
  roleRequired: string;
  teamMembersRequired: number;
  experienceRequired?: string;
  location: string;
  jobType: string;
  salaryRange?: string;
  commissionEnabled: boolean;
  commissionDetails?: string;
  requiredSkills?: string;
  additionalInfo?: string;
  status: HiringStatus;
  messages?: HiringMessage[];
  createdAt?: string;
};

const statusLabels: Record<HiringStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  accepted: "Accepted",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
};

const statuses = Object.keys(statusLabels) as HiringStatus[];

export default function ClinicHiringRequests() {
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const adminName = Cookies.get("adminName") || "Admin";

  const selectedRequest = useMemo(
    () => requests.find((request) => request._id === selectedId) || null,
    [requests, selectedId]
  );

  const loadRequests = async () => {
    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch(`${API_URL}/hiring-requests/admin`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load hiring requests");
      }

      const nextRequests = Array.isArray(data) ? data : [];
      setRequests(nextRequests);
      setSelectedId((current) => current || nextRequests[0]?._id || "");
    } catch (err: any) {
      setFeedback(err.message || "Unable to load hiring requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const updateStatus = async (requestId: string, status: HiringStatus) => {
    try {
      const res = await fetch(
        `${API_URL}/hiring-requests/admin/${requestId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }

      setRequests((current) =>
        current.map((request) =>
          request._id === requestId ? { ...request, status } : request
        )
      );
    } catch (err: any) {
      setFeedback(err.message || "Unable to update status");
    }
  };

  const sendReply = async () => {
    if (!selectedRequest || !message.trim()) return;

    try {
      const res = await fetch(
        `${API_URL}/hiring-requests/${selectedRequest._id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderType: "admin",
            senderName: adminName,
            message: message.trim(),
          }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send reply");
      }

      setMessage("");
      setRequests((current) =>
        current.map((request) =>
          request._id === selectedRequest._id ? data.request : request
        )
      );
    } catch (err: any) {
      setFeedback(err.message || "Unable to send reply");
    }
  };

  return (
    <div className={styles.adminShell}>
      <div className={styles.adminToolbar}>
        <div>
          <h2>Clinic Hiring Requests</h2>
          <p>Review clinic staffing needs, update status, and reply to chat.</p>
        </div>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={loadRequests}
          disabled={loading}
        >
          <FiRefreshCcw />
          {loading ? "Loading" : "Refresh"}
        </button>
      </div>

      {feedback && <p className={styles.feedbackText}>{feedback}</p>}

      <div className={styles.adminGrid}>
        <div className={styles.adminList}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Clinic</th>
                <th>Role</th>
                <th>Members</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={4}>No hiring requests found.</td>
                </tr>
              )}

              {requests.map((request) => (
                <tr
                  key={request._id}
                  className={
                    selectedId === request._id ? styles.selectedAdminRow : ""
                  }
                  onClick={() => setSelectedId(request._id)}
                >
                  <td>
                    <strong>{request.clinicName}</strong>
                    <br />
                    <small>{request.clinicPhone || request.clinicEmail}</small>
                  </td>
                  <td>{request.roleRequired}</td>
                  <td>{request.teamMembersRequired}</td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <select
                      className={styles.statusSelect}
                      value={request.status}
                      onChange={(event) =>
                        updateStatus(
                          request._id,
                          event.target.value as HiringStatus
                        )
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className={styles.adminDetail}>
          {!selectedRequest && (
            <div className={styles.emptyState}>Select a request to view.</div>
          )}

          {selectedRequest && (
            <>
              <h3>{selectedRequest.roleRequired}</h3>
              <div className={styles.detailList}>
                <div>
                  <span>Clinic</span>
                  <strong>{selectedRequest.clinicName}</strong>
                </div>
                <div>
                  <span>Team members</span>
                  <strong>{selectedRequest.teamMembersRequired}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{selectedRequest.location}</strong>
                </div>
                <div>
                  <span>Job type</span>
                  <strong>{selectedRequest.jobType}</strong>
                </div>
                <div>
                  <span>Experience</span>
                  <strong>{selectedRequest.experienceRequired || "-"}</strong>
                </div>
                <div>
                  <span>Salary</span>
                  <strong>{selectedRequest.salaryRange || "-"}</strong>
                </div>
                <div>
                  <span>Commission</span>
                  <strong>
                    {selectedRequest.commissionEnabled
                      ? selectedRequest.commissionDetails || "Yes"
                      : "No"}
                  </strong>
                </div>
                <div>
                  <span>Skills</span>
                  <p>{selectedRequest.requiredSkills || "-"}</p>
                </div>
                <div>
                  <span>Additional info</span>
                  <p>{selectedRequest.additionalInfo || "-"}</p>
                </div>
              </div>
              
              <div className={styles.chatBox}>
                <div className={styles.chatHeader}>
                  <FiMessageSquare />
                  <strong>Chat with clinic</strong>
                </div>
                <div className={styles.messages}>
                  {(selectedRequest.messages || []).length === 0 && (
                    <p className={styles.emptyChat}>
                      No messages in this request.
                    </p>
                  )}
                  {(selectedRequest.messages || []).map((chat, index) => (
                    <div
                      key={chat._id || `${chat.createdAt}-${index}`}
                      className={`${styles.messageBubble} ${
                        chat.senderType === "admin"
                          ? styles.clinicMessage
                          : styles.adminMessage
                      }`}
                    >
                      <span>
                        {chat.senderType === "admin" ? "Admin" : "Clinic"}
                      </span>
                      <p>{chat.message}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.chatInputRow}>
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Reply to clinic"
                  />
                  <button type="button" onClick={sendReply}>
                    <FiSend />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

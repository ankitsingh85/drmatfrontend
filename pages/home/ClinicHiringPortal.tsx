"use client";

import { API_URL } from "@/config/api";
import Cookies from "js-cookie";
import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  IndianRupee,
  MapPin,
  MessageSquare,
  RefreshCcw,
  Send,
  Users,
} from "lucide-react";
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

type HiringForm = {
  roleRequired: string;
  teamMembersRequired: number;
  experienceRequired: string;
  location: string;
  jobType: string;
  salaryRange: string;
  commissionEnabled: boolean;
  commissionDetails: string;
  requiredSkills: string;
  additionalInfo: string;
};

const initialForm: HiringForm = {
  roleRequired: "Skin Therapist",
  teamMembersRequired: 2,
  experienceRequired: "1-3 years",
  location: "",
  jobType: "Full time",
  salaryRange: "Rs 18,000 - Rs 28,000 per month",
  commissionEnabled: true,
  commissionDetails: "Commission on treatment package conversions",
  requiredSkills: "Patient counselling, laser support, treatment coordination",
  additionalInfo: "",
};

const statusLabels: Record<HiringStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  accepted: "Accepted",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
};

export default function ClinicHiringPortal() {
  const [form, setForm] = useState<HiringForm>(initialForm);
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const token = Cookies.get("token") || "";
  const clinicName = Cookies.get("clinicName") || "Clinic";

  const selectedRequest = useMemo(
    () => requests.find((request) => request._id === selectedRequestId) || null,
    [requests, selectedRequestId]
  );

  const totalMembers = useMemo(
    () =>
      requests.reduce(
        (total, request) => total + (Number(request.teamMembersRequired) || 0),
        0
      ),
    [requests]
  );

  const loadRequests = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/hiring-requests/clinic`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load hiring requests");
      }

      const nextRequests = Array.isArray(data) ? data : [];
      setRequests(nextRequests);
      setSelectedRequestId((current) => current || nextRequests[0]?._id || "");
    } catch (err: any) {
      setFeedback(err.message || "Unable to load hiring requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm((current) => ({
      ...current,
      location: Cookies.get("location") || current.location,
    }));
    void loadRequests();
  }, []);

  const updateForm = (
    field: keyof HiringForm,
    value: string | number | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");

    if (!token) {
      setFeedback("Please login as clinic again before submitting.");
      return;
    }

    if (!form.roleRequired.trim() || !form.location.trim()) {
      setFeedback("Role and location are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/hiring-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send hiring request");
      }

      setFeedback("Hiring request sent to admin.");
      const created = data?.request as HiringRequest;
      setRequests((current) => [created, ...current]);
      setSelectedRequestId(created?._id || "");
      setForm(initialForm);
    } catch (err: any) {
      setFeedback(err.message || "Unable to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedRequest || !chatMessage.trim()) return;

    try {
      const res = await fetch(
        `${API_URL}/hiring-requests/${selectedRequest._id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderType: "clinic",
            senderName: clinicName,
            message: chatMessage.trim(),
          }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to send message");
      }

      setChatMessage("");
      setRequests((current) =>
        current.map((request) =>
          request._id === selectedRequest._id ? data.request : request
        )
      );
    } catch (err: any) {
      setFeedback(err.message || "Unable to send message");
    }
  };

  return (
    <section className={styles.portalSection}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            <Briefcase size={16} />
            Clinic Hiring Portal
          </span>
          <h2>Request clinic staff from admin</h2>
          <p>
            Tell admin how many team members you need, the role, salary,
            commission option, and required details. Admin can review and reply
            in the chat below.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div>
            <strong>{requests.length}</strong>
            <span>Total requests</span>
          </div>
          <div>
            <strong>{totalMembers}</strong>
            <span>Team members requested</span>
          </div>
          <div>
            <strong>{selectedRequest ? statusLabels[selectedRequest.status] : "-"}</strong>
            <span>Current status</span>
          </div>
        </div>
      </div>

      <div className={styles.portalGrid}>
        <form className={styles.formPanel} onSubmit={submitRequest}>
          <div className={styles.panelHeader}>
            <div>
              <span>Send to admin</span>
              <h3>Hiring requirement</h3>
            </div>
            <Building2 size={24} />
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              Role required
              <input
                value={form.roleRequired}
                onChange={(event) =>
                  updateForm("roleRequired", event.target.value)
                }
                placeholder="Eg. Dermatologist, therapist, receptionist"
              />
            </label>

            <label className={styles.field}>
              Team members required
              <input
                type="number"
                min="1"
                value={form.teamMembersRequired}
                onChange={(event) =>
                  updateForm("teamMembersRequired", Number(event.target.value))
                }
              />
            </label>

            <label className={styles.field}>
              Experience required
              <input
                value={form.experienceRequired}
                onChange={(event) =>
                  updateForm("experienceRequired", event.target.value)
                }
                placeholder="Eg. 2+ years"
              />
            </label>

            <label className={styles.field}>
              Location / branch
              <input
                value={form.location}
                onChange={(event) => updateForm("location", event.target.value)}
                placeholder="Clinic city or branch"
              />
            </label>

            <label className={styles.field}>
              Job type
              <select
                value={form.jobType}
                onChange={(event) => updateForm("jobType", event.target.value)}
              >
                <option>Full time</option>
                <option>Part time</option>
                <option>Contract</option>
                <option>Freelance</option>
                <option>Visiting</option>
              </select>
            </label>

            <label className={styles.field}>
              Salary range
              <input
                value={form.salaryRange}
                onChange={(event) =>
                  updateForm("salaryRange", event.target.value)
                }
                placeholder="Eg. Rs 20,000 - Rs 30,000"
              />
            </label>
          </div>

          <label className={styles.toggleField}>
            <input
              type="checkbox"
              checked={form.commissionEnabled}
              onChange={(event) =>
                updateForm("commissionEnabled", event.target.checked)
              }
            />
            <span>Commission option available</span>
          </label>

          {form.commissionEnabled && (
            <label className={styles.field}>
              Commission details
              <input
                value={form.commissionDetails}
                onChange={(event) =>
                  updateForm("commissionDetails", event.target.value)
                }
                placeholder="Eg. 5% package commission"
              />
            </label>
          )}

          <label className={styles.field}>
            Required skills
            <textarea
              value={form.requiredSkills}
              onChange={(event) =>
                updateForm("requiredSkills", event.target.value)
              }
              rows={3}
              placeholder="Add required skills and responsibilities."
            />
          </label>

          <label className={styles.field}>
            Additional information
            <textarea
              value={form.additionalInfo}
              onChange={(event) =>
                updateForm("additionalInfo", event.target.value)
              }
              rows={4}
              placeholder="Timings, interview preference, benefits, or any notes for admin."
            />
          </label>

          {feedback && <p className={styles.feedbackText}>{feedback}</p>}

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setForm(initialForm)}
            >
              Reset
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={submitting}
            >
              <Send size={17} />
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>

        <aside className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Your requests</span>
              <h3>Status & chat</h3>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={loadRequests}
              disabled={loading}
            >
              <RefreshCcw size={18} />
            </button>
          </div>

          <div className={styles.requestList}>
            {requests.length === 0 && (
              <div className={styles.emptyState}>
                No hiring request submitted yet.
              </div>
            )}

            {requests.map((request) => (
              <button
                type="button"
                key={request._id}
                className={`${styles.requestItem} ${
                  selectedRequestId === request._id ? styles.activeRequest : ""
                }`}
                onClick={() => setSelectedRequestId(request._id)}
              >
                <span>{request.roleRequired}</span>
                <strong>{statusLabels[request.status]}</strong>
                <small>
                  {request.teamMembersRequired} member
                  {request.teamMembersRequired > 1 ? "s" : ""} -{" "}
                  {request.location}
                </small>
              </button>
            ))}
          </div>

          {selectedRequest && (
            <>
              <div className={styles.requestSummary}>
                <span>
                  <Users size={16} />
                  {selectedRequest.teamMembersRequired} members
                </span>
                <span>
                  <MapPin size={16} />
                  {selectedRequest.location}
                </span>
                <span>
                  <IndianRupee size={16} />
                  {selectedRequest.salaryRange || "Salary not shared"}
                </span>
                <span>
                  <CheckCircle2 size={16} />
                  {selectedRequest.commissionEnabled
                    ? selectedRequest.commissionDetails || "Commission available"
                    : "No commission"}
                </span>
              </div>

              <div className={styles.chatBox}>
                <div className={styles.chatHeader}>
                  <MessageSquare size={18} />
                  <strong>Chat with admin</strong>
                </div>
                <div className={styles.messages}>
                  {(selectedRequest.messages || []).length === 0 && (
                    <p className={styles.emptyChat}>
                      Start the conversation with admin.
                    </p>
                  )}
                  {(selectedRequest.messages || []).map((message, index) => (
                    <div
                      key={message._id || `${message.createdAt}-${index}`}
                      className={`${styles.messageBubble} ${
                        message.senderType === "clinic"
                          ? styles.clinicMessage
                          : styles.adminMessage
                      }`}
                    >
                      <span>
                        {message.senderType === "clinic" ? "You" : "Admin"}
                      </span>
                      <p>{message.message}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.chatInputRow}>
                  <input
                    value={chatMessage}
                    onChange={(event) => setChatMessage(event.target.value)}
                    placeholder="Type message to admin"
                  />
                  <button type="button" onClick={sendMessage}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

"use client";

import { API_URL } from "@/config/api";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Briefcase, Building2, RefreshCcw } from "lucide-react";
import styles from "@/styles/ClinicHiringPortal.module.css";
import HiringWizard, { HiringForm } from "@/components/hiring/HiringWizard";

const DRAFT_KEY = "hiringRequestDraft";

type HiringRequestStatus = "pending" | "in_review" | "fulfilled" | "cancelled";

type HiringRequestListItem = {
  _id: string;
  requestNumber: string;
  status: HiringRequestStatus;
  hiringDetails: { roleRequired: string };
  createdAt?: string;
};

const STATUS_LABEL: Record<HiringRequestStatus, string> = {
  pending: "Request Sent",
  in_review: "In Review",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const defaultForm: HiringForm = {
  roleRequired: "Skin Therapist",
  teamMembersRequired: 2,
  experienceRequired: "1-3 years",
  location: "",
  jobType: "Full-time",
  salaryRange: "₹18,000 - ₹28,000 per month",
  commissionEnabled: false,
  commissionDetails: "",
  requiredSkills: "Patient counselling, laser support, treatment coordination",
  additionalInfo: "",
};

export default function ClinicHiringPortal() {
  const router = useRouter();
  const [form, setForm] = useState<HiringForm>(defaultForm);
  const [requests, setRequests] = useState<HiringRequestListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | HiringRequestStatus>("all");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const token = Cookies.get("token") || "";
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const loadRequests = async (status: "all" | HiringRequestStatus = statusFilter) => {
    if (!token) return;

    setLoading(true);
    try {
      const query = status !== "all" ? `?status=${status}` : "";
      const res = await fetch(`${API_URL}/hiring-requests/mine${query}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFeedback(err.message || "Unable to load requests");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  useEffect(() => {
    // Resume an in-progress draft (e.g. the user clicked "Edit Details"
    // from the review page) instead of always starting from scratch.
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        setForm(JSON.parse(raw));
      } catch {
        setForm((current) => ({ ...current, location: Cookies.get("location") || current.location }));
      }
    } else {
      setForm((current) => ({ ...current, location: Cookies.get("location") || current.location }));
    }

    void loadRequests("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (status: "all" | HiringRequestStatus) => {
    setStatusFilter(status);
    void loadRequests(status);
  };

  const updateForm = (field: keyof HiringForm, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleWizardComplete = () => {
    setFeedback("");

    if (!token) {
      setFeedback("Please login again before continuing.");
      return;
    }
    if (!form.roleRequired.trim() || !form.location.trim()) {
      setFeedback("Role and location are required.");
      return;
    }

    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    router.push("/home/HiringRequestSummary");
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
            Tell admin how many team members you need, the role, salary, and
            required details. Admin gets notified instantly, and you can raise
            a ticket anytime if you have a query about your request.
          </p>

          <div className={styles.teamPreview}>
            <div className={styles.avatarStack}>
              <img src="/doctor-landing-page-3.jpg" alt="Doctor" className={styles.avatarCircle} />
              <img src="/doctor-landing-page.jpg" alt="Nurse" className={styles.avatarCircle} />
              <img src="/doctor-landing-page-2.jpg" alt="Clinic staff" className={styles.avatarCircle} />
            </div>
            <span>Hiring doctors, nurses &amp; clinic staff</span>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div>
            <strong>{requests.length}</strong>
            <span>Total requests</span>
          </div>
          <div>
            <strong>
              {requests.filter((r) => r.status === "pending" || r.status === "in_review").length}
            </strong>
            <span>In progress</span>
          </div>
          <div>
            <strong>{requests.filter((r) => r.status === "fulfilled").length}</strong>
            <span>Fulfilled</span>
          </div>
        </div>
      </div>

      <div className={styles.portalGrid}>
        <div className={styles.formPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Send to admin</span>
              <h3>Hiring requirement</h3>
            </div>
            <Building2 size={24} />
          </div>

          <HiringWizard form={form} updateForm={updateForm} onComplete={handleWizardComplete} feedback={feedback} />
        </div>

        <aside className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Your requests</span>
              <h3>Hiring requests</h3>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => loadRequests()}
              disabled={loading}
            >
              <RefreshCcw size={18} />
            </button>
          </div>

          <select
            className={styles.statusSelect}
            style={{ width: "100%", marginBottom: 14, height: 42 }}
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value as "all" | HiringRequestStatus)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Request Sent</option>
            <option value="in_review">In Review</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className={styles.requestList}>
            {requests.length === 0 && (
              <div className={styles.emptyState}>No requests raised yet.</div>
            )}

            {requests.map((request) => (
              <button
                type="button"
                key={request._id}
                className={styles.requestItem}
                onClick={() => router.push(`/home/hiring-request/${request._id}`)}
              >
                <span>{request.hiringDetails.roleRequired}</span>
                <strong>{STATUS_LABEL[request.status]}</strong>
                <small>{request.requestNumber}</small>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

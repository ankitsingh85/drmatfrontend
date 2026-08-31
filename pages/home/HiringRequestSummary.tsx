"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import { API_URL } from "@/config/api";
import { HiringForm } from "@/components/hiring/HiringWizard";
import styles from "@/styles/hiringSummary.module.css";

const DRAFT_KEY = "hiringRequestDraft";

export default function HiringRequestSummary() {
  const router = useRouter();
  const [form, setForm] = useState<HiringForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) {
      router.replace("/home/ClinicHiringPortal");
      return;
    }
    try {
      setForm(JSON.parse(raw));
    } catch {
      router.replace("/home/ClinicHiringPortal");
    }
  }, [router, router.isReady]);

  const handleSendRequest = async () => {
    if (!form) return;

    const token = Cookies.get("token");
    if (!token) {
      setError("Please login again before sending your request.");
      return;
    }

    setSubmitting(true);
    setError("");

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
      if (!res.ok) throw new Error(data?.message || "Failed to send request");

      sessionStorage.removeItem(DRAFT_KEY);
      router.push(`/home/hiring-request/${data.request._id}`);
    } catch (err: any) {
      setError(err.message || "Unable to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) {
    return (
      <>
        <Topbar />
        <main className={styles.page}>
          <p className={styles.loadingText}>Loading your request...</p>
        </main>
        <Footer />
      </>
    );
  }

  const jobTypes = form.jobType
    ? form.jobType.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <>
      <Topbar />
      <main className={styles.page}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => router.push("/home/ClinicHiringPortal")}
        >
          <FiArrowLeft /> Edit details
        </button>

        <div className={styles.hero}>
          <span className={styles.heroEyebrow}>
            <FiCheckCircle /> Almost done
          </span>
          <h1>Review your hiring request</h1>
          <p>
            Double check everything below. Once you send the request, admin
            gets notified immediately. You'll be able to raise a ticket
            anytime from the request page if you have a query.
          </p>
        </div>

        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <FiBriefcase />
            </div>
            <div className={styles.cardBody}>
              <span>Job Title</span>
              <strong>{form.roleRequired}</strong>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <FiClock />
            </div>
            <div className={styles.cardBody}>
              <span>Job Type</span>
              <div className={styles.chipRow}>
                {jobTypes.length > 0 ? (
                  jobTypes.map((type) => (
                    <span key={type} className={styles.chip}>
                      {type}
                    </span>
                  ))
                ) : (
                  <strong>Not specified</strong>
                )}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <FiUsers />
            </div>
            <div className={styles.cardBody}>
              <span>Team &amp; Experience</span>
              <strong>
                {form.teamMembersRequired} member{form.teamMembersRequired > 1 ? "s" : ""}
                {form.experienceRequired ? ` · ${form.experienceRequired}` : ""}
              </strong>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <FiMapPin />
            </div>
            <div className={styles.cardBody}>
              <span>Location</span>
              <strong>{form.location || "Not specified"}</strong>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <FiDollarSign />
            </div>
            <div className={styles.cardBody}>
              <span>Compensation</span>
              <strong>{form.salaryRange || "Not specified"}</strong>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardFull}`}>
            <div className={styles.cardIcon}>
              <FiFileText />
            </div>
            <div className={styles.cardBody}>
              <span>Skills</span>
              <strong>{form.requiredSkills || "Not specified"}</strong>
            </div>
          </div>

          {form.additionalInfo && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <div className={styles.cardIcon}>
                <FiFileText />
              </div>
              <div className={styles.cardBody}>
                <span>Notes</span>
                <strong>{form.additionalInfo}</strong>
              </div>
            </div>
          )}
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => router.push("/home/ClinicHiringPortal")}
          >
            Edit Details
          </button>
          <button
            type="button"
            className={styles.raiseBtn}
            onClick={handleSendRequest}
            disabled={submitting}
          >
            {submitting ? "Sending Request..." : "Send Request"}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}

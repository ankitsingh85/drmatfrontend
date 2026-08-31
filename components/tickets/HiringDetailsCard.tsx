"use client";

import React from "react";
import { FiBriefcase, FiClock, FiDollarSign, FiFileText, FiMapPin, FiUsers } from "react-icons/fi";
import styles from "@/styles/supportTicket.module.css";
import { TicketHiringDetails } from "./TicketThread";

export default function HiringDetailsCard({ details }: { details: TicketHiringDetails }) {
  return (
    <div className={styles.hiringDetailsCard}>
      <h4>Hiring Request Details</h4>
      <div className={styles.hiringDetailsGrid}>
        <div className={styles.hiringDetailItem}>
          <span>
            <FiBriefcase /> Job Title
          </span>
          <strong>{details.roleRequired || "-"}</strong>
        </div>
        <div className={styles.hiringDetailItem}>
          <span>
            <FiClock /> Job Type
          </span>
          <strong>{details.jobType || "-"}</strong>
        </div>
        <div className={styles.hiringDetailItem}>
          <span>
            <FiUsers /> Team &amp; Experience
          </span>
          <strong>
            {details.teamMembersRequired ?? "-"} member{details.teamMembersRequired === 1 ? "" : "s"}
            {details.experienceRequired ? ` · ${details.experienceRequired}` : ""}
          </strong>
        </div>
        <div className={styles.hiringDetailItem}>
          <span>
            <FiMapPin /> Location
          </span>
          <strong>{details.location || "-"}</strong>
        </div>
        <div className={styles.hiringDetailItem}>
          <span>
            <FiDollarSign /> Compensation
          </span>
          <strong>{details.salaryRange || "Not specified"}</strong>
        </div>
        {details.requiredSkills && (
          <div className={`${styles.hiringDetailItem} ${styles.hiringDetailItemFull}`}>
            <span>
              <FiFileText /> Skills
            </span>
            <strong>{details.requiredSkills}</strong>
          </div>
        )}
        {details.additionalInfo && (
          <div className={`${styles.hiringDetailItem} ${styles.hiringDetailItemFull}`}>
            <span>
              <FiFileText /> Notes
            </span>
            <strong>{details.additionalInfo}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

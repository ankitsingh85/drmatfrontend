"use client";

import React, { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Calculator,
  CheckCircle2,
  IndianRupee,
  MapPin,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import styles from "@/styles/ClinicHiringPortal.module.css";

type JobDraft = {
  title: string;
  location: string;
  jobType: string;
  employees: number;
  salaryPerEmployee: number;
  commissionPerEmployee: number;
  description: string;
};

const featuredRoles = [
  {
    title: "Dermatology Assistant",
    location: "Clinic floor",
    pay: "Rs 18k - 28k / month",
    applicants: "24 active candidates",
  },
  {
    title: "Front Desk Executive",
    location: "Reception",
    pay: "Rs 15k - 22k / month",
    applicants: "31 active candidates",
  },
  {
    title: "Laser Technician",
    location: "Procedure room",
    pay: "Rs 25k - 40k / month",
    applicants: "12 active candidates",
  },
];

const formatCurrency = (value: number) =>
  `Rs ${Math.max(0, value).toLocaleString("en-IN")}`;

export default function ClinicHiringPortal() {
  const [jobDraft, setJobDraft] = useState<JobDraft>({
    title: "Skin Therapist",
    location: "Mumbai, Maharashtra",
    jobType: "Full time",
    employees: 5,
    salaryPerEmployee: 25000,
    commissionPerEmployee: 5000,
    description:
      "Looking for trained clinic staff with experience in dermatology support, patient counselling, and treatment coordination.",
  });

  const totals = useMemo(() => {
    const employees = Math.max(0, Number(jobDraft.employees) || 0);
    const salaryTotal = employees * (Number(jobDraft.salaryPerEmployee) || 0);
    const commissionTotal =
      employees * (Number(jobDraft.commissionPerEmployee) || 0);

    return {
      employees,
      salaryTotal,
      commissionTotal,
      monthlyBudget: salaryTotal + commissionTotal,
    };
  }, [jobDraft]);

  const updateDraft = (
    field: keyof JobDraft,
    value: string | number
  ) => {
    setJobDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <section className={styles.portalSection}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            <Sparkles size={16} />
            Clinic Hiring Portal
          </span>
          <h2>Hire verified clinic staff faster</h2>
          <p>
            Create a job post, define required employees, salary, and per
            employee commission in one clean workflow.
          </p>

          <div className={styles.searchStrip}>
            <label>
              <Search size={18} />
              <input placeholder="Search job title or skill" />
            </label>
            <label>
              <MapPin size={18} />
              <input placeholder="City or clinic area" />
            </label>
            <button type="button">Find Candidates</button>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div>
            <strong>850+</strong>
            <span>Clinic candidates</span>
          </div>
          <div>
            <strong>48 hrs</strong>
            <span>Average first response</span>
          </div>
          <div>
            <strong>4.8</strong>
            <span>Hiring satisfaction</span>
          </div>
        </div>
      </div>

      <div className={styles.portalGrid}>
        <form className={styles.formPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Post a job</span>
              <h3>Job requirement details</h3>
            </div>
            <button type="button" className={styles.iconButton}>
              <Plus size={19} />
            </button>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              Job title
              <input
                value={jobDraft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder="Eg. Clinic Manager"
              />
            </label>

            <label className={styles.field}>
              Location
              <input
                value={jobDraft.location}
                onChange={(event) =>
                  updateDraft("location", event.target.value)
                }
                placeholder="Clinic city"
              />
            </label>

            <label className={styles.field}>
              Job type
              <select
                value={jobDraft.jobType}
                onChange={(event) => updateDraft("jobType", event.target.value)}
              >
                <option>Full time</option>
                <option>Part time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </label>

            <label className={styles.field}>
              No. of employees
              <input
                type="number"
                min="1"
                value={jobDraft.employees}
                onChange={(event) =>
                  updateDraft("employees", Number(event.target.value))
                }
              />
            </label>

            <label className={styles.field}>
              Salary per employee
              <input
                type="number"
                min="0"
                value={jobDraft.salaryPerEmployee}
                onChange={(event) =>
                  updateDraft("salaryPerEmployee", Number(event.target.value))
                }
              />
            </label>

            <label className={styles.field}>
              Commission per employee
              <input
                type="number"
                min="0"
                value={jobDraft.commissionPerEmployee}
                onChange={(event) =>
                  updateDraft(
                    "commissionPerEmployee",
                    Number(event.target.value)
                  )
                }
              />
            </label>
          </div>

          <label className={styles.field}>
            Job description
            <textarea
              value={jobDraft.description}
              onChange={(event) =>
                updateDraft("description", event.target.value)
              }
              rows={5}
              placeholder="Add responsibilities, required experience, timings, and benefits."
            />
          </label>

          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton}>
              Save Draft
            </button>
            <button type="button" className={styles.primaryButton}>
              <Send size={17} />
              Publish Job
            </button>
          </div>
        </form>

        <aside className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Live preview</span>
              <h3>Hiring budget</h3>
            </div>
            <Calculator size={24} />
          </div>

          <article className={styles.jobPreview}>
            <div className={styles.companyMark}>
              <Building2 size={25} />
            </div>
            <div>
              <h4>{jobDraft.title || "Job title"}</h4>
              <p>{jobDraft.location || "Clinic location"}</p>
            </div>
            <span>{jobDraft.jobType}</span>
          </article>

          <div className={styles.budgetList}>
            <div>
              <span>
                <Users size={17} />
                Required employees
              </span>
              <strong>{totals.employees}</strong>
            </div>
            <div>
              <span>
                <IndianRupee size={17} />
                Salary total
              </span>
              <strong>{formatCurrency(totals.salaryTotal)}</strong>
            </div>
            <div>
              <span>
                <IndianRupee size={17} />
                Commission total
              </span>
              <strong>{formatCurrency(totals.commissionTotal)}</strong>
            </div>
          </div>

          <div className={styles.totalBox}>
            <span>Monthly hiring budget</span>
            <strong>{formatCurrency(totals.monthlyBudget)}</strong>
            <p>
              Example: {totals.employees} employees x{" "}
              {formatCurrency(jobDraft.commissionPerEmployee)} commission per
              employee.
            </p>
          </div>

          <div className={styles.checkList}>
            <span>
              <CheckCircle2 size={17} />
              Candidate shortlisting ready
            </span>
            <span>
              <CheckCircle2 size={17} />
              Salary and commission visible
            </span>
            <span>
              <CheckCircle2 size={17} />
              Frontend-only draft for now
            </span>
          </div>
        </aside>
      </div>

      <div className={styles.roleRail}>
        <div className={styles.railHeader}>
          <Briefcase size={20} />
          <h3>Popular clinic hiring needs</h3>
        </div>
        <div className={styles.roleGrid}>
          {featuredRoles.map((role) => (
            <article key={role.title} className={styles.roleCard}>
              <span>{role.title}</span>
              <strong>{role.pay}</strong>
              <p>{role.location}</p>
              <small>{role.applicants}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

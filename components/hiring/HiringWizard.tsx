"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import styles from "@/styles/hiringWizard.module.css";

export type HiringForm = {
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

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Permanent",
  "Contractual / Temporary",
  "Freelance",
  "Fresher",
  "Internship",
  "Student job",
  "Volunteer",
];

const PAY_BY_OPTIONS = ["Range", "Exact amount", "Starting amount", "Maximum amount"] as const;
type PayBy = (typeof PAY_BY_OPTIONS)[number];

const PAY_RATE_OPTIONS = ["per hour", "per day", "per week", "per month", "per year"];

const formatRupee = (value: string) => {
  const numeric = value.replace(/[^0-9.]/g, "");
  if (!numeric) return "";
  const num = Number(numeric);
  return Number.isNaN(num) ? numeric : num.toLocaleString("en-IN");
};

const buildSalaryRange = (payBy: PayBy, payMin: string, payMax: string, payRate: string) => {
  const min = payMin.trim();
  const max = payMax.trim();

  if (payBy === "Range") {
    if (!min && !max) return "";
    if (min && max) return `₹${formatRupee(min)} - ₹${formatRupee(max)} ${payRate}`;
    return `₹${formatRupee(min || max)} ${payRate}`;
  }
  if (payBy === "Exact amount") {
    return min ? `₹${formatRupee(min)} ${payRate}` : "";
  }
  if (payBy === "Starting amount") {
    return min ? `From ₹${formatRupee(min)} ${payRate}` : "";
  }
  // Maximum amount
  return max ? `Up to ₹${formatRupee(max)} ${payRate}` : "";
};

interface HiringWizardProps {
  form: HiringForm;
  updateForm: (field: keyof HiringForm, value: string | number | boolean) => void;
  // Called once the last step's data is valid — the wizard itself no
  // longer creates anything; the caller takes the completed form to a
  // dedicated review page where the actual "Raise a Ticket" action lives.
  onComplete: () => void;
  feedback?: string;
}

type StepId = "title" | "type" | "team" | "location" | "pay" | "skills" | "notes";

const STEPS: { id: StepId; label: string }[] = [
  { id: "title", label: "Job title" },
  { id: "type", label: "Job type" },
  { id: "team", label: "Team & experience" },
  { id: "location", label: "Location" },
  { id: "pay", label: "Compensation" },
  { id: "skills", label: "Skills" },
  { id: "notes", label: "Notes" },
];

export default function HiringWizard({
  form,
  updateForm,
  onComplete,
  feedback,
}: HiringWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const selectedJobTypes = useMemo(
    () => (form.jobType ? form.jobType.split(",").map((t) => t.trim()).filter(Boolean) : []),
    [form.jobType]
  );

  const toggleJobType = (type: string) => {
    const next = selectedJobTypes.includes(type)
      ? selectedJobTypes.filter((t) => t !== type)
      : [...selectedJobTypes, type];
    updateForm("jobType", next.join(", "));
  };

  const [payBy, setPayBy] = useState<PayBy>("Range");
  const [payMin, setPayMin] = useState("18,000");
  const [payMax, setPayMax] = useState("28,000");
  const [payRate, setPayRate] = useState("per month");

  useEffect(() => {
    updateForm("salaryRange", buildSalaryRange(payBy, payMin, payMax, payRate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payBy, payMin, payMax, payRate]);

  const isStepValid = useMemo(() => {
    switch (step.id) {
      case "title":
        return form.roleRequired.trim().length > 0;
      case "type":
        return form.jobType.trim().length > 0;
      case "team":
        return form.teamMembersRequired >= 1;
      case "location":
        return form.location.trim().length > 0;
      default:
        return true;
    }
  }, [step.id, form]);

  const goTo = (index: number) => {
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
  };

  const isLastStep = stepIndex === STEPS.length - 1;

  const handleContinue = () => {
    if (!isStepValid) return;
    if (isLastStep) {
      onComplete();
      return;
    }
    goTo(stepIndex + 1);
  };

  const handleBack = () => goTo(stepIndex - 1);

  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className={styles.wizard}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
      </div>
      <div className={styles.stepMeta}>
        <span>
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        <span className={styles.stepMetaLabel}>{step.label}</span>
      </div>

      <div className={styles.stepBody}>
        {step.id === "title" && (
          <StepShell
            eyebrow="Let's start with the basics"
            heading="What's the job title?"
            subtext="Use the title candidates would search for — e.g. Dermatologist, Skin Therapist, Front Desk Executive."
          >
            <input
              autoFocus
              className={styles.bigInput}
              value={form.roleRequired}
              onChange={(e) => updateForm("roleRequired", e.target.value)}
              placeholder="Eg. Skin Therapist"
              onKeyDown={(e) => e.key === "Enter" && isStepValid && handleContinue()}
            />
          </StepShell>
        )}

        {step.id === "type" && (
          <StepShell
            heading="What type of job is this?"
            subtext="Select all that apply — candidates can filter by these when they search."
          >
            <div className={styles.chipGrid}>
              {JOB_TYPES.map((type) => {
                const active = selectedJobTypes.includes(type);
                return (
                  <button
                    type="button"
                    key={type}
                    className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                    onClick={() => toggleJobType(type)}
                  >
                    {active ? <Check size={16} /> : <Plus size={16} />}
                    {type}
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {step.id === "team" && (
          <StepShell
            heading="How many people and how much experience?"
            subtext="A rough number is fine — you can adjust this later with admin."
          >
            <div className={styles.stackedFields}>
              <div className={styles.subField}>
                <label className={styles.subLabel}>
                  <Users size={15} /> Team members required
                </label>
                <div className={styles.stepperRow}>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() =>
                      updateForm("teamMembersRequired", Math.max(1, form.teamMembersRequired - 1))
                    }
                    aria-label="Decrease"
                  >
                    <Minus size={16} />
                  </button>
                  <span className={styles.stepperValue}>{form.teamMembersRequired}</span>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => updateForm("teamMembersRequired", form.teamMembersRequired + 1)}
                    aria-label="Increase"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.subField}>
                <label className={styles.subLabel}>Experience required</label>
                <input
                  className={styles.mediumInput}
                  value={form.experienceRequired}
                  onChange={(e) => updateForm("experienceRequired", e.target.value)}
                  placeholder="Eg. 1-3 years"
                />
              </div>
            </div>
          </StepShell>
        )}

        {step.id === "location" && (
          <StepShell
            heading="Where is this role based?"
            subtext="Add the clinic city or branch so admin can match candidates nearby."
          >
            <div className={styles.inputWithIcon}>
              <MapPin size={18} />
              <input
                autoFocus
                className={styles.bigInputWithIcon}
                value={form.location}
                onChange={(e) => updateForm("location", e.target.value)}
                placeholder="Clinic city or branch"
                onKeyDown={(e) => e.key === "Enter" && isStepValid && handleContinue()}
              />
            </div>
          </StepShell>
        )}

        {step.id === "pay" && (
          <StepShell
            heading="Pay"
            subtext="Review the pay for this role and adjust as needed."
          >
            <div className={styles.payPanel}>
              <div className={styles.payField}>
                <label className={styles.payLabel}>Show pay by</label>
                <select
                  className={styles.paySelect}
                  value={payBy}
                  onChange={(e) => setPayBy(e.target.value as PayBy)}
                >
                  {PAY_BY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {(payBy === "Range" || payBy === "Exact amount" || payBy === "Starting amount") && (
                <div className={styles.payField}>
                  <label className={styles.payLabel}>
                    {payBy === "Exact amount" ? "Amount" : "Minimum"}
                  </label>
                  <div className={styles.payInputBox}>
                    <span>₹</span>
                    <input
                      className={styles.payInput}
                      inputMode="numeric"
                      value={payMin}
                      onChange={(e) => setPayMin(e.target.value.replace(/[^0-9.,]/g, ""))}
                    />
                  </div>
                </div>
              )}

              {payBy === "Range" && <span className={styles.payTo}>to</span>}

              {(payBy === "Range" || payBy === "Maximum amount") && (
                <div className={styles.payField}>
                  <label className={styles.payLabel}>Maximum</label>
                  <div className={styles.payInputBox}>
                    <span>₹</span>
                    <input
                      className={styles.payInput}
                      inputMode="numeric"
                      value={payMax}
                      onChange={(e) => setPayMax(e.target.value.replace(/[^0-9.,]/g, ""))}
                    />
                  </div>
                </div>
              )}

              <div className={styles.payField}>
                <label className={styles.payLabel}>Rate</label>
                <select
                  className={styles.paySelect}
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                >
                  {PAY_RATE_OPTIONS.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </StepShell>
        )}

        {step.id === "skills" && (
          <StepShell
            heading="What skills should candidates have?"
            subtext="List the must-have skills and day-to-day responsibilities."
          >
            <textarea
              className={styles.bigTextarea}
              rows={5}
              value={form.requiredSkills}
              onChange={(e) => updateForm("requiredSkills", e.target.value)}
              placeholder="Patient counselling, laser support, treatment coordination..."
            />
          </StepShell>
        )}

        {step.id === "notes" && (
          <StepShell
            heading="Anything else to add?"
            subtext="Timings, interview preference, benefits, or notes for admin. Optional."
          >
            <textarea
              className={styles.bigTextarea}
              rows={5}
              value={form.additionalInfo}
              onChange={(e) => updateForm("additionalInfo", e.target.value)}
              placeholder="Optional notes for admin"
            />
          </StepShell>
        )}

        {feedback && <p className={styles.feedbackText}>{feedback}</p>}
      </div>

      <div className={styles.navRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBack}
          disabled={stepIndex === 0}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          type="button"
          className={styles.continueBtn}
          onClick={handleContinue}
          disabled={!isStepValid}
        >
          {isLastStep ? (
            <>Review Request</>
          ) : (
            <>
              Continue <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const StepShell = ({
  eyebrow,
  heading,
  subtext,
  children,
}: {
  eyebrow?: React.ReactNode;
  heading: string;
  subtext?: string;
  children: React.ReactNode;
}) => (
  <div className={styles.stepShell}>
    {eyebrow && <div className={styles.stepEyebrow}>{eyebrow}</div>}
    <h2 className={styles.stepHeading}>{heading}</h2>
    {subtext && <p className={styles.stepSubtext}>{subtext}</p>}
    <div className={styles.stepContent}>{children}</div>
  </div>
);

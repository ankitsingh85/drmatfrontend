"use client";

import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";

type TrainingTypeOption = {
  _id: string;
  id: string;
  name: string;
};

type FormState = {
  trainingName: string;
  trainingUniqueCode: string;
  trainingType: string[];
  hsnCode: string;
  discountPercent: string;
  instituteName: string;
  trainingDuration: string;
  modeOfTraining: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  curriculumTopicsCovered: string;
  targetAudienceText: string;
  certificationProvided: string;
  affiliationAccreditation: string;
  feesInr: string;
  applyDiscountVoucher: boolean;
  netFeesInr: string;
  installmentEmiOption: boolean;
  location: string;
  maximumSeatsBatchSize: string;
  currentAvailability: string;
  trainerInstructorName: string;
  trainerExperience: string;
  languageOfDelivery: string;
  whatsIncluded: string;
  whatsNotIncluded: string;
  learningOutcomes: string;
  courseDemoVideo: string;
  refundCancellationPolicy: string;
  postTrainingSupport: string;
  contactForQueries: string;
  trainingImage: File | null;
  brochurePdfDownload: File[];
};

type Errors = Partial<Record<keyof FormState, string>>;

const init = (code = ""): FormState => ({
  trainingName: "",
  trainingUniqueCode: code,
  trainingType: [],
  hsnCode: "",
  discountPercent: "",
  instituteName: "",
  trainingDuration: "",
  modeOfTraining: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  curriculumTopicsCovered: "",
  targetAudienceText: "",
  certificationProvided: "",
  affiliationAccreditation: "",
  feesInr: "",
  applyDiscountVoucher: false,
  netFeesInr: "",
  installmentEmiOption: false,
  location: "",
  maximumSeatsBatchSize: "",
  currentAvailability: "",
  trainerInstructorName: "",
  trainerExperience: "",
  languageOfDelivery: "",
  whatsIncluded: "",
  whatsNotIncluded: "",
  learningOutcomes: "",
  courseDemoVideo: "",
  refundCancellationPolicy: "",
  postTrainingSupport: "",
  contactForQueries: "",
  trainingImage: null,
  brochurePdfDownload: [],
});

const yesNo = ["Yes", "No"];
const languages = ["English", "Hindi", "Bilingual"];
const textOnly = /^[A-Za-z ]+$/;
const digitsOnly = /^\d+$/;

const labelMap: Record<string, string> = {
  trainingName: "Training Name",
  trainingUniqueCode: "Training Unique Code",
  trainingType: "Training Type",
  hsnCode: "HSN Code",
  discountPercent: "Discount %",
  instituteName: "Institute Name",
  trainingDuration: "Training Duration",
  modeOfTraining: "Mode of Training",
  startDate: "Start Date",
  endDate: "End Date",
  registrationDeadline: "Registration Deadline",
  curriculumTopicsCovered: "Curriculum / Topics Covered",
  targetAudienceText: "Target Audience",
  certificationProvided: "Certification Provided",
  affiliationAccreditation: "Affiliation / Accreditation",
  feesInr: "Fees (INR)",
  netFeesInr: "Net Fees (INR)",
  location: "Location (for offline)",
  maximumSeatsBatchSize: "Maximum Seats / Batch Size",
  currentAvailability: "Current Availability",
  trainerInstructorName: "Trainer/Instructor Name",
  trainerExperience: "Trainer Experience",
  languageOfDelivery: "Language of Delivery",
  whatsIncluded: "What's Included",
  whatsNotIncluded: "What's Not Included",
  learningOutcomes: "Learning Outcomes",
  courseDemoVideo: "Course Demo Video (Optional)",
  refundCancellationPolicy: "Refund/Cancellation Policy",
  postTrainingSupport: "Post-Training Support",
  contactForQueries: "Contact for Queries",
  trainingImage: "Training Image",
  brochurePdfDownload: "Brochure / PDF Download",
  applyDiscountVoucher: "Apply Discount Voucher",
  installmentEmiOption: "Installment/EMI Option",
};

const Field = ({
  label,
  error,
  full = false,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) => (
  <div className={full ? styles.fullField : styles.field}>
    <label className={styles.label}>{label}</label>
    {children}
    {error ? <p className={styles.fieldError}>{error}</p> : null}
  </div>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className={styles.checkboxRow}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
);

export default function CreateWorkshopTraning() {
  const [form, setForm] = useState<FormState>(init());
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeOption[]>([]);
  const [loadingTrainingTypes, setLoadingTrainingTypes] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");

  const setValue = (key: keyof FormState, value: any) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) validate(next);
    setMessage("");
  };

  const validate = (data: FormState) => {
    const next: Errors = {};
    const required: (keyof FormState)[] = [
      "trainingName",
      "trainingUniqueCode",
      "hsnCode",
      "instituteName",
      "trainingDuration",
      "modeOfTraining",
      "startDate",
      "endDate",
      "registrationDeadline",
      "curriculumTopicsCovered",
      "certificationProvided",
      "affiliationAccreditation",
      "feesInr",
      "netFeesInr",
      "location",
      "maximumSeatsBatchSize",
      "currentAvailability",
      "trainerInstructorName",
      "trainerExperience",
      "languageOfDelivery",
      "whatsIncluded",
      "whatsNotIncluded",
      "learningOutcomes",
      "refundCancellationPolicy",
      "postTrainingSupport",
      "contactForQueries",
    ];

    for (const key of required) {
      if (!String(data[key] ?? "").trim()) next[key] = `${labelMap[key]} is required`;
    }

    if (!data.trainingType.length) next.trainingType = "Please select at least one training type";
    if (!data.trainingImage) next.trainingImage = "Training image is required";
    if (!data.brochurePdfDownload.length) next.brochurePdfDownload = "At least one brochure PDF is required";
    if (!data.targetAudienceText.trim()) next.targetAudienceText = "At least one target audience item is required";
    if (data.instituteName && !textOnly.test(data.instituteName.trim())) next.instituteName = "Institute name should contain only letters and spaces";
    if (data.trainerInstructorName && !textOnly.test(data.trainerInstructorName.trim())) next.trainerInstructorName = "Trainer / instructor name should contain only letters and spaces";
    for (const key of ["feesInr", "netFeesInr", "maximumSeatsBatchSize", "discountPercent"] as const) {
      if (data[key] && !digitsOnly.test(data[key].trim())) next[key] = `${labelMap[key]} must contain digits only`;
    }
    if (data.discountPercent && (Number(data.discountPercent) < 0 || Number(data.discountPercent) > 100)) {
      next.discountPercent = "Discount % must be between 0 and 100";
    }
    if (data.certificationProvided && !yesNo.includes(data.certificationProvided)) next.certificationProvided = "Select Yes or No";
    if (data.languageOfDelivery && !languages.includes(data.languageOfDelivery)) next.languageOfDelivery = "Select a valid language";
    if (!loadingTrainingTypes && trainingTypes.length === 0) {
      next.trainingType = "No training types available. Please create one first.";
    }
    if (data.endDate && data.startDate && new Date(data.endDate) < new Date(data.startDate)) next.endDate = "End date must be on or after start date";
    if (data.registrationDeadline && data.startDate && new Date(data.registrationDeadline) > new Date(data.startDate)) next.registrationDeadline = "Registration deadline should be on or before start date";

    setErrors(next);
    return next;
  };

  const loadCode = useCallback(async () => {
    try {
      setLoadingCode(true);
      const res = await fetch(`${API_URL}/workshop-trainings/next-code`);
      const data = await res.json().catch(() => ({}));
      setForm((prev) => ({
        ...prev,
        trainingUniqueCode: res.ok ? data.trainingUniqueCode || "" : prev.trainingUniqueCode || "",
      }));
    } catch {
      setForm((prev) => ({ ...prev, trainingUniqueCode: prev.trainingUniqueCode || "" }));
    } finally {
      setLoadingCode(false);
    }
  }, []);

  const fetchTrainingTypes = useCallback(async () => {
    try {
      setLoadingTrainingTypes(true);
      const res = await fetch(`${API_URL}/training-types`);
      const data = await res.json().catch(() => []);

      const validTrainingTypes = (Array.isArray(data) ? data : [])
        .map((item: any) => ({
          _id: String(item._id || ""),
          id: String(item.id || item._id || ""),
          name: String(item.name || ""),
        }))
        .filter((item: TrainingTypeOption) => item._id && item.name);

      setTrainingTypes(validTrainingTypes);
    } catch {
      setTrainingTypes([]);
    } finally {
      setLoadingTrainingTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingTypes();
    loadCode();
    const refreshTrainingTypes = () => {
      fetchTrainingTypes();
    };

    window.addEventListener("admin-dashboard:create-success", refreshTrainingTypes);
    return () => {
      window.removeEventListener("admin-dashboard:create-success", refreshTrainingTypes);
    };
  }, [fetchTrainingTypes, loadCode]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const errorFor = (key: keyof FormState) => (submitted ? errors[key] : "");

  const toggleTrainingType = (name: string) => {
    const next = form.trainingType.includes(name)
      ? form.trainingType.filter((item) => item !== name)
      : [...form.trainingType, name];
    setValue("trainingType", next);
  };

  const onImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || file.size > 1 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        trainingImage: "Training image must be JPG, JPEG, PNG, or WEBP and <= 1MB",
      }));
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setValue("trainingImage", file);
  };

  const onBrochures = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (files.some((file) => file.type !== "application/pdf")) {
      setErrors((prev) => ({ ...prev, brochurePdfDownload: "Only PDF files are allowed" }));
      return;
    }

    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setErrors((prev) => ({
        ...prev,
        brochurePdfDownload: "Each brochure PDF must be <= 10MB",
      }));
      return;
    }

    setValue("brochurePdfDownload", [...form.brochurePdfDownload, ...files]);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors = validate(form);
    if (Object.values(nextErrors).some(Boolean)) {
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = new FormData();

      payload.append("trainingName", form.trainingName.trim());
      payload.append("trainingUniqueCode", form.trainingUniqueCode.trim());

      form.trainingType.forEach((type) => {
        payload.append("trainingType", type);
      });

      payload.append("hsnCode", form.hsnCode.trim());
      payload.append("discountPercent", form.discountPercent);
      payload.append("instituteName", form.instituteName.trim());
      payload.append("trainingDuration", form.trainingDuration.trim());
      payload.append("modeOfTraining", form.modeOfTraining.trim());
      payload.append("startDate", form.startDate);
      payload.append("endDate", form.endDate);
      payload.append("registrationDeadline", form.registrationDeadline);
      payload.append("curriculumTopicsCovered", form.curriculumTopicsCovered.trim());
      payload.append(
        "targetAudience",
        JSON.stringify(
          form.targetAudienceText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );
      payload.append("certificationProvided", form.certificationProvided);
      payload.append("affiliationAccreditation", form.affiliationAccreditation.trim());
      payload.append("feesInr", form.feesInr);
      payload.append("applyDiscountVoucher", String(form.applyDiscountVoucher));
      payload.append("netFeesInr", form.netFeesInr);
      payload.append("installmentEmiOption", String(form.installmentEmiOption));
      payload.append("location", form.location.trim());
      payload.append("maximumSeatsBatchSize", form.maximumSeatsBatchSize);
      payload.append("currentAvailability", form.currentAvailability);
      payload.append("trainerInstructorName", form.trainerInstructorName.trim());
      payload.append("trainerExperience", form.trainerExperience.trim());
      payload.append("languageOfDelivery", form.languageOfDelivery);
      payload.append("whatsIncluded", form.whatsIncluded.trim());
      payload.append("whatsNotIncluded", form.whatsNotIncluded.trim());
      payload.append("learningOutcomes", form.learningOutcomes.trim());
      payload.append("courseDemoVideo", form.courseDemoVideo.trim());
      payload.append("refundCancellationPolicy", form.refundCancellationPolicy.trim());
      payload.append("postTrainingSupport", form.postTrainingSupport.trim());
      payload.append("contactForQueries", form.contactForQueries.trim());
      if (form.trainingImage) payload.append("trainingImage", form.trainingImage);
      form.brochurePdfDownload.forEach((file) => payload.append("brochurePdfDownload", file));

      const res = await fetch(`${API_URL}/workshop-trainings`, {
        method: "POST",
        body: payload,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create workshop training");
      }

      setMessage("Workshop training created successfully.");
      setForm(init());
      setErrors({});
      setSubmitted(false);
      setPreview("");
      loadCode();
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
    } catch (err: any) {
      setMessage(err?.message || "Unable to create workshop training.");
    } finally {
      setLoading(false);
    }
  };

  const trainingTypeError =
    submitted && !loadingTrainingTypes && trainingTypes.length === 0
      ? "No training types available. Please create one first."
      : errorFor("trainingType");

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Create Workshop Training</h2>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Workshop Basics</h3>
          <div className={styles.fieldGrid}>
            <Field label={labelMap.trainingName} error={errorFor("trainingName")}>
              <input
                className={styles.input}
                value={form.trainingName}
                onChange={(e) => setValue("trainingName", e.target.value)}
              />
            </Field>

            <Field label={labelMap.trainingUniqueCode} error={errorFor("trainingUniqueCode")}>
              <input
                className={`${styles.input} ${styles.readOnlyInput}`}
                value={form.trainingUniqueCode}
                readOnly
                placeholder={loadingCode ? "Generating..." : ""}
              />
            </Field>

            <div className={styles.field}>
              <label className={styles.label}>{labelMap.trainingType}</label>
              <div className={styles.checkboxScrollBox}>
                {loadingTrainingTypes ? (
                  <span>Loading training types...</span>
                ) : (
                  trainingTypes.map((option) => (
                    <label
                      key={option._id}
                      style={{ display: "block", marginBottom: "8px", cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={form.trainingType.includes(option.name)}
                        onChange={() => toggleTrainingType(option.name)}
                      />
                      {" "}
                      {option.name}
                    </label>
                  ))
                )}
              </div>
              {!loadingTrainingTypes && trainingTypes.length === 0 && (
                <span className={styles.helperText}>
                  No training types found. Create one from the dashboard first.
                </span>
              )}
              {trainingTypeError && (
                <p className={styles.fieldError}>{trainingTypeError}</p>
              )}
            </div>

            <Field label={labelMap.hsnCode} error={errorFor("hsnCode")}>
              <input
                className={styles.input}
                value={form.hsnCode}
                onChange={(e) => setValue("hsnCode", e.target.value)}
              />
            </Field>

            <Field label={labelMap.instituteName} error={errorFor("instituteName")}>
              <input className={styles.input} value={form.instituteName} onChange={(e) => setValue("instituteName", e.target.value.replace(/[^A-Za-z ]/g, ""))} />
            </Field>
            <Field label={labelMap.trainingDuration} error={errorFor("trainingDuration")}>
              <input className={styles.input} value={form.trainingDuration} onChange={(e) => setValue("trainingDuration", e.target.value)} />
            </Field>
            <Field label={labelMap.modeOfTraining} error={errorFor("modeOfTraining")}>
              <input className={styles.input} value={form.modeOfTraining} onChange={(e) => setValue("modeOfTraining", e.target.value)} />
            </Field>
            <Field label={labelMap.startDate} error={errorFor("startDate")}>
              <input className={styles.input} type="date" value={form.startDate} onChange={(e) => setValue("startDate", e.target.value)} />
            </Field>
            <Field label={labelMap.endDate} error={errorFor("endDate")}>
              <input className={styles.input} type="date" value={form.endDate} onChange={(e) => setValue("endDate", e.target.value)} />
            </Field>
            <Field label={labelMap.registrationDeadline} error={errorFor("registrationDeadline")}>
              <input className={styles.input} type="date" value={form.registrationDeadline} onChange={(e) => setValue("registrationDeadline", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Training Content</h3>
          <Field label={labelMap.curriculumTopicsCovered} error={errorFor("curriculumTopicsCovered")} full>
            <textarea className={styles.textarea} value={form.curriculumTopicsCovered} onChange={(e) => setValue("curriculumTopicsCovered", e.target.value)} />
          </Field>
          <div className={styles.fieldGrid}>
            <Field label={labelMap.targetAudienceText} error={errorFor("targetAudienceText")}>
              <input className={styles.input} value={form.targetAudienceText} onChange={(e) => setValue("targetAudienceText", e.target.value)} placeholder="Comma separated audiences" />
            </Field>
            <Field label={labelMap.certificationProvided} error={errorFor("certificationProvided")}>
              <select className={styles.select} value={form.certificationProvided} onChange={(e) => setValue("certificationProvided", e.target.value)}>
                <option value="">Select</option>
                {yesNo.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label={labelMap.affiliationAccreditation} error={errorFor("affiliationAccreditation")} full>
              <textarea className={styles.textarea} value={form.affiliationAccreditation} onChange={(e) => setValue("affiliationAccreditation", e.target.value)} />
            </Field>
            <Field label={labelMap.feesInr} error={errorFor("feesInr")}>
              <input className={styles.input} value={form.feesInr} onChange={(e) => setValue("feesInr", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label={labelMap.netFeesInr} error={errorFor("netFeesInr")}>
              <input className={styles.input} value={form.netFeesInr} onChange={(e) => setValue("netFeesInr", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label={labelMap.discountPercent} error={errorFor("discountPercent")}>
              <input
                className={styles.input}
                type="number"
                min="0"
                max="100"
                value={form.discountPercent}
                onChange={(e) => setValue("discountPercent", e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label={labelMap.maximumSeatsBatchSize} error={errorFor("maximumSeatsBatchSize")}>
              <input className={styles.input} value={form.maximumSeatsBatchSize} onChange={(e) => setValue("maximumSeatsBatchSize", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label={labelMap.location} error={errorFor("location")}>
              <input className={styles.input} value={form.location} onChange={(e) => setValue("location", e.target.value)} />
            </Field>
            <Field label={labelMap.currentAvailability} error={errorFor("currentAvailability")}>
              <input className={styles.input} value={form.currentAvailability} onChange={(e) => setValue("currentAvailability", e.target.value)} placeholder="e.g. 5 seats left" />
            </Field>
          </div>

          <div className={styles.switchRow}>
            <Toggle label={labelMap.applyDiscountVoucher} checked={form.applyDiscountVoucher} onChange={(value) => setValue("applyDiscountVoucher", value)} />
            <Toggle label={labelMap.installmentEmiOption} checked={form.installmentEmiOption} onChange={(value) => setValue("installmentEmiOption", value)} />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Instructor & Media</h3>
          <div className={styles.fieldGrid}>
            <Field label={labelMap.trainerInstructorName} error={errorFor("trainerInstructorName")}>
              <input className={styles.input} value={form.trainerInstructorName} onChange={(e) => setValue("trainerInstructorName", e.target.value.replace(/[^A-Za-z ]/g, ""))} />
            </Field>
            <Field label={labelMap.trainerExperience} error={errorFor("trainerExperience")} full>
              <textarea className={styles.textarea} value={form.trainerExperience} onChange={(e) => setValue("trainerExperience", e.target.value)} />
            </Field>
            <Field label={labelMap.languageOfDelivery} error={errorFor("languageOfDelivery")}>
              <select className={styles.select} value={form.languageOfDelivery} onChange={(e) => setValue("languageOfDelivery", e.target.value)}>
                <option value="">Select</option>
                {languages.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label={labelMap.trainingImage} error={errorFor("trainingImage")}>
              <div className={styles.uploadBox}>
                <input className={styles.input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} />
              </div>
              {preview ? <img className={styles.preview} src={preview} alt="Training preview" /> : <p className={styles.noImage}>No training image selected</p>}
            </Field>
            <Field label={labelMap.courseDemoVideo} error={errorFor("courseDemoVideo")} full>
              <input className={styles.input} value={form.courseDemoVideo} onChange={(e) => setValue("courseDemoVideo", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Training Details</h3>
          <div className={styles.fieldGrid}>
            <Field label={labelMap.whatsIncluded} error={errorFor("whatsIncluded")}>
              <textarea className={styles.textarea} value={form.whatsIncluded} onChange={(e) => setValue("whatsIncluded", e.target.value)} />
            </Field>
            <Field label={labelMap.whatsNotIncluded} error={errorFor("whatsNotIncluded")}>
              <textarea className={styles.textarea} value={form.whatsNotIncluded} onChange={(e) => setValue("whatsNotIncluded", e.target.value)} />
            </Field>
            <Field label={labelMap.learningOutcomes} error={errorFor("learningOutcomes")} full>
              <textarea className={styles.textarea} value={form.learningOutcomes} onChange={(e) => setValue("learningOutcomes", e.target.value)} />
            </Field>
            <Field label={labelMap.refundCancellationPolicy} error={errorFor("refundCancellationPolicy")} full>
              <textarea className={styles.textarea} value={form.refundCancellationPolicy} onChange={(e) => setValue("refundCancellationPolicy", e.target.value)} />
            </Field>
            <Field label={labelMap.postTrainingSupport} error={errorFor("postTrainingSupport")} full>
              <textarea className={styles.textarea} value={form.postTrainingSupport} onChange={(e) => setValue("postTrainingSupport", e.target.value)} />
            </Field>
            <Field label={labelMap.contactForQueries} error={errorFor("contactForQueries")} full>
              <textarea className={styles.textarea} value={form.contactForQueries} onChange={(e) => setValue("contactForQueries", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Brochure Upload</h3>
          <Field label={labelMap.brochurePdfDownload} error={errorFor("brochurePdfDownload")} full>
            <div className={styles.uploadBox}>
              <input className={styles.input} type="file" accept="application/pdf" multiple onChange={onBrochures} />
            </div>
            <p className={styles.uploadHint}>Upload one or more brochure PDFs</p>
            <div className={styles.fileList}>
              {form.brochurePdfDownload.length > 0 ? form.brochurePdfDownload.map((file) => (
                <div className={styles.fileItem} key={file.name}>
                  <span className={styles.fileName}>{file.name}</span>
                </div>
              )) : <p className={styles.noImage}>No brochure PDFs selected</p>}
            </div>
          </Field>
        </div>

        {message ? (
          <p className={message.toLowerCase().includes("success") ? styles.success : styles.submitError}>
            {message}
          </p>
        ) : null}

        <button type="submit" className={styles.submitBtn} disabled={loading || loadingCode}>
          {loading ? "Creating..." : "Create Workshop Training"}
        </button>
      </form>
    </div>
  );
}
"use client";

import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";
import MobileNavbar from "../Layout/MobileNavbar";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type CourseFormData = {
  courseName: string;
  courseUniqueCode: string;
  courseType: string;
  instituteName: string;
  courseDuration: string;
  modeOfTraining: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  curriculumTopicsCovered: string;
  targetAudience: string[];
  certificationProvided: string;
  affiliationAccreditation: string;
  feesInr: string;
  applyDiscountVoucher: boolean;
  netFeesInr: string;
  discountsOffers: string;
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
  brochurePdfDownload: File[];
  refundCancellationPolicy: string;
  postCourseSupport: string;
  contactForQueries: string;
};

const createInitialFormData = (courseUniqueCode = ""): CourseFormData => ({
  courseName: "",
  courseUniqueCode,
  courseType: "",
  instituteName: "",
  courseDuration: "",
  modeOfTraining: "",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  curriculumTopicsCovered: "",
  targetAudience: [],
  certificationProvided: "",
  affiliationAccreditation: "",
  feesInr: "",
  applyDiscountVoucher: false,
  netFeesInr: "",
  discountsOffers: "",
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
  brochurePdfDownload: [],
  refundCancellationPolicy: "",
  postCourseSupport: "",
  contactForQueries: "",
});

const courseTypeOptions = [
  "Certificate Course",
  "Diploma Course",
  "Fellowship Program",
  "Masterclass",
];

const certificationOptions = ["Yes", "No"];
const languageOptions = ["English", "Hindi", "Bilingual"];
const dateFields = ["startDate", "endDate", "registrationDeadline"] as const;

const textAreaFields: Array<
  | "curriculumTopicsCovered"
  | "affiliationAccreditation"
  | "discountsOffers"
  | "refundCancellationPolicy"
  | "postCourseSupport"
  | "contactForQueries"
> = [
  "curriculumTopicsCovered",
  "affiliationAccreditation",
  "discountsOffers",
  "refundCancellationPolicy",
  "postCourseSupport",
  "contactForQueries",
];

const richTextFields: Array<
  "whatsIncluded" | "whatsNotIncluded" | "learningOutcomes"
> = ["whatsIncluded", "whatsNotIncluded", "learningOutcomes"];

const fieldLabels: Record<keyof CourseFormData, string> = {
  courseName: "Course Name",
  courseUniqueCode: "Course Unique Code",
  courseType: "Course Type",
  instituteName: "Institute Name",
  courseDuration: "Course Duration",
  modeOfTraining: "Mode of Training",
  startDate: "Start Date",
  endDate: "End Date",
  registrationDeadline: "Registration Deadline",
  curriculumTopicsCovered: "Curriculum / Topics Covered",
  targetAudience: "Target Audience",
  certificationProvided: "Certification Provided",
  affiliationAccreditation: "Affiliation / Accreditation",
  feesInr: "Fees (INR)",
  applyDiscountVoucher: "Apply Discount Voucher",
  netFeesInr: "Net Fees (INR)",
  discountsOffers: "Discounts / Offers",
  location: "Location",
  maximumSeatsBatchSize: "Maximum Seats / Batch Size",
  currentAvailability: "Current Availability",
  trainerInstructorName: "Trainer / Instructor Name",
  trainerExperience: "Trainer Experience",
  languageOfDelivery: "Language of Delivery",
  whatsIncluded: "What's Included",
  whatsNotIncluded: "What's Not Included",
  learningOutcomes: "Learning Outcomes",
  courseDemoVideo: "Course Demo Video (YouTube Link)",
  brochurePdfDownload: "Brochure PDF Upload",
  refundCancellationPolicy: "Refund / Cancellation Policy",
  postCourseSupport: "Post-Course Support",
  contactForQueries: "Contact for Queries",
};

const isYoutubeUrl = (value: string) => {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be")
    );
  } catch {
    return false;
  }
};

const CreateCourse = () => {
  const [formData, setFormData] = useState<CourseFormData>(createInitialFormData());
  const [targetAudienceInput, setTargetAudienceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
      ],
    }),
    []
  );

  const quillFormats = useMemo(
    () => ["header", "bold", "italic", "underline", "list", "bullet", "link"],
    []
  );

  const loadNextCourseCode = async () => {
    try {
      setLoadingCode(true);
      const response = await fetch(`${API_URL}/courses/next-code`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate course code");
      }

      setFormData((prev) => ({
        ...prev,
        courseUniqueCode: data.courseUniqueCode || "DRMC0001",
      }));
    } catch {
      setFormData((prev) => ({
        ...prev,
        courseUniqueCode: prev.courseUniqueCode || "DRMC0001",
      }));
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    loadNextCourseCode();
  }, []);

  const handleChange = (
    field: keyof CourseFormData,
    value: string | boolean | string[] | File[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTargetAudience = () => {
    const value = targetAudienceInput.trim();

    if (!value) return;

    if (
      formData.targetAudience.some(
        (item) => item.toLowerCase() === value.toLowerCase()
      )
    ) {
      setTargetAudienceInput("");
      return;
    }

    handleChange("targetAudience", [...formData.targetAudience, value]);
    setTargetAudienceInput("");
  };

  const handleAudienceKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTargetAudience();
    }
  };

  const removeTargetAudience = (value: string) => {
    handleChange(
      "targetAudience",
      formData.targetAudience.filter((item) => item !== value)
    );
  };

  const handleBrochureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).filter(
      (file) => file.type === "application/pdf"
    );

    if (selectedFiles.length === 0) return;

    const mergedFiles = [...formData.brochurePdfDownload];

    for (const file of selectedFiles) {
      const alreadyAdded = mergedFiles.some(
        (item) => item.name === file.name && item.size === file.size
      );

      if (!alreadyAdded) {
        mergedFiles.push(file);
      }
    }

    handleChange("brochurePdfDownload", mergedFiles);
    event.target.value = "";
  };

  const removeBrochure = (fileName: string) => {
    handleChange(
      "brochurePdfDownload",
      formData.brochurePdfDownload.filter((file) => file.name !== fileName)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.courseName.trim()) {
      setError("Course name is required");
      return;
    }

    if (!formData.courseUniqueCode.trim()) {
      setError("Course unique code is still generating. Please wait a moment.");
      return;
    }

    if (!formData.courseType) {
      setError("Please select a course type");
      return;
    }

    if (!formData.languageOfDelivery) {
      setError("Please select language of delivery");
      return;
    }

    if (!isYoutubeUrl(formData.courseDemoVideo)) {
      setError("Course demo video must be a valid YouTube link");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("courseName", formData.courseName.trim());
      payload.append("courseUniqueCode", formData.courseUniqueCode.trim());
      payload.append("courseType", formData.courseType);
      payload.append("instituteName", formData.instituteName);
      payload.append("courseDuration", formData.courseDuration);
      payload.append("modeOfTraining", formData.modeOfTraining);
      payload.append("startDate", formData.startDate);
      payload.append("endDate", formData.endDate);
      payload.append("registrationDeadline", formData.registrationDeadline);
      payload.append("curriculumTopicsCovered", formData.curriculumTopicsCovered);
      payload.append("targetAudience", JSON.stringify(formData.targetAudience));
      payload.append("certificationProvided", formData.certificationProvided);
      payload.append("affiliationAccreditation", formData.affiliationAccreditation);
      payload.append("feesInr", formData.feesInr);
      payload.append(
        "applyDiscountVoucher",
        String(formData.applyDiscountVoucher)
      );
      payload.append("netFeesInr", formData.netFeesInr);
      payload.append("discountsOffers", formData.discountsOffers);
      payload.append("location", formData.location);
      payload.append("maximumSeatsBatchSize", formData.maximumSeatsBatchSize);
      payload.append("currentAvailability", formData.currentAvailability);
      payload.append("trainerInstructorName", formData.trainerInstructorName);
      payload.append("trainerExperience", formData.trainerExperience);
      payload.append("languageOfDelivery", formData.languageOfDelivery);
      payload.append("whatsIncluded", formData.whatsIncluded);
      payload.append("whatsNotIncluded", formData.whatsNotIncluded);
      payload.append("learningOutcomes", formData.learningOutcomes);
      payload.append("courseDemoVideo", formData.courseDemoVideo.trim());
      payload.append(
        "refundCancellationPolicy",
        formData.refundCancellationPolicy
      );
      payload.append("postCourseSupport", formData.postCourseSupport);
      payload.append("contactForQueries", formData.contactForQueries);

      formData.brochurePdfDownload.forEach((file) => {
        payload.append("brochurePdfDownload", file);
      });

      const response = await fetch(`${API_URL}/courses`, {
        method: "POST",
        body: payload,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to create course");
      }

      const nextCodeResponse = await fetch(`${API_URL}/courses/next-code`);
      const nextCodeData = await nextCodeResponse.json().catch(() => ({}));
      const nextCode =
        nextCodeResponse.ok && nextCodeData.courseUniqueCode
          ? nextCodeData.courseUniqueCode
          : "";

      setFormData(createInitialFormData(nextCode));
      setTargetAudienceInput("");
      setSuccess("Course created successfully");
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    field: Exclude<
      keyof CourseFormData,
      | "applyDiscountVoucher"
      | "targetAudience"
      | "courseType"
      | "languageOfDelivery"
      | "whatsIncluded"
      | "whatsNotIncluded"
      | "learningOutcomes"
      | "brochurePdfDownload"
    >
  ) => {
    const isTextArea = textAreaFields.includes(field as (typeof textAreaFields)[number]);
    const isDateField = dateFields.includes(field as (typeof dateFields)[number]);
    const isNumberField =
      field === "feesInr" ||
      field === "netFeesInr" ||
      field === "maximumSeatsBatchSize";
    const inputType = isDateField
      ? "date"
      : isNumberField
        ? "number"
        : field === "courseDemoVideo"
          ? "url"
          : "text";

    return (
      <div
        key={field}
        className={
          isTextArea || field === "courseDemoVideo"
            ? styles.fullField
            : styles.field
        }
      >
        <label className={styles.label}>{fieldLabels[field]}</label>
        {isTextArea ? (
          <textarea
            className={styles.input}
            value={formData[field] as string}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={`Enter ${fieldLabels[field]}`}
            rows={5}
          />
        ) : (
          <input
            type={inputType}
            min={isNumberField ? "0" : undefined}
            className={`${styles.input} ${
              field === "courseUniqueCode" ? styles.readOnlyInput : ""
            }`}
            value={formData[field] as string}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={`Enter ${fieldLabels[field]}`}
            readOnly={field === "courseUniqueCode"}
          />
        )}
        {field === "courseUniqueCode" && (
          <span className={styles.helperText}>
            {loadingCode
              ? "Generating next course code..."
              : "Auto-generated in DRMC series."}
          </span>
        )}
        {field === "courseDemoVideo" && (
          <span className={styles.helperText}>
            Add a YouTube link like `https://www.youtube.com/watch?v=...`
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Course</h1>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.noImage}>{success}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Course Details</h2>

          <div className={styles.fieldGrid}>
            {renderInput("courseName")}
            {renderInput("courseUniqueCode")}

            <div className={styles.field}>
              <label className={styles.label}>{fieldLabels.courseType}</label>
              <select
                className={styles.input}
                value={formData.courseType}
                onChange={(e) => handleChange("courseType", e.target.value)}
              >
                <option value="">Select course type</option>
                {courseTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {fieldLabels.certificationProvided}
              </label>
              <select
                className={styles.input}
                value={formData.certificationProvided}
                onChange={(e) =>
                  handleChange("certificationProvided", e.target.value)
                }
              >
                <option value="">Select option</option>
                {certificationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {renderInput("instituteName")}
            {renderInput("courseDuration")}
            {renderInput("modeOfTraining")}
            {renderInput("startDate")}
            {renderInput("endDate")}
            {renderInput("registrationDeadline")}
            {renderInput("feesInr")}
            {renderInput("netFeesInr")}
            {renderInput("maximumSeatsBatchSize")}
            {renderInput("location")}
            {renderInput("currentAvailability")}
            {renderInput("trainerInstructorName")}
            {renderInput("trainerExperience")}

            <div className={styles.field}>
              <label className={styles.label}>
                {fieldLabels.languageOfDelivery}
              </label>
              <select
                className={styles.input}
                value={formData.languageOfDelivery}
                onChange={(e) =>
                  handleChange("languageOfDelivery", e.target.value)
                }
              >
                <option value="">Select language</option>
                {languageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {fieldLabels.applyDiscountVoucher}
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={formData.applyDiscountVoucher}
                  onChange={(e) =>
                    handleChange("applyDiscountVoucher", e.target.checked)
                  }
                />
                Enable discount voucher for this course
              </label>
            </div>

            {renderInput("discountsOffers")}
            {renderInput("curriculumTopicsCovered")}
            {renderInput("affiliationAccreditation")}
            {renderInput("courseDemoVideo")}
            {renderInput("refundCancellationPolicy")}
            {renderInput("postCourseSupport")}
            {renderInput("contactForQueries")}

            <div className={styles.fullField}>
              <label className={styles.label}>{fieldLabels.targetAudience}</label>
              <div className={styles.chipComposer}>
                <div className={styles.chipInputRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={targetAudienceInput}
                    onChange={(e) => setTargetAudienceInput(e.target.value)}
                    onKeyDown={handleAudienceKeyDown}
                    placeholder="Type audience and press Enter"
                  />
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={addTargetAudience}
                  >
                    Add
                  </button>
                </div>

                <div className={styles.chipList}>
                  {formData.targetAudience.length > 0 ? (
                    formData.targetAudience.map((item) => (
                      <span key={item} className={styles.chip}>
                        {item}
                        <button
                          type="button"
                          className={styles.chipRemove}
                          onClick={() => removeTargetAudience(item)}
                        >
                          x
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className={styles.noImage}>No target audience added yet</p>
                  )}
                </div>
              </div>
            </div>

            {richTextFields.map((field) => (
              <div key={field} className={styles.fullField}>
                <label className={styles.label}>{fieldLabels[field]}</label>
                <ReactQuill
                  className={styles.quill}
                  theme="snow"
                  value={formData[field]}
                  onChange={(value) => handleChange(field, value)}
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>
            ))}

            <div className={styles.fullField}>
              <label className={styles.label}>
                {fieldLabels.brochurePdfDownload}
              </label>
              <div className={styles.uploadBox}>
                <label className={styles.uploadBtn}>
                  Select PDF Files
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleBrochureChange}
                    hidden
                  />
                </label>
                <span className={styles.uploadHint}>
                  Upload one or more brochure PDFs
                </span>
              </div>

              <div className={styles.fileList}>
                {formData.brochurePdfDownload.length > 0 ? (
                  formData.brochurePdfDownload.map((file) => (
                    <div key={`${file.name}-${file.size}`} className={styles.fileItem}>
                      <span className={styles.fileName}>{file.name}</span>
                      <button
                        type="button"
                        className={styles.removeFileBtn}
                        onClick={() => removeBrochure(file.name)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className={styles.noImage}>No brochure PDFs selected</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || loadingCode}
        >
          {loading ? "Creating..." : "Create Course"}
        </button>
      </form>

      <MobileNavbar />
    </div>
  );
};

export default CreateCourse;

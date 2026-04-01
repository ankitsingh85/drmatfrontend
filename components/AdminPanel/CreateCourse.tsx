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
  trainerImage: File | null;
  trainerExperience: string;
  languageOfDelivery: string;
  whatsIncluded: string;
  whatsNotIncluded: string;
  learningOutcomes: string;
  courseImage: File | null;
  courseDemoVideo: string;
  brochurePdfDownload: File[];
  refundCancellationPolicy: string;
  postCourseSupport: string;
  mobileNo: string;
  contactForQueries: string;
};

type CourseTypeOption = {
  _id: string;
  id: string;
  name: string;
  imageUrl?: string;
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
  trainerImage: null,
  trainerExperience: "",
  languageOfDelivery: "",
  whatsIncluded: "",
  whatsNotIncluded: "",
  learningOutcomes: "",
  courseImage: null,
  courseDemoVideo: "",
  brochurePdfDownload: [],
  refundCancellationPolicy: "",
  postCourseSupport: "",
  mobileNo: "",
  contactForQueries: "",
});

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
  trainerImage: "Trainer / Instructor Image",
  trainerExperience: "Trainer Experience",
  languageOfDelivery: "Language of Delivery",
  whatsIncluded: "What's Included",
  whatsNotIncluded: "What's Not Included",
  learningOutcomes: "Learning Outcomes",
  courseImage: "Course Image",
  courseDemoVideo: "Course Demo Video (YouTube Link)",
  brochurePdfDownload: "Brochure PDF Upload",
  refundCancellationPolicy: "Refund / Cancellation Policy",
  postCourseSupport: "Post-Course Support",
  mobileNo: "Mobile Number",
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

const textOnlyRegex = /^[A-Za-z ]+$/;
const digitsOnlyRegex = /^\d+$/;
const isValidYoutubeUrl = (value: string) => {
  if (!value.trim()) return false;
  return isYoutubeUrl(value);
};
const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const sanitizeTextOnly = (value: string) => value.replace(/[^A-Za-z ]/g, "");
const sanitizeDigitsOnly = (value: string) => value.replace(/\D/g, "");

type CourseErrors = Partial<Record<keyof CourseFormData, string>>;
type CourseTouched = Partial<Record<keyof CourseFormData, boolean>>;

const validateCourseField = (
  field: keyof CourseFormData,
  value: CourseFormData[keyof CourseFormData],
  form: CourseFormData
) => {
  const stringValue = String(value ?? "").trim();
  const requiredTextFields: Array<keyof CourseFormData> = [
    "courseName",
    "courseUniqueCode",
    "courseType",
    "instituteName",
    "courseDuration",
    "modeOfTraining",
    "startDate",
    "endDate",
    "registrationDeadline",
    "curriculumTopicsCovered",
    "certificationProvided",
    "affiliationAccreditation",
    "location",
    "currentAvailability",
    "trainerInstructorName",
    "trainerExperience",
    "languageOfDelivery",
    "refundCancellationPolicy",
    "postCourseSupport",
    "mobileNo",
    "contactForQueries",
    "courseDemoVideo",
  ];

  if (field === "targetAudience" && (!Array.isArray(value) || value.length === 0)) {
    return "At least one target audience item is required";
  }

  if (field === "courseImage" && !(value instanceof File)) {
    return "Course image is required";
  }

  if (field === "trainerImage" && !(value instanceof File)) {
    return "Trainer image is required";
  }

  if (field === "brochurePdfDownload" && (!Array.isArray(value) || value.length === 0)) {
    return "At least one brochure PDF is required";
  }

  if (requiredTextFields.includes(field) && !stringValue) {
    const labels: Record<string, string> = {
      courseName: "Course name",
      courseUniqueCode: "Course unique code",
      courseType: "Course type",
      instituteName: "Institute name",
      courseDuration: "Course duration",
      modeOfTraining: "Mode of training",
      startDate: "Start date",
      endDate: "End date",
      registrationDeadline: "Registration deadline",
      curriculumTopicsCovered: "Curriculum / Topics Covered",
      certificationProvided: "Certification Provided",
      affiliationAccreditation: "Affiliation / Accreditation",
      location: "Location",
      currentAvailability: "Current Availability",
      trainerInstructorName: "Trainer / Instructor Name",
      trainerExperience: "Trainer Experience",
      languageOfDelivery: "Language of Delivery",
      refundCancellationPolicy: "Refund / Cancellation Policy",
      postCourseSupport: "Post-Course Support",
      mobileNo: "Mobile number",
      contactForQueries: "Contact for Queries",
      courseDemoVideo: "Course Demo Video",
    };
    return `${labels[field] || String(field)} is required`;
  }

  if (field === "courseName" && !textOnlyRegex.test(stringValue)) {
    return "Course name should contain only letters and spaces";
  }

  if (field === "instituteName" && !textOnlyRegex.test(stringValue)) {
    return "Institute name should contain only letters and spaces";
  }

  if (field === "trainerInstructorName" && !textOnlyRegex.test(stringValue)) {
    return "Trainer / instructor name should contain only letters and spaces";
  }

  if (field === "mobileNo" && !digitsOnlyRegex.test(stringValue)) {
    return "Mobile number must contain digits only";
  }

  if (field === "mobileNo" && stringValue && stringValue.length !== 10) {
    return "Mobile number must be exactly 10 digits";
  }

  if (
    ["feesInr", "netFeesInr", "maximumSeatsBatchSize"].includes(field) &&
    stringValue &&
    Number.isNaN(Number(stringValue))
  ) {
    return `${fieldLabels[field]} must be a valid number`;
  }

  if (
    ["feesInr", "netFeesInr", "maximumSeatsBatchSize"].includes(field) &&
    stringValue &&
    !Number.isInteger(Number(stringValue))
  ) {
    return `${fieldLabels[field]} must contain digits only`;
  }

  if (
    ["feesInr", "netFeesInr", "maximumSeatsBatchSize"].includes(field) &&
    !stringValue
  ) {
    return `${fieldLabels[field]} is required`;
  }

  if (field === "courseDemoVideo" && !isValidYoutubeUrl(stringValue)) {
    return "Course demo video must be a valid YouTube link";
  }

  if (field === "courseType" && !stringValue) return "Please select a course type";
  if (field === "certificationProvided" && !stringValue) return "Please select certification provided";
  if (field === "languageOfDelivery" && !stringValue) return "Please select language of delivery";

  if (field === "whatsIncluded" && !stripHtml(String(value))) {
    return "What's Included is required";
  }
  if (field === "whatsNotIncluded" && !stripHtml(String(value))) {
    return "What's Not Included is required";
  }
  if (field === "learningOutcomes" && !stripHtml(String(value))) {
    return "Learning Outcomes is required";
  }

  if (field === "startDate" || field === "endDate" || field === "registrationDeadline") {
    if (!stringValue) return `${fieldLabels[field]} is required`;
  }

  return "";
};

const CreateCourse = () => {
  const [formData, setFormData] = useState<CourseFormData>(createInitialFormData());
  const [courseTypeOptions, setCourseTypeOptions] = useState<CourseTypeOption[]>([]);
  const [targetAudienceInput, setTargetAudienceInput] = useState("");
  const [courseImagePreview, setCourseImagePreview] = useState("");
  const [trainerImagePreview, setTrainerImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);
  const [loadingCourseTypes, setLoadingCourseTypes] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CourseErrors>({});
  const [touched, setTouched] = useState<CourseTouched>({});

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

  useEffect(() => {
    const loadCourseTypes = async () => {
      try {
        setLoadingCourseTypes(true);
        const response = await fetch(`${API_URL}/course-types`);
        const data = await response.json().catch(() => []);
        setCourseTypeOptions(Array.isArray(data) ? data : []);
      } catch {
        setCourseTypeOptions([]);
      } finally {
        setLoadingCourseTypes(false);
      }
    };

    loadCourseTypes();
  }, []);

  const setFieldValue = (
    field: keyof CourseFormData,
    value: string | boolean | string[] | File[] | File | null
  ) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      setFieldErrors((prevErrors) => ({
        ...prevErrors,
        [field]: validateCourseField(field, value as any, next),
      }));

      return next;
    });
  };

  const handleChange = (
    field: keyof CourseFormData,
    value: string | boolean | string[] | File[] | File | null
  ) => {
    let nextValue = value;

    if (field === "courseName" || field === "instituteName" || field === "trainerInstructorName") {
      nextValue = sanitizeTextOnly(String(value ?? ""));
    }

    if (
      field === "mobileNo" ||
      field === "feesInr" ||
      field === "netFeesInr" ||
      field === "maximumSeatsBatchSize"
    ) {
      nextValue = sanitizeDigitsOnly(String(value ?? ""));
    }

    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldValue(field, nextValue);
    setError("");
    setSuccess("");
  };

  const handleCourseImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        courseImage: "Course image must be JPG, JPEG, PNG, or WEBP",
      }));
      setTouched((prev) => ({ ...prev, courseImage: true }));
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        courseImage: "Course image must be less than or equal to 5MB",
      }));
      setTouched((prev) => ({ ...prev, courseImage: true }));
      event.target.value = "";
      return;
    }

    setFieldErrors((prev) => ({ ...prev, courseImage: "" }));
    setTouched((prev) => ({ ...prev, courseImage: true }));
    handleChange("courseImage", file);
    setCourseImagePreview(URL.createObjectURL(file));
  };

  const handleTrainerImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        trainerImage: "Trainer image must be JPG, JPEG, PNG, or WEBP",
      }));
      setTouched((prev) => ({ ...prev, trainerImage: true }));
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        trainerImage: "Trainer image must be less than or equal to 5MB",
      }));
      setTouched((prev) => ({ ...prev, trainerImage: true }));
      event.target.value = "";
      return;
    }

    setFieldErrors((prev) => ({ ...prev, trainerImage: "" }));
    setTouched((prev) => ({ ...prev, trainerImage: true }));
    handleChange("trainerImage", file);
    setTrainerImagePreview(URL.createObjectURL(file));
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
    setTouched((prev) => ({ ...prev, targetAudience: true }));
    setFieldErrors((prev) => ({ ...prev, targetAudience: "" }));
  };

  const handleAudienceKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTargetAudience();
    }
  };

  const removeTargetAudience = (value: string) => {
    const next = formData.targetAudience.filter((item) => item !== value);
    handleChange("targetAudience", next);
    setTouched((prev) => ({ ...prev, targetAudience: true }));
    setFieldErrors((prev) => ({
      ...prev,
      targetAudience: validateCourseField("targetAudience", next, {
        ...formData,
        targetAudience: next,
      }),
    }));
  };

  const handleBrochureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).filter(
      (file) => file.type === "application/pdf"
    );

    if (selectedFiles.length === 0) {
      setTouched((prev) => ({ ...prev, brochurePdfDownload: true }));
      setFieldErrors((prev) => ({
        ...prev,
        brochurePdfDownload: "Please upload at least one PDF",
      }));
      return;
    }

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
    setTouched((prev) => ({ ...prev, brochurePdfDownload: true }));
    setFieldErrors((prev) => ({ ...prev, brochurePdfDownload: "" }));
    event.target.value = "";
  };

  const removeBrochure = (fileName: string) => {
    handleChange(
      "brochurePdfDownload",
      formData.brochurePdfDownload.filter((file) => file.name !== fileName)
    );
    setTouched((prev) => ({ ...prev, brochurePdfDownload: true }));
    setFieldErrors((prev) => ({
      ...prev,
      brochurePdfDownload:
        formData.brochurePdfDownload.filter((file) => file.name !== fileName)
          .length === 0
          ? "At least one brochure PDF is required"
          : "",
    }));
  };

  const validateAllFields = (current: CourseFormData) => {
    const nextErrors: CourseErrors = {};
    (Object.keys(current) as Array<keyof CourseFormData>).forEach((field) => {
      const errorMessage = validateCourseField(field, current[field] as any, current);
      if (errorMessage) {
        nextErrors[field] = errorMessage;
      }
    });

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validateAllFields(formData);
    setFieldErrors(nextErrors);
    setTouched(
      Object.keys(formData).reduce((acc, key) => {
        acc[key as keyof CourseFormData] = true;
        return acc;
      }, {} as CourseTouched)
    );

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!formData.courseUniqueCode.trim()) {
      setError("Course unique code is still generating. Please wait a moment.");
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
      if (formData.trainerImage) {
        payload.append("trainerImage", formData.trainerImage);
      }
      payload.append("trainerExperience", formData.trainerExperience);
      payload.append("languageOfDelivery", formData.languageOfDelivery);
      payload.append("whatsIncluded", formData.whatsIncluded);
      payload.append("whatsNotIncluded", formData.whatsNotIncluded);
      payload.append("learningOutcomes", formData.learningOutcomes);
      if (formData.courseImage) {
        payload.append("courseImage", formData.courseImage);
      }
      payload.append("courseDemoVideo", formData.courseDemoVideo.trim());
      payload.append(
        "refundCancellationPolicy",
        formData.refundCancellationPolicy
      );
      payload.append("postCourseSupport", formData.postCourseSupport);
      payload.append("mobileNo", formData.mobileNo);
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
      setCourseImagePreview("");
      setTrainerImagePreview("");
      setSuccess("Course created successfully");
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
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
      | "courseImage"
      | "trainerImage"
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
        : field === "mobileNo"
          ? "tel"
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
            onBlur={() => {
              setTouched((prev) => ({ ...prev, [field]: true }));
              setFieldErrors((prev) => ({
                ...prev,
                [field]: validateCourseField(field, formData[field] as any, formData),
              }));
            }}
            placeholder={`Enter ${fieldLabels[field]}`}
            rows={5}
          />
        ) : (
          <input
            type={inputType}
            min={isNumberField ? "0" : undefined}
            step={isNumberField ? "1" : undefined}
            className={`${styles.input} ${
              field === "courseUniqueCode" ? styles.readOnlyInput : ""
            }`}
            value={formData[field] as string}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, [field]: true }));
              setFieldErrors((prev) => ({
                ...prev,
                [field]: validateCourseField(field, formData[field] as any, formData),
              }));
            }}
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
        {touched[field] && fieldErrors[field] && (
          <p className={styles.fieldError}>{fieldErrors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* <h1 className={styles.heading}>Create Course</h1> */}

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

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
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, courseType: true }));
                  setFieldErrors((prev) => ({
                    ...prev,
                    courseType: validateCourseField(
                      "courseType",
                      formData.courseType,
                      formData
                    ),
                  }));
                }}
              >
                <option value="">
                  {loadingCourseTypes ? "Loading course types..." : "Select course type"}
                </option>
                {courseTypeOptions.map((option) => (
                  <option key={option._id || option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              {!loadingCourseTypes && courseTypeOptions.length === 0 && (
                <span className={styles.helperText}>
                  No course types found. Create one from the dashboard first.
                </span>
              )}
              {touched.courseType && fieldErrors.courseType && (
                <p className={styles.fieldError}>{fieldErrors.courseType}</p>
              )}
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
                onBlur={() => {
                  setTouched((prev) => ({
                    ...prev,
                    certificationProvided: true,
                  }));
                  setFieldErrors((prev) => ({
                    ...prev,
                    certificationProvided: validateCourseField(
                      "certificationProvided",
                      formData.certificationProvided,
                      formData
                    ),
                  }));
                }}
              >
                <option value="">Select option</option>
                {certificationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {touched.certificationProvided && fieldErrors.certificationProvided && (
                <p className={styles.fieldError}>
                  {fieldErrors.certificationProvided}
                </p>
              )}
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

            <div className={styles.fullField}>
              <label className={styles.label}>{fieldLabels.trainerImage}</label>
              <div className={styles.uploadBox}>
                <label className={styles.uploadBtn}>
                  Select Trainer Image
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleTrainerImageChange}
                    hidden
                  />
                </label>
                <span className={styles.uploadHint}>
                  Upload one image for the trainer or instructor
                </span>
              </div>

              {trainerImagePreview ? (
                <img
                  src={trainerImagePreview}
                  className={styles.preview}
                  alt="Trainer preview"
                />
              ) : (
                <p className={styles.noImage}>No trainer image selected</p>
              )}
              {touched.trainerImage && fieldErrors.trainerImage && (
                <p className={styles.fieldError}>{fieldErrors.trainerImage}</p>
              )}
            </div>

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
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, languageOfDelivery: true }));
                  setFieldErrors((prev) => ({
                    ...prev,
                    languageOfDelivery: validateCourseField(
                      "languageOfDelivery",
                      formData.languageOfDelivery,
                      formData
                    ),
                  }));
                }}
              >
                <option value="">Select language</option>
                {languageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {touched.languageOfDelivery && fieldErrors.languageOfDelivery && (
                <p className={styles.fieldError}>
                  {fieldErrors.languageOfDelivery}
                </p>
              )}
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

            <div className={styles.fullField}>
              <label className={styles.label}>{fieldLabels.courseImage}</label>
              <div className={styles.uploadBox}>
                <label className={styles.uploadBtn}>
                  Select Course Image
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleCourseImageChange}
                    hidden
                  />
                </label>
                <span className={styles.uploadHint}>
                  Upload one image for the course cover
                </span>
              </div>

              {courseImagePreview ? (
                <img
                  src={courseImagePreview}
                  className={styles.preview}
                  alt="Course preview"
                />
              ) : (
                <p className={styles.noImage}>No course image selected</p>
              )}
              {touched.courseImage && fieldErrors.courseImage && (
                <p className={styles.fieldError}>{fieldErrors.courseImage}</p>
              )}
            </div>

            {renderInput("courseDemoVideo")}
            {renderInput("refundCancellationPolicy")}
            {renderInput("postCourseSupport")}
            {renderInput("mobileNo")}
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
            {touched.targetAudience && fieldErrors.targetAudience && (
              <p className={styles.fieldError}>{fieldErrors.targetAudience}</p>
            )}
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
                  onBlur={() => {
                    setTouched((prev) => ({
                      ...prev,
                      [field]: true,
                    }));
                    setFieldErrors((prev) => ({
                      ...prev,
                      [field]: validateCourseField(
                        field,
                        formData[field] as any,
                        formData
                      ),
                    }));
                  }}
                  modules={quillModules}
                  formats={quillFormats}
                />
                {touched[field] && fieldErrors[field] && (
                  <p className={styles.fieldError}>{fieldErrors[field]}</p>
                )}
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
              {touched.brochurePdfDownload && fieldErrors.brochurePdfDownload && (
                <p className={styles.fieldError}>
                  {fieldErrors.brochurePdfDownload}
                </p>
              )}
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
    </div>
  );
};

export default CreateCourse;

"use client";

import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/config/api";
import { resolveMediaUrl, getExportSafeMediaValue } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";
import formStyles from "@/styles/Dashboard/createcategory.module.css";

type WorkshopTraining = {
  _id: string;
  trainingName?: string;
  trainingUniqueCode?: string;
  trainingType?: string[];
  hsnCode?: string;
  discountPercent?: number;
  instituteName?: string;
  trainingDuration?: string;
  modeOfTraining?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  curriculumTopicsCovered?: string;
  targetAudience?: string[];
  certificationProvided?: string;
  affiliationAccreditation?: string;
  feesInr?: number;
  applyDiscountVoucher?: boolean;
  netFeesInr?: number;
  installmentEmiOption?: boolean;
  location?: string;
  maximumSeatsBatchSize?: number;
  currentAvailability?: string;
  trainerInstructorName?: string;
  trainingImage?: string;
  trainerImage?: string;
  trainerExperience?: string;
  languageOfDelivery?: string;
  whatsIncluded?: string;
  whatsNotIncluded?: string;
  learningOutcomes?: string;
  courseDemoVideo?: string;
  brochurePdfDownload?: string[];
  refundCancellationPolicy?: string;
  postTrainingSupport?: string;
  contactForQueries?: string;
  createdAt?: string;
};

type TrainingTypeOption = { _id: string; name: string };

type WorkshopTrainingEditForm = {
  trainingName: string;
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
  trainerImage: File | null;
  brochurePdfDownload: File[];
};

const emptyEditForm: WorkshopTrainingEditForm = {
  trainingName: "",
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
  trainerImage: null,
  brochurePdfDownload: [],
};

const yesNo = ["Yes", "No"];
const languages = ["English", "Hindi", "Bilingual"];

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  background: "linear-gradient(180deg, #2981b7 0%, #10678c 100%)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(15, 23, 42, 0.14)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
};

const errorStyle: React.CSSProperties = {
  margin: 0,
  color: "#b91c1c",
  fontWeight: 500,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 3400,
};

const thTdStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  border: "1px solid #e5e7eb",
  verticalAlign: "middle",
  fontSize: 13,
  whiteSpace: "normal",
  overflowWrap: "break-word",
};

const theadStyle: React.CSSProperties = {
  ...thTdStyle,
  background: "linear-gradient(135deg, #0a4b83 0%, #1264a3 100%)",
  color: "#eaf3ff",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
  borderRight: "1px solid rgba(255, 255, 255, 0.15)",
};

const infoCardStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#0f172a",
  marginTop: 2,
  whiteSpace: "pre-wrap",
};

const Field = ({
  label,
  full = false,
  required = false,
  children,
}: {
  label: string;
  full?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className={full ? formStyles.fullField : formStyles.field}>
    <label className={formStyles.label}>
      {label}
      {required && <span className={formStyles.required}>*</span>}
    </label>
    {children}
  </div>
);

const InfoCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={infoCardStyle}>
    <div style={infoLabelStyle}>{label}</div>
    <div style={infoValueStyle}>{value}</div>
  </div>
);

type ListOfWorkshopTraningProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

export default function ListOfWorkshopTraning({
  canEdit = true,
  canDelete = true,
}: ListOfWorkshopTraningProps) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [items, setItems] = useState<WorkshopTraining[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeOption[]>([]);

  const [viewItem, setViewItem] = useState<WorkshopTraining | null>(null);

  const [editingItem, setEditingItem] = useState<WorkshopTraining | null>(null);
  const [editForm, setEditForm] = useState<WorkshopTrainingEditForm>(emptyEditForm);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editTrainerPreview, setEditTrainerPreview] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWorkshopTrainings = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/workshop-trainings`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Failed to fetch workshop trainings");

      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch workshop trainings");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/training-types`);
      const data = await res.json().catch(() => []);
      const normalized = (Array.isArray(data) ? data : [])
        .map((item: any) => ({ _id: String(item._id || item.id || ""), name: String(item.name || "") }))
        .filter((item: TrainingTypeOption) => item._id && item.name);
      setTrainingTypes(normalized);
    } catch {
      setTrainingTypes([]);
    }
  }, []);

  useEffect(() => {
    fetchWorkshopTrainings();
    fetchTrainingTypes();
  }, [fetchTrainingTypes]);

  useEffect(() => {
    const refresh = () => {
      fetchWorkshopTrainings();
      fetchTrainingTypes();
    };
    window.addEventListener("admin-dashboard:create-success", refresh);
    return () => window.removeEventListener("admin-dashboard:create-success", refresh);
  }, [fetchTrainingTypes]);

  useEffect(
    () => () => {
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
      if (editTrainerPreview) URL.revokeObjectURL(editTrainerPreview);
    },
    [editImagePreview, editTrainerPreview]
  );

  const trainingTypeOptions = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => {
      (item.trainingType || []).forEach((type) => {
        if (type) values.add(type);
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = [
        item.trainingName,
        item.trainingUniqueCode,
        (item.trainingType || []).join(", "),
        item.instituteName,
        item.modeOfTraining,
        item.trainerInstructorName,
        item.currentAvailability,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const matchesType =
        filterType === "all" || (item.trainingType || []).includes(filterType);

      return matchesSearch && matchesType;
    });
  }, [items, search, filterType]);

  const stripHtml = (value?: string) =>
    (value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const truncate = (value?: string, maxLength = 60) => {
    const text = stripHtml(value);
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  };

  const bulkSelection = useBulkSelection(filteredItems, (item) => item._id);

  const handleDownloadCSV = () => {
    const rows = [
      [
        "Training Name",
        "Training Code",
        "Training Type",
        "HSN Code",
        "Discount %",
        "Institute Name",
        "Training Duration",
        "Mode Of Training",
        "Start Date",
        "End Date",
        "Reg. Deadline",
        "Curriculum",
        "Target Audience",
        "Certification",
        "Affiliation",
        "Fee",
        "Discount Voucher",
        "Net Fee",
        "EMI Option",
        "Location",
        "Max Seats",
        "Availability",
        "Training Image",
        "Trainer Name",
        "Trainer Image",
        "Trainer Experience",
        "Language",
        "What's Included",
        "What's Not Included",
        "Learning Outcomes",
        "Demo Video",
        "Brochures",
        "Refund Policy",
        "Post-Training Support",
        "Contact",
        "Created",
      ],
      ...filteredItems.map((item) => [
        stripHtml(item.trainingName),
        stripHtml(item.trainingUniqueCode),
        (item.trainingType || []).join(", ") || "-",
        item.hsnCode || "-",
        typeof item.discountPercent === "number" ? `${item.discountPercent}%` : "-",
        stripHtml(item.instituteName),
        stripHtml(item.trainingDuration),
        stripHtml(item.modeOfTraining),
        formatDate(item.startDate),
        formatDate(item.endDate),
        formatDate(item.registrationDeadline),
        truncate(item.curriculumTopicsCovered),
        (item.targetAudience || []).join(", ") || "-",
        item.certificationProvided || "-",
        truncate(item.affiliationAccreditation),
        typeof item.feesInr === "number" ? `INR ${item.feesInr}` : "-",
        item.applyDiscountVoucher ? "Yes" : "No",
        typeof item.netFeesInr === "number" ? `INR ${item.netFeesInr}` : "-",
        item.installmentEmiOption ? "Yes" : "No",
        item.location || "-",
        item.maximumSeatsBatchSize ?? "-",
        stripHtml(item.currentAvailability),
        getExportSafeMediaValue(item.trainingImage),
        stripHtml(item.trainerInstructorName),
        getExportSafeMediaValue(item.trainerImage),
        truncate(item.trainerExperience),
        item.languageOfDelivery || "-",
        truncate(item.whatsIncluded),
        truncate(item.whatsNotIncluded),
        truncate(item.learningOutcomes),
        item.courseDemoVideo || "-",
        item.brochurePdfDownload?.length
          ? item.brochurePdfDownload
              .map((file) => getExportSafeMediaValue(file))
              .join(", ")
          : "-",
        truncate(item.refundCancellationPolicy),
        truncate(item.postTrainingSupport),
        item.contactForQueries || "-",
        formatDate(item.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "workshop-trainings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const printable = window.open("", "_blank");
    if (!printable) {
      toast.error("Unable to open print window. Please allow popups.");
      return;
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rows = filteredItems
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.trainingName || "-")}</td>
          <td>${escapeHtml(item.trainingUniqueCode || "-")}</td>
          <td>${escapeHtml((item.trainingType || []).join(", ") || "-")}</td>
          <td>${escapeHtml(item.hsnCode || "-")}</td>
          <td>${escapeHtml(typeof item.discountPercent === "number" ? `${item.discountPercent}%` : "-")}</td>
          <td>${escapeHtml(item.instituteName || "-")}</td>
          <td>${escapeHtml(item.trainingDuration || "-")}</td>
          <td>${escapeHtml(item.modeOfTraining || "-")}</td>
          <td>${escapeHtml(formatDate(item.startDate))}</td>
          <td>${escapeHtml(formatDate(item.endDate))}</td>
          <td>${escapeHtml(formatDate(item.registrationDeadline))}</td>
          <td>${escapeHtml(truncate(item.curriculumTopicsCovered))}</td>
          <td>${escapeHtml((item.targetAudience || []).join(", ") || "-")}</td>
          <td>${escapeHtml(item.certificationProvided || "-")}</td>
          <td>${escapeHtml(truncate(item.affiliationAccreditation))}</td>
          <td>${escapeHtml(typeof item.feesInr === "number" ? `INR ${item.feesInr}` : "-")}</td>
          <td>${escapeHtml(item.applyDiscountVoucher ? "Yes" : "No")}</td>
          <td>${escapeHtml(typeof item.netFeesInr === "number" ? `INR ${item.netFeesInr}` : "-")}</td>
          <td>${escapeHtml(item.installmentEmiOption ? "Yes" : "No")}</td>
          <td>${escapeHtml(item.location || "-")}</td>
          <td>${escapeHtml(String(item.maximumSeatsBatchSize ?? "-"))}</td>
          <td>${escapeHtml(item.currentAvailability || "-")}</td>
          <td>${escapeHtml(getExportSafeMediaValue(item.trainingImage))}</td>
          <td>${escapeHtml(item.trainerInstructorName || "-")}</td>
          <td>${escapeHtml(getExportSafeMediaValue(item.trainerImage))}</td>
          <td>${escapeHtml(truncate(item.trainerExperience))}</td>
          <td>${escapeHtml(item.languageOfDelivery || "-")}</td>
          <td>${escapeHtml(truncate(item.whatsIncluded))}</td>
          <td>${escapeHtml(truncate(item.whatsNotIncluded))}</td>
          <td>${escapeHtml(truncate(item.learningOutcomes))}</td>
          <td>${escapeHtml(item.courseDemoVideo || "-")}</td>
          <td>${escapeHtml(
            item.brochurePdfDownload?.length
              ? item.brochurePdfDownload.map((file) => getExportSafeMediaValue(file)).join(", ")
              : "-"
          )}</td>
          <td>${escapeHtml(truncate(item.refundCancellationPolicy))}</td>
          <td>${escapeHtml(truncate(item.postTrainingSupport))}</td>
          <td>${escapeHtml(item.contactForQueries || "-")}</td>
          <td>${escapeHtml(formatDate(item.createdAt))}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Workshop Trainings</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Workshop Trainings</h2>
          <table>
            <thead>
              <tr>
                <th>Training</th>
                <th>Code</th>
                <th>Type</th>
                <th>HSN Code</th>
                <th>Discount %</th>
                <th>Institute</th>
                <th>Duration</th>
                <th>Mode</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reg. Deadline</th>
                <th>Curriculum</th>
                <th>Target Audience</th>
                <th>Certification</th>
                <th>Affiliation</th>
                <th>Fee</th>
                <th>Discount Voucher</th>
                <th>Net Fee</th>
                <th>EMI Option</th>
                <th>Location</th>
                <th>Max Seats</th>
                <th>Availability</th>
                <th>Training Image</th>
                <th>Trainer</th>
                <th>Trainer Image</th>
                <th>Trainer Experience</th>
                <th>Language</th>
                <th>What's Included</th>
                <th>What's Not Included</th>
                <th>Learning Outcomes</th>
                <th>Demo Video</th>
                <th>Brochures</th>
                <th>Refund Policy</th>
                <th>Post-Training Support</th>
                <th>Contact</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Are you sure you want to delete this workshop training?", { danger: true }))) return;

    try {
      const res = await fetch(`${API_URL}/workshop-trainings/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to delete workshop training");
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success("Workshop training deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete workshop training");
    }
  };

  const handleEdit = (item: WorkshopTraining) => {
    setEditingItem(item);
    setEditImagePreview("");
    setEditTrainerPreview("");
    setEditForm({
      trainingName: item.trainingName || "",
      trainingType: item.trainingType || [],
      hsnCode: item.hsnCode || "",
      discountPercent: typeof item.discountPercent === "number" ? String(item.discountPercent) : "",
      instituteName: item.instituteName || "",
      trainingDuration: item.trainingDuration || "",
      modeOfTraining: item.modeOfTraining || "",
      startDate: toDateInputValue(item.startDate),
      endDate: toDateInputValue(item.endDate),
      registrationDeadline: toDateInputValue(item.registrationDeadline),
      curriculumTopicsCovered: item.curriculumTopicsCovered || "",
      targetAudienceText: (item.targetAudience || []).join(", "),
      certificationProvided: item.certificationProvided || "",
      affiliationAccreditation: item.affiliationAccreditation || "",
      feesInr: typeof item.feesInr === "number" ? String(item.feesInr) : "",
      applyDiscountVoucher: !!item.applyDiscountVoucher,
      netFeesInr: typeof item.netFeesInr === "number" ? String(item.netFeesInr) : "",
      installmentEmiOption: !!item.installmentEmiOption,
      location: item.location || "",
      maximumSeatsBatchSize:
        typeof item.maximumSeatsBatchSize === "number" ? String(item.maximumSeatsBatchSize) : "",
      currentAvailability: item.currentAvailability || "",
      trainerInstructorName: item.trainerInstructorName || "",
      trainerExperience: item.trainerExperience || "",
      languageOfDelivery: item.languageOfDelivery || "",
      whatsIncluded: item.whatsIncluded || "",
      whatsNotIncluded: item.whatsNotIncluded || "",
      learningOutcomes: item.learningOutcomes || "",
      courseDemoVideo: item.courseDemoVideo || "",
      refundCancellationPolicy: item.refundCancellationPolicy || "",
      postTrainingSupport: item.postTrainingSupport || "",
      contactForQueries: item.contactForQueries || "",
      trainingImage: null,
      trainerImage: null,
      brochurePdfDownload: [],
    });
    setEditError("");
  };

  const setEditValue = (key: keyof WorkshopTrainingEditForm, value: any) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEditTrainingType = (name: string) => {
    setEditForm((prev) => ({
      ...prev,
      trainingType: prev.trainingType.includes(name)
        ? prev.trainingType.filter((item) => item !== name)
        : [...prev.trainingType, name],
    }));
  };

  const onEditImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || file.size > 1 * 1024 * 1024) {
      setEditError("Training image must be JPG, JPEG, PNG, or WEBP and <= 1MB");
      return;
    }

    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(URL.createObjectURL(file));
    setEditValue("trainingImage", file);
  };

  const onEditTrainerImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || file.size > 1 * 1024 * 1024) {
      setEditError("Trainer photo must be JPG, JPEG, PNG, or WEBP and <= 1MB");
      return;
    }

    if (editTrainerPreview) URL.revokeObjectURL(editTrainerPreview);
    setEditTrainerPreview(URL.createObjectURL(file));
    setEditValue("trainerImage", file);
  };

  const onEditBrochures = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (files.some((file) => file.type !== "application/pdf")) {
      setEditError("Only PDF files are allowed for brochures");
      return;
    }

    setEditValue("brochurePdfDownload", [...editForm.brochurePdfDownload, ...files]);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;

    if (!editForm.trainingName.trim()) {
      setEditError("Training name is required");
      return;
    }
    if (!editForm.instituteName.trim()) {
      setEditError("Institute name is required");
      return;
    }
    if (!editForm.netFeesInr.trim()) {
      setEditError("Net Fees (INR) is required");
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const payload = new FormData();

      payload.append("trainingName", editForm.trainingName.trim());
      editForm.trainingType.forEach((type) => payload.append("trainingType", type));
      payload.append("hsnCode", editForm.hsnCode.trim());
      payload.append("discountPercent", editForm.discountPercent);
      payload.append("instituteName", editForm.instituteName.trim());
      payload.append("trainingDuration", editForm.trainingDuration.trim());
      payload.append("modeOfTraining", editForm.modeOfTraining.trim());
      payload.append("startDate", editForm.startDate);
      payload.append("endDate", editForm.endDate);
      payload.append("registrationDeadline", editForm.registrationDeadline);
      payload.append("curriculumTopicsCovered", editForm.curriculumTopicsCovered.trim());
      payload.append(
        "targetAudience",
        JSON.stringify(
          editForm.targetAudienceText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );
      payload.append("certificationProvided", editForm.certificationProvided);
      payload.append("affiliationAccreditation", editForm.affiliationAccreditation.trim());
      payload.append("feesInr", editForm.feesInr);
      payload.append("applyDiscountVoucher", String(editForm.applyDiscountVoucher));
      payload.append("netFeesInr", editForm.netFeesInr);
      payload.append("installmentEmiOption", String(editForm.installmentEmiOption));
      payload.append("location", editForm.location.trim());
      payload.append("maximumSeatsBatchSize", editForm.maximumSeatsBatchSize);
      payload.append("currentAvailability", editForm.currentAvailability.trim());
      payload.append("trainerInstructorName", editForm.trainerInstructorName.trim());
      payload.append("trainerExperience", editForm.trainerExperience.trim());
      payload.append("languageOfDelivery", editForm.languageOfDelivery);
      payload.append("whatsIncluded", editForm.whatsIncluded.trim());
      payload.append("whatsNotIncluded", editForm.whatsNotIncluded.trim());
      payload.append("learningOutcomes", editForm.learningOutcomes.trim());
      payload.append("courseDemoVideo", editForm.courseDemoVideo.trim());
      payload.append("refundCancellationPolicy", editForm.refundCancellationPolicy.trim());
      payload.append("postTrainingSupport", editForm.postTrainingSupport.trim());
      payload.append("contactForQueries", editForm.contactForQueries.trim());
      if (editForm.trainingImage) payload.append("trainingImage", editForm.trainingImage);
      if (editForm.trainerImage) payload.append("trainerImage", editForm.trainerImage);
      editForm.brochurePdfDownload.forEach((file) => payload.append("brochurePdfDownload", file));

      const res = await fetch(`${API_URL}/workshop-trainings/${editingItem._id}`, {
        method: "PUT",
        body: payload,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to update workshop training");

      setItems((prev) => prev.map((item) => (item._id === editingItem._id ? data : item)));
      setEditingItem(null);
      toast.success("Workshop training updated successfully");
    } catch (err: any) {
      setEditError(err?.message || "Failed to update workshop training");
    } finally {
      setSaving(false);
    }
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditForm(emptyEditForm);
    setEditImagePreview("");
    setEditTrainerPreview("");
    setEditError("");
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workshop trainings"
            style={{ ...inputStyle, maxWidth: 420 }}
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ ...inputStyle, maxWidth: 260 }}
          >
            <option value="all">All Training Types</option>
            {trainingTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={handleDownloadCSV} style={buttonStyle}>
            Download CSV
          </button>
          <button type="button" onClick={handleDownloadPDF} style={buttonStyle}>
            Download PDF
          </button>
        </div>
      </div>

      {error ? <p style={errorStyle}>{error}</p> : null}
      {loading ? <p style={{ margin: 0 }}>Loading workshop trainings...</p> : null}

      {!loading && filteredItems.length === 0 ? (
        <p style={{ margin: 0, color: "#64748b" }}>No workshop trainings found.</p>
      ) : null}

      {!loading && filteredItems.length > 0 ? (
        <>
          <BulkSelectBar
            endpointPath="workshop-trainings"
            selectedIds={Array.from(bulkSelection.selectedIds)}
            noun="workshop trainings"
            canDelete={canDelete}
            onClear={bulkSelection.clear}
            onDeleted={(deletedIds) => {
              setItems((prev) => prev.filter((item) => !deletedIds.includes(item._id)));
              bulkSelection.removeIds(deletedIds);
            }}
          />
          <div className={bulkStyles.tableScroll}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {canDelete && (
                  <th style={theadStyle} className={bulkStyles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = bulkSelection.isSomeSelected;
                      }}
                      onChange={bulkSelection.toggleAll}
                      aria-label="Select all workshop trainings on this page"
                    />
                  </th>
                )}
                <th style={theadStyle}>Training</th>
                <th style={theadStyle}>Code</th>
                <th style={theadStyle}>Type</th>
                <th style={theadStyle}>HSN Code</th>
                <th style={theadStyle}>Discount %</th>
                <th style={theadStyle}>Institute</th>
                <th style={theadStyle}>Duration</th>
                <th style={theadStyle}>Mode</th>
                <th style={theadStyle}>Start Date</th>
                <th style={theadStyle}>End Date</th>
                <th style={theadStyle}>Reg. Deadline</th>
                <th style={theadStyle}>Curriculum</th>
                <th style={theadStyle}>Target Audience</th>
                <th style={theadStyle}>Certification</th>
                <th style={theadStyle}>Affiliation</th>
                <th style={theadStyle}>Fee</th>
                <th style={theadStyle}>Discount Voucher</th>
                <th style={theadStyle}>Net Fee</th>
                <th style={theadStyle}>EMI Option</th>
                <th style={theadStyle}>Location</th>
                <th style={theadStyle}>Max Seats</th>
                <th style={theadStyle}>Availability</th>
                <th style={theadStyle}>Training Image</th>
                <th style={theadStyle}>Trainer</th>
                <th style={theadStyle}>Trainer Image</th>
                <th style={theadStyle}>Trainer Experience</th>
                <th style={theadStyle}>Language</th>
                <th style={theadStyle}>What's Included</th>
                <th style={theadStyle}>What's Not Included</th>
                <th style={theadStyle}>Learning Outcomes</th>
                <th style={theadStyle}>Demo Video</th>
                <th style={theadStyle}>Brochures</th>
                <th style={theadStyle}>Refund Policy</th>
                <th style={theadStyle}>Post-Training Support</th>
                <th style={theadStyle}>Contact</th>
                <th style={theadStyle}>Created</th>
                <th style={theadStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id}>
                  {canDelete && (
                    <td style={thTdStyle} className={bulkStyles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(item._id)}
                        onChange={() => bulkSelection.toggle(item._id)}
                        aria-label={`Select ${item.trainingName}`}
                      />
                    </td>
                  )}
                  <td style={thTdStyle}>{item.trainingName || "-"}</td>
                  <td style={thTdStyle}>{item.trainingUniqueCode || "-"}</td>
                  <td style={thTdStyle}>{(item.trainingType || []).join(", ") || "-"}</td>
                  <td style={thTdStyle}>{item.hsnCode || "-"}</td>
                  <td style={thTdStyle}>
                    {typeof item.discountPercent === "number" ? `${item.discountPercent}%` : "-"}
                  </td>
                  <td style={thTdStyle}>{item.instituteName || "-"}</td>
                  <td style={thTdStyle}>{item.trainingDuration || "-"}</td>
                  <td style={thTdStyle}>{item.modeOfTraining || "-"}</td>
                  <td style={thTdStyle}>{formatDate(item.startDate)}</td>
                  <td style={thTdStyle}>{formatDate(item.endDate)}</td>
                  <td style={thTdStyle}>{formatDate(item.registrationDeadline)}</td>
                  <td style={thTdStyle}>{truncate(item.curriculumTopicsCovered)}</td>
                  <td style={thTdStyle}>{(item.targetAudience || []).join(", ") || "-"}</td>
                  <td style={thTdStyle}>{item.certificationProvided || "-"}</td>
                  <td style={thTdStyle}>{truncate(item.affiliationAccreditation)}</td>
                  <td style={thTdStyle}>
                    {typeof item.feesInr === "number" ? `INR ${item.feesInr}` : "-"}
                  </td>
                  <td style={thTdStyle}>{item.applyDiscountVoucher ? "Yes" : "No"}</td>
                  <td style={thTdStyle}>
                    {typeof item.netFeesInr === "number" ? `INR ${item.netFeesInr}` : "-"}
                  </td>
                  <td style={thTdStyle}>{item.installmentEmiOption ? "Yes" : "No"}</td>
                  <td style={thTdStyle}>{item.location || "-"}</td>
                  <td style={thTdStyle}>{item.maximumSeatsBatchSize ?? "-"}</td>
                  <td style={thTdStyle}>{item.currentAvailability || "-"}</td>
                  <td style={thTdStyle}>
                    {item.trainingImage ? (
                      <img
                        src={resolveMediaUrl(item.trainingImage) || item.trainingImage}
                        alt={item.trainingName || "Training"}
                        style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={thTdStyle}>{item.trainerInstructorName || "-"}</td>
                  <td style={thTdStyle}>
                    {item.trainerImage ? (
                      <img
                        src={resolveMediaUrl(item.trainerImage) || item.trainerImage}
                        alt={item.trainerInstructorName || "Trainer"}
                        style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={thTdStyle}>{truncate(item.trainerExperience)}</td>
                  <td style={thTdStyle}>{item.languageOfDelivery || "-"}</td>
                  <td style={thTdStyle}>{truncate(item.whatsIncluded)}</td>
                  <td style={thTdStyle}>{truncate(item.whatsNotIncluded)}</td>
                  <td style={thTdStyle}>{truncate(item.learningOutcomes)}</td>
                  <td style={thTdStyle}>
                    {item.courseDemoVideo ? (
                      <a href={item.courseDemoVideo} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={thTdStyle}>
                    {item.brochurePdfDownload?.length ? (
                      <a
                        href={resolveMediaUrl(item.brochurePdfDownload[0]) || item.brochurePdfDownload[0]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.brochurePdfDownload.length} file
                        {item.brochurePdfDownload.length > 1 ? "s" : ""}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={thTdStyle}>{truncate(item.refundCancellationPolicy)}</td>
                  <td style={thTdStyle}>{truncate(item.postTrainingSupport)}</td>
                  <td style={thTdStyle}>{item.contactForQueries || "-"}</td>
                  <td style={thTdStyle}>{formatDate(item.createdAt)}</td>
                  <td style={thTdStyle}>
                    <TableActions
                      onView={() => setViewItem(item)}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => handleDelete(item._id)}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : null}

      {/* ================= VIEW MODAL ================= */}
      {viewItem && (
        <div
          onClick={() => setViewItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 960,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 4,
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#111827" }}>
                  {viewItem.trainingName}
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Code: {viewItem.trainingUniqueCode || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewItem(null)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: 999,
                  width: 32,
                  height: 32,
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: "pointer",
                  color: "#334155",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 20px" }}>
              {(viewItem.trainingType || []).map((type) => (
                <span
                  key={type}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(13, 93, 143, 0.12)",
                    color: "#0d5d8f",
                  }}
                >
                  {type}
                </span>
              ))}
              {viewItem.certificationProvided === "Yes" && (
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(22, 163, 74, 0.12)",
                    color: "#15803d",
                  }}
                >
                  Certification Provided
                </span>
              )}
              {viewItem.installmentEmiOption && (
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(245, 158, 11, 0.14)",
                    color: "#b45309",
                  }}
                >
                  EMI Available
                </span>
              )}
            </div>

            {viewItem.trainingImage && (
              <img
                src={resolveMediaUrl(viewItem.trainingImage) || viewItem.trainingImage}
                alt={viewItem.trainingName}
                style={{
                  width: "100%",
                  maxHeight: 260,
                  objectFit: "cover",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  marginBottom: 20,
                }}
              />
            )}

            <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
              Workshop Basics
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <InfoCard label="Institute Name" value={viewItem.instituteName || "-"} />
              <InfoCard label="HSN Code" value={viewItem.hsnCode || "-"} />
              <InfoCard label="Training Duration" value={viewItem.trainingDuration || "-"} />
              <InfoCard label="Mode of Training" value={viewItem.modeOfTraining || "-"} />
              <InfoCard label="Start Date" value={formatDate(viewItem.startDate)} />
              <InfoCard label="End Date" value={formatDate(viewItem.endDate)} />
              <InfoCard label="Registration Deadline" value={formatDate(viewItem.registrationDeadline)} />
              <InfoCard label="Target Audience" value={(viewItem.targetAudience || []).join(", ") || "-"} />
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
              Fees &amp; Availability
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <InfoCard label="Fees (INR)" value={typeof viewItem.feesInr === "number" ? `₹${viewItem.feesInr}` : "-"} />
              <InfoCard label="Net Fees (INR)" value={typeof viewItem.netFeesInr === "number" ? `₹${viewItem.netFeesInr}` : "-"} />
              <InfoCard label="Discount %" value={typeof viewItem.discountPercent === "number" ? `${viewItem.discountPercent}%` : "-"} />
              <InfoCard label="Discount Voucher" value={viewItem.applyDiscountVoucher ? "Yes" : "No"} />
              <InfoCard label="Maximum Seats / Batch" value={viewItem.maximumSeatsBatchSize ?? "-"} />
              <InfoCard label="Current Availability" value={viewItem.currentAvailability || "-"} />
              <InfoCard label="Location" value={viewItem.location || "-"} />
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
              Instructor
            </h4>
            {viewItem.trainerImage && (
              <img
                src={resolveMediaUrl(viewItem.trainerImage) || viewItem.trainerImage}
                alt={viewItem.trainerInstructorName || "Trainer"}
                style={{
                  width: 84,
                  height: 84,
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: "1px solid #e5e7eb",
                  marginBottom: 12,
                }}
              />
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <InfoCard label="Trainer / Instructor Name" value={viewItem.trainerInstructorName || "-"} />
              <InfoCard label="Trainer Experience" value={viewItem.trainerExperience || "-"} />
              <InfoCard label="Language of Delivery" value={viewItem.languageOfDelivery || "-"} />
              <InfoCard label="Affiliation / Accreditation" value={viewItem.affiliationAccreditation || "-"} />
            </div>

            {[
              ["Curriculum / Topics Covered", viewItem.curriculumTopicsCovered],
              ["What's Included", viewItem.whatsIncluded],
              ["What's Not Included", viewItem.whatsNotIncluded],
              ["Learning Outcomes", viewItem.learningOutcomes],
              ["Refund / Cancellation Policy", viewItem.refundCancellationPolicy],
              ["Post-Training Support", viewItem.postTrainingSupport],
              ["Contact for Queries", viewItem.contactForQueries],
            ].map(([label, value]) =>
              value ? (
                <div key={label} style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                    {label}
                  </h4>
                  <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {value}
                  </div>
                </div>
              ) : null
            )}

            {viewItem.courseDemoVideo && (
              <p style={{ fontSize: 14 }}>
                <b>Course Demo Video:</b>{" "}
                <a href={viewItem.courseDemoVideo} target="_blank" rel="noreferrer">
                  {viewItem.courseDemoVideo}
                </a>
              </p>
            )}

            {viewItem.brochurePdfDownload && viewItem.brochurePdfDownload.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                  Brochures
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {viewItem.brochurePdfDownload.map((file, index) => (
                    <a
                      key={index}
                      href={resolveMediaUrl(file) || file}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 13, color: "#0d5d8f", fontWeight: 700 }}
                    >
                      Brochure {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button type="button" onClick={() => setViewItem(null)} style={buttonStyle}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editingItem && (
        <div
          onClick={closeEditModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={formStyles.container}
            style={{ margin: 0, width: "100%", maxWidth: 1100, maxHeight: "92vh", overflowY: "auto" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h1 className={formStyles.heading} style={{ margin: 0 }}>
                Edit Workshop Training
              </h1>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "#f1f5f9",
                  borderRadius: 999,
                  width: 36,
                  height: 36,
                  fontSize: 18,
                  fontWeight: 800,
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                ×
              </button>
            </div>

            {editError ? <p className={formStyles.error}>{editError}</p> : null}

            <form onSubmit={handleEditSubmit} className={formStyles.form}>
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Workshop Basics</h3>
                <div className={formStyles.fieldGrid}>
                  <Field label="Training Name" required>
                    <input
                      className={formStyles.input}
                      value={editForm.trainingName}
                      onChange={(e) => setEditValue("trainingName", e.target.value)}
                    />
                  </Field>

                  <Field label="Training Unique Code">
                    <input
                      className={`${formStyles.input} ${formStyles.readOnlyInput}`}
                      value={editingItem.trainingUniqueCode || ""}
                      readOnly
                    />
                  </Field>

                  <Field label="Workshop Main Image (shown on the workshop header/banner)" full>
                    <div className={formStyles.uploadBox}>
                      <input
                        className={formStyles.input}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onEditImage}
                      />
                    </div>
                    {editImagePreview ? (
                      <img className={formStyles.preview} src={editImagePreview} alt="Workshop preview" />
                    ) : editingItem.trainingImage ? (
                      <img
                        className={formStyles.preview}
                        src={resolveMediaUrl(editingItem.trainingImage) || editingItem.trainingImage}
                        alt="Current workshop"
                      />
                    ) : (
                      <p className={formStyles.noImage}>No workshop image uploaded</p>
                    )}
                  </Field>

                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Training Type</label>
                    <div className={formStyles.checkboxScrollBox}>
                      {trainingTypes.length === 0 ? (
                        <span>No training types available.</span>
                      ) : (
                        trainingTypes.map((option) => (
                          <label key={option._id} style={{ display: "block", marginBottom: 8, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={editForm.trainingType.includes(option.name)}
                              onChange={() => toggleEditTrainingType(option.name)}
                            />{" "}
                            {option.name}
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <Field label="HSN Code">
                    <input
                      className={formStyles.input}
                      value={editForm.hsnCode}
                      onChange={(e) => setEditValue("hsnCode", e.target.value)}
                    />
                  </Field>

                  <Field label="Institute Name" required>
                    <input
                      className={formStyles.input}
                      value={editForm.instituteName}
                      onChange={(e) => setEditValue("instituteName", e.target.value.replace(/[^A-Za-z ]/g, ""))}
                    />
                  </Field>
                  <Field label="Training Duration">
                    <input
                      className={formStyles.input}
                      value={editForm.trainingDuration}
                      onChange={(e) => setEditValue("trainingDuration", e.target.value)}
                    />
                  </Field>
                  <Field label="Mode of Training">
                    <input
                      className={formStyles.input}
                      value={editForm.modeOfTraining}
                      onChange={(e) => setEditValue("modeOfTraining", e.target.value)}
                    />
                  </Field>
                  <Field label="Start Date">
                    <input
                      type="date"
                      className={formStyles.input}
                      value={editForm.startDate}
                      onChange={(e) => setEditValue("startDate", e.target.value)}
                    />
                  </Field>
                  <Field label="End Date">
                    <input
                      type="date"
                      className={formStyles.input}
                      value={editForm.endDate}
                      onChange={(e) => setEditValue("endDate", e.target.value)}
                    />
                  </Field>
                  <Field label="Registration Deadline">
                    <input
                      type="date"
                      className={formStyles.input}
                      value={editForm.registrationDeadline}
                      onChange={(e) => setEditValue("registrationDeadline", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Training Content</h3>
                <Field label="Curriculum / Topics Covered" full>
                  <textarea
                    className={formStyles.textarea}
                    value={editForm.curriculumTopicsCovered}
                    onChange={(e) => setEditValue("curriculumTopicsCovered", e.target.value)}
                  />
                </Field>
                <div className={formStyles.fieldGrid}>
                  <Field label="Target Audience">
                    <input
                      className={formStyles.input}
                      value={editForm.targetAudienceText}
                      onChange={(e) => setEditValue("targetAudienceText", e.target.value)}
                      placeholder="Comma separated audiences"
                    />
                  </Field>
                  <Field label="Certification Provided">
                    <select
                      className={formStyles.select}
                      value={editForm.certificationProvided}
                      onChange={(e) => setEditValue("certificationProvided", e.target.value)}
                    >
                      <option value="">Select</option>
                      {yesNo.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Affiliation / Accreditation" full>
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.affiliationAccreditation}
                      onChange={(e) => setEditValue("affiliationAccreditation", e.target.value)}
                    />
                  </Field>
                  <Field label="Fees (INR)">
                    <input
                      className={formStyles.input}
                      value={editForm.feesInr}
                      onChange={(e) => setEditValue("feesInr", e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>
                  <Field label="Net Fees (INR)" required>
                    <input
                      className={formStyles.input}
                      value={editForm.netFeesInr}
                      onChange={(e) => setEditValue("netFeesInr", e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>
                  <Field label="Discount %">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className={formStyles.input}
                      value={editForm.discountPercent}
                      onChange={(e) => setEditValue("discountPercent", e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>
                  <Field label="Maximum Seats / Batch Size">
                    <input
                      className={formStyles.input}
                      value={editForm.maximumSeatsBatchSize}
                      onChange={(e) => setEditValue("maximumSeatsBatchSize", e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>
                  <Field label="Location (for offline)">
                    <input
                      className={formStyles.input}
                      value={editForm.location}
                      onChange={(e) => setEditValue("location", e.target.value)}
                    />
                  </Field>
                  <Field label="Current Availability">
                    <input
                      className={formStyles.input}
                      value={editForm.currentAvailability}
                      onChange={(e) => setEditValue("currentAvailability", e.target.value)}
                      placeholder="e.g. 5 seats left"
                    />
                  </Field>
                </div>

                <div style={{ display: "flex", gap: 24, padding: "12px 4px" }}>
                  <label className={formStyles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={editForm.applyDiscountVoucher}
                      onChange={(e) => setEditValue("applyDiscountVoucher", e.target.checked)}
                    />
                    Apply Discount Voucher
                  </label>
                  <label className={formStyles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={editForm.installmentEmiOption}
                      onChange={(e) => setEditValue("installmentEmiOption", e.target.checked)}
                    />
                    Installment / EMI Option
                  </label>
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Instructor &amp; Media</h3>
                <div className={formStyles.fieldGrid}>
                  <Field label="Trainer / Instructor Name">
                    <input
                      className={formStyles.input}
                      value={editForm.trainerInstructorName}
                      onChange={(e) =>
                        setEditValue("trainerInstructorName", e.target.value.replace(/[^A-Za-z ]/g, ""))
                      }
                    />
                  </Field>
                  <Field label="Trainer Experience" full>
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.trainerExperience}
                      onChange={(e) => setEditValue("trainerExperience", e.target.value)}
                    />
                  </Field>
                  <Field label="Language of Delivery">
                    <select
                      className={formStyles.select}
                      value={editForm.languageOfDelivery}
                      onChange={(e) => setEditValue("languageOfDelivery", e.target.value)}
                    >
                      <option value="">Select</option>
                      {languages.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Trainer / Instructor Photo">
                    <div className={formStyles.uploadBox}>
                      <input
                        className={formStyles.input}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onEditTrainerImage}
                      />
                    </div>
                    {editTrainerPreview ? (
                      <img className={formStyles.preview} src={editTrainerPreview} alt="Trainer preview" />
                    ) : editingItem.trainerImage ? (
                      <img
                        className={formStyles.preview}
                        src={resolveMediaUrl(editingItem.trainerImage) || editingItem.trainerImage}
                        alt="Current trainer"
                      />
                    ) : (
                      <p className={formStyles.noImage}>No trainer photo uploaded</p>
                    )}
                  </Field>
                  <Field label="Course Demo Video (Optional)" full>
                    <input
                      className={formStyles.input}
                      value={editForm.courseDemoVideo}
                      onChange={(e) => setEditValue("courseDemoVideo", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Training Details</h3>
                <div className={formStyles.fieldGrid}>
                  <Field label="What's Included">
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.whatsIncluded}
                      onChange={(e) => setEditValue("whatsIncluded", e.target.value)}
                    />
                  </Field>
                  <Field label="What's Not Included">
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.whatsNotIncluded}
                      onChange={(e) => setEditValue("whatsNotIncluded", e.target.value)}
                    />
                  </Field>
                  <Field label="Learning Outcomes" full>
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.learningOutcomes}
                      onChange={(e) => setEditValue("learningOutcomes", e.target.value)}
                    />
                  </Field>
                  <Field label="Refund / Cancellation Policy" full>
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.refundCancellationPolicy}
                      onChange={(e) => setEditValue("refundCancellationPolicy", e.target.value)}
                    />
                  </Field>
                  <Field label="Post-Training Support" full>
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.postTrainingSupport}
                      onChange={(e) => setEditValue("postTrainingSupport", e.target.value)}
                    />
                  </Field>
                  <Field label="Contact for Queries" full>
                    <textarea
                      className={formStyles.textarea}
                      value={editForm.contactForQueries}
                      onChange={(e) => setEditValue("contactForQueries", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Brochure Upload</h3>
                <Field label="Brochure / PDF Download" full>
                  <div className={formStyles.uploadBox}>
                    <input
                      className={formStyles.input}
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={onEditBrochures}
                    />
                  </div>
                  <p className={formStyles.uploadHint}>
                    Uploading new brochure PDFs here will replace the existing ones.
                  </p>
                  <div className={formStyles.fileList}>
                    {editForm.brochurePdfDownload.length > 0
                      ? editForm.brochurePdfDownload.map((file) => (
                          <div className={formStyles.fileItem} key={file.name}>
                            <span className={formStyles.fileName}>{file.name}</span>
                          </div>
                        ))
                      : (editingItem.brochurePdfDownload || []).length > 0
                      ? editingItem.brochurePdfDownload!.map((file, index) => (
                          <div className={formStyles.fileItem} key={index}>
                            <span className={formStyles.fileName}>Existing brochure {index + 1}</span>
                          </div>
                        ))
                      : <p className={formStyles.noImage}>No brochure PDFs uploaded</p>}
                  </div>
                </Field>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button type="submit" className={formStyles.submitBtn} disabled={saving}>
                  {saving ? "Saving..." : "Update Workshop Training"}
                </button>
                <button
                  type="button"
                  className={formStyles.submitBtn}
                  style={{ background: "#e2e8f0", color: "#334155", boxShadow: "none" }}
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

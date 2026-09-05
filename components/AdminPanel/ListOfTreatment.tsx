"use client";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Dashboard/listoftreatment.module.css";
import { API_URL } from "@/config/api";
import editStyles from "@/styles/Dashboard/edittreatment.module.css";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";
import { resolveMediaUrl, getExportSafeMediaValue } from "@/lib/media";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface ClinicRef {
  _id: string;
  clinicName: string;
}

interface Treatment {
  _id: string;
  tuc?: string;
  slug?: string;
  treatmentName: string;
  description?: string;
  shortReelUrl?: string;
  serviceCategory?: string[];
  gender?: string;
  mrp?: number;
  offerPrice?: number;
  pricePerSession?: number;
  discountPercent?: number;
  sessions?: string;
  duration?: string;
  validity?: string;
  technologyUsed?: string;
  promoCode?: string;
  addToCart?: boolean;
  isActive?: boolean;
  createdAt?: string;
  clinic?: ClinicRef[];
  treatmentImages?: string[];
  beforeImages?: string[];
  afterImages?: string[];
}

interface ServiceCategory {
  _id: string;
  name: string;
}

interface TreatmentEditForm {
  treatmentName: string;
  clinicIds: string[];
  serviceCategory: string[];
  description: string;
  shortReelUrl: string;
  mrp: string;
  offerPrice: string;
  pricePerSession: string;
  discountPercent: string;
  sessions: string;
  duration: string;
  validity: string;
  technologyUsed: string;
  gender: "Unisex" | "Male" | "Female";
  promoCode: string;
  addToCart: boolean;
  isActive: boolean;
}

const emptyEditForm: TreatmentEditForm = {
  treatmentName: "",
  clinicIds: [],
  serviceCategory: [],
  description: "",
  shortReelUrl: "",
  mrp: "",
  offerPrice: "",
  pricePerSession: "",
  discountPercent: "",
  sessions: "",
  duration: "",
  validity: "",
  technologyUsed: "",
  gender: "Unisex",
  promoCode: "",
  addToCart: true,
  isActive: true,
};

type ListOfTreatmentProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

const ListOfTreatment = ({ canEdit = true, canDelete = true }: ListOfTreatmentProps) => {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [clinics, setClinics] = useState<ClinicRef[]>([]);
  const [search, setSearch] = useState("");
  const [filterClinic, setFilterClinic] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [editForm, setEditForm] = useState<TreatmentEditForm>(emptyEditForm);
  const [editTreatmentImages, setEditTreatmentImages] = useState<File[]>([]);
  const [editBeforeImages, setEditBeforeImages] = useState<File[]>([]);
  const [editAfterImages, setEditAfterImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTreatments();
    fetchServiceCategories();
    fetchClinics();
  }, []);

  const fetchTreatments = async () => {
    try {
      const res = await fetch(`${API_URL}/treatment-plans?includeInactive=true`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTreatments(
          data.map((treatment: any) => ({
            ...treatment,
            // Normalize serviceCategory to always be an array, regardless
            // of whether the backend (or older records) stored it as a
            // single string.
            serviceCategory: Array.isArray(treatment.serviceCategory)
              ? treatment.serviceCategory
              : treatment.serviceCategory
              ? [treatment.serviceCategory]
              : [],
            clinic: Array.isArray(treatment.clinic) ? treatment.clinic : [],
          }))
        );
      } else {
        setError("Invalid data format");
      }
    } catch (err) {
      setError("Failed to fetch treatments");
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/service-categories`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setServiceCategories(
          data
            .map((cat: any) => ({
              _id: String(cat._id || cat.id || "").trim(),
              name: String(cat.name || "").trim(),
            }))
            .filter((cat: ServiceCategory) => cat._id && cat.name)
        );
      }
    } catch (err) {
      console.error("Failed to fetch service categories", err);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await fetch(`${API_URL}/clinics`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setClinics(
          data
            .map((clinic: any) => ({
              _id: String(clinic._id || "").trim(),
              clinicName: String(clinic.clinicName || "").trim(),
            }))
            .filter((clinic: ClinicRef) => clinic._id && clinic.clinicName)
        );
      }
    } catch (err) {
      console.error("Failed to fetch clinics", err);
    }
  };

  const filteredTreatments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return treatments.filter((treatment) => {
      const clinicNames = (treatment.clinic || [])
        .map((c) => c.clinicName)
        .join(" ");
      const categoryText = (treatment.serviceCategory || []).join(" ");
      const isQueryMatch =
        treatment.treatmentName.toLowerCase().includes(query) ||
        clinicNames.toLowerCase().includes(query) ||
        categoryText.toLowerCase().includes(query);

      const isClinicMatch =
        filterClinic === "all" ||
        (treatment.clinic || []).some((c) => c._id === filterClinic);

      return isQueryMatch && isClinicMatch;
    });
  }, [treatments, search, filterClinic]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTreatments.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterClinic, itemsPerPage]);

  const clinicNamesFor = (treatment: Treatment) =>
    (treatment.clinic || []).map((c) => c.clinicName).join(", ") || "-";

  const stripHtmlToText = (value: string | undefined, maxLength = 60) => {
    if (!value) return "-";
    const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  };

  const handleDownloadCSV = () => {
    const rows = [
      [
        "Code",
        "Image",
        "Treatment Name",
        "Clinic",
        "Category",
        "Gender",
        "Description",
        "Short Reel",
        "MRP",
        "Offer",
        "Price/Session",
        "Discount %",
        "Sessions",
        "Duration",
        "Validity",
        "Technology",
        "Promo Code",
        "Add To Cart",
        "Created",
        "Status",
      ],
      ...filteredTreatments.map((treatment) => [
        treatment.tuc || "-",
        getExportSafeMediaValue(treatment.treatmentImages?.[0]),
        treatment.treatmentName || "",
        clinicNamesFor(treatment),
        (treatment.serviceCategory || []).join(", "),
        treatment.gender || "",
        stripHtmlToText(treatment.description),
        treatment.shortReelUrl || "-",
        treatment.mrp ?? "",
        treatment.offerPrice ?? "",
        treatment.pricePerSession ?? "-",
        treatment.discountPercent ? `${treatment.discountPercent}%` : "-",
        treatment.sessions || "-",
        treatment.duration || "-",
        treatment.validity || "-",
        treatment.technologyUsed || "-",
        treatment.promoCode || "-",
        treatment.addToCart === false ? "No" : "Yes",
        treatment.createdAt ? String(treatment.createdAt).slice(0, 10) : "-",
        treatment.isActive === false ? "Inactive" : "Active",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "treatment-plans.csv";
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

    const rows = filteredTreatments
      .map(
        (treatment) => `<tr>
          <td>${escapeHtml(treatment.tuc || "-")}</td>
          <td>${escapeHtml(getExportSafeMediaValue(treatment.treatmentImages?.[0]))}</td>
          <td>${escapeHtml(treatment.treatmentName || "-")}</td>
          <td>${escapeHtml(clinicNamesFor(treatment))}</td>
          <td>${escapeHtml(
            (treatment.serviceCategory || []).join(", ") || "-"
          )}</td>
          <td>${escapeHtml(treatment.gender || "-")}</td>
          <td>${escapeHtml(stripHtmlToText(treatment.description))}</td>
          <td>${escapeHtml(treatment.shortReelUrl || "-")}</td>
          <td>${escapeHtml(String(treatment.mrp ?? "-"))}</td>
          <td>${escapeHtml(String(treatment.offerPrice ?? "-"))}</td>
          <td>${escapeHtml(String(treatment.pricePerSession ?? "-"))}</td>
          <td>${escapeHtml(
            treatment.discountPercent ? `${treatment.discountPercent}%` : "-"
          )}</td>
          <td>${escapeHtml(treatment.sessions || "-")}</td>
          <td>${escapeHtml(treatment.duration || "-")}</td>
          <td>${escapeHtml(treatment.validity || "-")}</td>
          <td>${escapeHtml(treatment.technologyUsed || "-")}</td>
          <td>${escapeHtml(treatment.promoCode || "-")}</td>
          <td>${treatment.addToCart === false ? "No" : "Yes"}</td>
          <td>${escapeHtml(
            treatment.createdAt ? String(treatment.createdAt).slice(0, 10) : "-"
          )}</td>
          <td>${treatment.isActive === false ? "Inactive" : "Active"}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Treatment Plans</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Treatment Plans</h2>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Image</th>
                <th>Treatment</th>
                <th>Clinic</th>
                <th>Category</th>
                <th>Gender</th>
                <th>Description</th>
                <th>Short Reel</th>
                <th>MRP</th>
                <th>Offer</th>
                <th>Price/Session</th>
                <th>Discount %</th>
                <th>Sessions</th>
                <th>Duration</th>
                <th>Validity</th>
                <th>Technology</th>
                <th>Promo Code</th>
                <th>Add To Cart</th>
                <th>Created</th>
                <th>Status</th>
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
  const paginatedTreatments = filteredTreatments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const bulkSelection = useBulkSelection(paginatedTreatments, (t) => t._id);

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Are you sure you want to delete this treatment?", { danger: true }))) return;
    try {
      const res = await fetch(`${API_URL}/treatment-plans/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTreatments(treatments.filter((t) => t._id !== id));
      } else {
        setError("Failed to delete treatment");
      }
    } catch (err) {
      setError("Failed to delete treatment");
    }
  };

  const handleToggleStatus = async (treatment: Treatment) => {
    const nextIsActive = treatment.isActive === false;
    setError("");

    setTreatments((prev) =>
      prev.map((item) =>
        item._id === treatment._id ? { ...item, isActive: nextIsActive } : item
      )
    );

    try {
      const res = await fetch(`${API_URL}/treatment-plans/${treatment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update treatment status");
      }

      setTreatments((prev) =>
        prev.map((item) =>
          item._id === treatment._id
            ? {
                ...item,
                ...data,
                serviceCategory: Array.isArray(data?.serviceCategory)
                  ? data.serviceCategory
                  : item.serviceCategory,
                clinic: Array.isArray(data?.clinic) ? data.clinic : item.clinic,
              }
            : item
        )
      );
    } catch (err: any) {
      setTreatments((prev) =>
        prev.map((item) =>
          item._id === treatment._id
            ? { ...item, isActive: treatment.isActive !== false }
            : item
        )
      );
      setError(err?.message || "Failed to update treatment status");
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setEditForm({
      treatmentName: treatment.treatmentName || "",
      clinicIds: (treatment.clinic || []).map((c) => c._id),
      serviceCategory: treatment.serviceCategory || [],
      description: treatment.description || "",
      shortReelUrl: treatment.shortReelUrl || "",
      mrp: treatment.mrp != null ? String(treatment.mrp) : "",
      offerPrice: treatment.offerPrice != null ? String(treatment.offerPrice) : "",
      pricePerSession:
        treatment.pricePerSession != null ? String(treatment.pricePerSession) : "",
      discountPercent:
        treatment.discountPercent != null ? String(treatment.discountPercent) : "",
      sessions: treatment.sessions || "",
      duration: treatment.duration || "",
      validity: treatment.validity || "",
      technologyUsed: treatment.technologyUsed || "",
      gender: (treatment.gender as "Unisex" | "Male" | "Female") || "Unisex",
      promoCode: treatment.promoCode || "",
      addToCart: treatment.addToCart !== false,
      isActive: treatment.isActive !== false,
    });
    setEditTreatmentImages([]);
    setEditBeforeImages([]);
    setEditAfterImages([]);
    setError("");
  };

  const closeEdit = () => {
    setEditingTreatment(null);
    setEditForm(emptyEditForm);
    setEditTreatmentImages([]);
    setEditBeforeImages([]);
    setEditAfterImages([]);
  };

  const toggleEditCategory = (categoryName: string) => {
    setEditForm((prev) => {
      const exists = prev.serviceCategory.includes(categoryName);
      return {
        ...prev,
        serviceCategory: exists
          ? prev.serviceCategory.filter((c) => c !== categoryName)
          : [...prev.serviceCategory, categoryName],
      };
    });
  };

  const toggleEditClinic = (clinicId: string) => {
    setEditForm((prev) => {
      const exists = prev.clinicIds.includes(clinicId);
      return {
        ...prev,
        clinicIds: exists
          ? prev.clinicIds.filter((id) => id !== clinicId)
          : [...prev.clinicIds, clinicId],
      };
    });
  };

  const handleUpdate = async () => {
    if (!editingTreatment) return;
    if (!editForm.treatmentName.trim()) {
      setError("Treatment name is required");
      return;
    }
    if (editForm.serviceCategory.length === 0) {
      setError("Please select at least one category");
      return;
    }
    if (!editForm.offerPrice.trim()) {
      setError("Offer price is required");
      return;
    }

    const parsedMrp = editForm.mrp.trim() === "" ? undefined : Number(editForm.mrp);
    const parsedOffer = Number(editForm.offerPrice);
    const parsedPricePerSession =
      editForm.pricePerSession.trim() === ""
        ? undefined
        : Number(editForm.pricePerSession);
    const parsedDiscount =
      editForm.discountPercent.trim() === ""
        ? undefined
        : Number(editForm.discountPercent);

    if (
      (parsedMrp !== undefined && Number.isNaN(parsedMrp)) ||
      Number.isNaN(parsedOffer) ||
      (parsedPricePerSession !== undefined && Number.isNaN(parsedPricePerSession)) ||
      (parsedDiscount !== undefined && Number.isNaN(parsedDiscount))
    ) {
      setError("Price fields must be valid numbers");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData = new FormData();
      formData.append("treatmentName", editForm.treatmentName.trim());
      formData.append("clinic", JSON.stringify(editForm.clinicIds));
      formData.append("serviceCategory", JSON.stringify(editForm.serviceCategory));
      formData.append("description", editForm.description);
      formData.append("shortReelUrl", editForm.shortReelUrl);
      if (parsedMrp !== undefined) formData.append("mrp", String(parsedMrp));
      formData.append("offerPrice", String(parsedOffer));
      if (parsedPricePerSession !== undefined) {
        formData.append("pricePerSession", String(parsedPricePerSession));
      }
      if (parsedDiscount !== undefined) {
        formData.append("discountPercent", String(parsedDiscount));
      }
      formData.append("sessions", editForm.sessions);
      formData.append("duration", editForm.duration);
      formData.append("validity", editForm.validity);
      formData.append("technologyUsed", editForm.technologyUsed);
      formData.append("gender", editForm.gender);
      formData.append("promoCode", editForm.promoCode);
      formData.append("addToCart", String(editForm.addToCart));
      formData.append("isActive", String(editForm.isActive));
      editTreatmentImages.forEach((file) => formData.append("treatmentImages", file));
      editBeforeImages.forEach((file) => formData.append("beforeImages", file));
      editAfterImages.forEach((file) => formData.append("afterImages", file));

      const res = await fetch(
        `${API_URL}/treatment-plans/${editingTreatment._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (res.ok) {
        await fetchTreatments();
        closeEdit();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.message || "Failed to update treatment");
      }
    } catch (err) {
      setError("Failed to update treatment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* <h2 className={styles.title}>List of Treatments</h2> */}

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search treatments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <select
          value={filterClinic}
          onChange={(e) => setFilterClinic(e.target.value)}
          className={styles.filter}
        >
          <option value="all">All Clinics</option>
          {clinics.map((clinic) => (
            <option key={clinic._id} value={clinic._id}>
              {clinic.clinicName}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadCSV}
        >
          Download CSV
        </button>
        <button
          type="button"
          className={styles.premiumButton}
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <BulkSelectBar
        endpointPath="treatment-plans"
        selectedIds={Array.from(bulkSelection.selectedIds)}
        noun="treatment plans"
        canDelete={canDelete}
        onClear={bulkSelection.clear}
        onDeleted={(deletedIds) => {
          setTreatments((prev) => prev.filter((t) => !deletedIds.includes(t._id)));
          bulkSelection.removeIds(deletedIds);
        }}
      />

      <div className={`${styles.tableWrap} ${bulkStyles.tableScroll}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              {canDelete && (
                <th className={bulkStyles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={bulkSelection.isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = bulkSelection.isSomeSelected;
                    }}
                    onChange={bulkSelection.toggleAll}
                    aria-label="Select all treatment plans on this page"
                  />
                </th>
              )}
              <th>Code</th>
              <th>Image</th>
              <th>Treatment Name</th>
              <th>Clinic</th>
              <th>Category</th>
              <th>Gender</th>
              <th>Description</th>
              <th>Short Reel</th>
              <th>MRP</th>
              <th>Offer</th>
              <th>Price/Session</th>
              <th>Discount %</th>
              <th>Sessions</th>
              <th>Duration</th>
              <th>Validity</th>
              <th>Technology</th>
              <th>Promo Code</th>
              <th>Add To Cart</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTreatments.map((treatment) => (
              <tr key={treatment._id}>
                {canDelete && (
                  <td className={bulkStyles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isSelected(treatment._id)}
                      onChange={() => bulkSelection.toggle(treatment._id)}
                      aria-label={`Select ${treatment.treatmentName}`}
                    />
                  </td>
                )}
                <td>{treatment.tuc || "-"}</td>
                <td>
                  {treatment.treatmentImages?.length ? (
                    <img
                      src={resolveMediaUrl(treatment.treatmentImages[0]) || undefined}
                      alt={treatment.treatmentName}
                      width={44}
                      height={44}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>{treatment.treatmentName}</td>
                <td>{clinicNamesFor(treatment)}</td>
                <td>{(treatment.serviceCategory || []).join(", ") || "-"}</td>
                <td>{treatment.gender || "-"}</td>
                <td>{stripHtmlToText(treatment.description)}</td>
                <td>
                  {treatment.shortReelUrl ? (
                    <a href={treatment.shortReelUrl} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{treatment.mrp ?? "-"}</td>
                <td>{treatment.offerPrice ?? "-"}</td>
                <td>{treatment.pricePerSession ?? "-"}</td>
                <td>{treatment.discountPercent ? `${treatment.discountPercent}%` : "-"}</td>
                <td>{treatment.sessions || "-"}</td>
                <td>{treatment.duration || "-"}</td>
                <td>{treatment.validity || "-"}</td>
                <td>{treatment.technologyUsed || "-"}</td>
                <td>{treatment.promoCode || "-"}</td>
                <td>{treatment.addToCart === false ? "No" : "Yes"}</td>
                <td>{treatment.createdAt ? String(treatment.createdAt).slice(0, 10) : "-"}</td>
                <td>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${
                      treatment.isActive === false ? "" : styles.toggleSwitchOn
                    }`}
                    onClick={() => handleToggleStatus(treatment)}
                    aria-pressed={treatment.isActive !== false}
                    disabled={!canEdit}
                    title={
                      treatment.isActive === false
                        ? "Inactive. Click to activate"
                        : "Active. Click to deactivate"
                    }
                  >
                    <span className={styles.toggleKnob} />
                    <span className={styles.toggleText}>
                      {treatment.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </button>
                </td>
                <td>
                  <TableActions
                    onEdit={() => handleEdit(treatment)}
                    onDelete={() => handleDelete(treatment._id)}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            ))}
            {paginatedTreatments.length === 0 && (
            <tr>
              <td colSpan={canDelete ? 22 : 21}>No treatment plans found.</td>
            </tr>
          )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0 }}>
          Showing {paginatedTreatments.length} of {filteredTreatments.length}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === 1 ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span style={{ alignSelf: "center" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={`${styles.premiumButton} ${
              currentPage === totalPages ? styles.premiumButtonDisabled : ""
            }`}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {editingTreatment && (
        <div className={editStyles.container} style={{ marginTop: 40 }}>
          <h1 className={editStyles.heading}>Edit Treatment</h1>

          <form
            className={editStyles.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}
          >
            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Treatment Information</h2>

              <div className={editStyles.field}>
                <label className={editStyles.label}>
                  Treatment Name<span className={editStyles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={editForm.treatmentName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      treatmentName: e.target.value,
                    }))
                  }
                  className={editStyles.input}
                  placeholder="Treatment name"
                />
              </div>

              {/* ===== MULTI-SELECT CLINIC ===== */}
              <div className={editStyles.field}>
                <label className={editStyles.label}>
                  Clinic (select one or more)
                </label>
                <div className={editStyles.chipScrollBox}>
                  <div className={editStyles.chipRow}>
                    {clinics.length === 0 && (
                      <p className={editStyles.chipEmpty}>No clinics found.</p>
                    )}
                    {clinics.map((clinic) => {
                      const selected = editForm.clinicIds.includes(clinic._id);
                      return (
                        <button
                          key={clinic._id}
                          type="button"
                          onClick={() => toggleEditClinic(clinic._id)}
                          className={`${editStyles.chip} ${
                            selected ? editStyles.chipSelected : ""
                          }`}
                        >
                          {clinic.clinicName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Plan Description</label>
                <ReactQuill
                  value={editForm.description}
                  onChange={(value) =>
                    setEditForm((prev) => ({ ...prev, description: value }))
                  }
                />
              </div>
            </div>

            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Media & Visuals</h2>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Treatment Short Reel URL</label>
                <input
                  type="url"
                  value={editForm.shortReelUrl}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, shortReelUrl: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="https://..."
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>
                  Treatment Images ({(editingTreatment.treatmentImages || []).length}{" "}
                  current — choose files to replace)
                </label>
                <input
                  type="file"
                  multiple
                  className={editStyles.input}
                  onChange={(e) =>
                    setEditTreatmentImages(Array.from(e.target.files || []))
                  }
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>
                  Before Images ({(editingTreatment.beforeImages || []).length}{" "}
                  current — choose files to replace)
                </label>
                <input
                  type="file"
                  multiple
                  className={editStyles.input}
                  onChange={(e) =>
                    setEditBeforeImages(Array.from(e.target.files || []))
                  }
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>
                  After Images ({(editingTreatment.afterImages || []).length}{" "}
                  current — choose files to replace)
                </label>
                <input
                  type="file"
                  multiple
                  className={editStyles.input}
                  onChange={(e) =>
                    setEditAfterImages(Array.from(e.target.files || []))
                  }
                />
              </div>
            </div>

            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Category</h2>

              {/* ===== MULTI-SELECT CATEGORY ===== */}
              <div className={editStyles.field}>
                <label className={editStyles.label}>
                  Category (select one or more)
                </label>
                <div className={editStyles.chipScrollBox}>
                  <div className={editStyles.chipRow}>
                    {serviceCategories.map((cat) => {
                      const selected = editForm.serviceCategory.includes(cat.name);
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => toggleEditCategory(cat.name)}
                          className={`${editStyles.chip} ${
                            selected ? editStyles.chipSelected : ""
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {editForm.serviceCategory.length > 0 && (
                  <p className={editStyles.chipHint}>
                    Selected: {editForm.serviceCategory.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Pricing</h2>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Gross Price (MRP)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.mrp}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, mrp: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="MRP"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>
                  Offer Price<span className={editStyles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.offerPrice}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, offerPrice: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="Offer price"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Price Per Session</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.pricePerSession}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      pricePerSession: e.target.value,
                    }))
                  }
                  className={editStyles.input}
                  placeholder="Price per session"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Discount %</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.discountPercent}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      discountPercent: e.target.value,
                    }))
                  }
                  className={editStyles.input}
                  placeholder="Discount %"
                />
              </div>
            </div>

            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Treatment Details</h2>

              <div className={editStyles.field}>
                <label className={editStyles.label}>No. of Sessions</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.sessions}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      sessions: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className={editStyles.input}
                  placeholder="No. of sessions"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Treatment Duration</label>
                <input
                  type="text"
                  value={editForm.duration}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, duration: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="Duration"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Validity Period</label>
                <input
                  type="text"
                  value={editForm.validity}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, validity: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="Validity"
                />
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Technology Used</label>
                <input
                  type="text"
                  value={editForm.technologyUsed}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      technologyUsed: e.target.value,
                    }))
                  }
                  className={editStyles.input}
                  placeholder="Technology used"
                />
              </div>
            </div>

            <div className={editStyles.section}>
              <h2 className={editStyles.sectionTitle}>Meta & Admin</h2>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Gender Specific</label>
                <select
                  className={editStyles.select}
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      gender: e.target.value as "Unisex" | "Male" | "Female",
                    }))
                  }
                >
                  <option value="Unisex">Unisex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className={editStyles.field}>
                <label className={editStyles.label}>Promo Code</label>
                <input
                  type="text"
                  value={editForm.promoCode}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, promoCode: e.target.value }))
                  }
                  className={editStyles.input}
                  placeholder="Promo code"
                />
              </div>

              <div className={editStyles.switchRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.addToCart}
                    onChange={() =>
                      setEditForm((prev) => ({ ...prev, addToCart: !prev.addToCart }))
                    }
                  />
                  Add to Cart
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={() =>
                      setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                    }
                  />
                  Active
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className={editStyles.submitBtn} disabled={saving}>
                {saving ? "Updating..." : "Update Treatment"}
              </button>
              <button
                type="button"
                className={editStyles.cancelBtn}
                onClick={closeEdit}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ListOfTreatment;

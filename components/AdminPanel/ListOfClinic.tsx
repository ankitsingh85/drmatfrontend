"use client";
export const dynamic = "force-dynamic";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import styles from "@/styles/Dashboard/listofclinic.module.css";
import editStyles from "@/styles/Dashboard/editclinic.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import { useConfirm } from "@/context/ConfirmContext";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamicImport(() => import("react-quill"), { ssr: false });

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

type ClinicCategory = {
  _id: string;
  name: string;
};

type Doctor = {
  name: string;
  regNo: string;
  specialization: string;
};

type WorkingHours = {
  openTime: string;
  closeTime: string;
  days: string[];
  offDays: string[];
};

type Clinic = {
  _id: string;
  cuc: string;
  clinicName: string;
  slug?: string;
  clinicType?: string;
  ownerName?: string;
  website?: string;
  contactNumber?: string;
  whatsapp?: string;
  email: string;
  dermaCategory?: ClinicCategory;
  address: string;
  city?: string;
  services?: string;
  sector?: string;
  pincode?: string;
  mapLink?: string;
  clinicStatus?: string;
  verifiedBadge?: boolean;
  isActive?: boolean;
  doctors: Doctor[];
  workingHours?: WorkingHours;

  clinicLogo?: string;
  bannerImage?: string;
  rateCard?: string[];
  specialOffers?: string[];
  photos?: string[];
  certifications?: string[];
  video?: string;

  licenseNo?: string;
  experience?: string;
  treatmentsAvailable?: string;
  availableServices?: string;
  consultationFee?: string;
  bookingMode?: string;
  clinicDescription?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  standardPlanLink?: string;

  createdAt?: string;
  updatedAt?: string;

  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  approvedAt?: string;
};

type EditForm = {
  clinicName: string;
  dermaCategory: string;
  clinicType: string;
  ownerName: string;
  website: string;
  contactNumber: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  services: string;
  sector: string;
  pincode: string;
  mapLink: string;
  video: string;
  clinicDescription: string;
  licenseNo: string;
  experience: string;
  treatmentsAvailable: string;
  availableServices: string;
  consultationFee: string;
  bookingMode: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  standardPlanLink: string;
  clinicStatus: string;
  verifiedBadge: boolean;
};

const emptyEditForm: EditForm = {
  clinicName: "",
  dermaCategory: "",
  clinicType: "",
  ownerName: "",
  website: "",
  contactNumber: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  services: "",
  sector: "",
  pincode: "",
  mapLink: "",
  video: "",
  clinicDescription: "",
  licenseNo: "",
  experience: "",
  treatmentsAvailable: "",
  availableServices: "",
  consultationFee: "",
  bookingMode: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  standardPlanLink: "",
  clinicStatus: "Open",
  verifiedBadge: false,
};

type ListOfClinicProps = {
  canEdit?: boolean;
  canDelete?: boolean;
};

function ListOfClinic({ canEdit = true, canDelete = true }: ListOfClinicProps) {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [editDoctors, setEditDoctors] = useState<Doctor[]>([]);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [editDoctorForm, setEditDoctorForm] = useState<Doctor>({
    name: "",
    regNo: "",
    specialization: "",
  });

  const [editWorkingHours, setEditWorkingHours] = useState<WorkingHours>({
    openTime: "",
    closeTime: "",
    days: [],
    offDays: [],
  });

  // "Kept" existing media URLs (removable) — merged server-side with any
  // newly uploaded files instead of wiping the field on every save.
  const [editKeptLogo, setEditKeptLogo] = useState("");
  const [editKeptBanner, setEditKeptBanner] = useState("");
  const [editKeptRateCard, setEditKeptRateCard] = useState<string[]>([]);
  const [editKeptSpecialOffers, setEditKeptSpecialOffers] = useState<string[]>([]);
  const [editKeptPhotos, setEditKeptPhotos] = useState<string[]>([]);
  const [editKeptCertifications, setEditKeptCertifications] = useState<string[]>([]);

  const [editMedia, setEditMedia] = useState({
    clinicLogo: null as File | null,
    bannerImage: null as File | null,
    rateCard: [] as File[],
    specialOffers: [] as File[],
    photos: [] as File[],
    certifications: [] as File[],
  });

  const [viewClinic, setViewClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    fetchClinics();
    fetchCategories();
  }, []);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clinics?light=true`);
      if (!res.ok) {
        throw new Error(`Failed to load clinics (${res.status})`);
      }
      const data = await res.json();
      setClinics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch clinics:", err);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/clinic-categories`);
    const data = await res.json();
    setCategories(data);
  };

  const getClinicTimestamp = (clinic: Clinic) => {
    const created = clinic.createdAt ? Date.parse(clinic.createdAt) : NaN;
    if (!Number.isNaN(created)) return created;

    const updated = clinic.updatedAt ? Date.parse(clinic.updatedAt) : NaN;
    if (!Number.isNaN(updated)) return updated;

    if (/^[a-f\d]{24}$/i.test(clinic._id)) {
      return parseInt(clinic._id.substring(0, 8), 16) * 1000;
    }

    return 0;
  };

  const filteredClinics = useMemo(() => {
    let data = [...clinics];
    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter((c) =>
        [c.clinicName, c.cuc, c.email, c.contactNumber, c.address]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (filterCategory !== "all") {
      data = data.filter((c) => c.dermaCategory?._id === filterCategory);
    }

    if (filterApproval !== "all") {
      data = data.filter(
        (c) => (c.approvalStatus || "pending") === filterApproval
      );
    }

    data.sort((a, b) => getClinicTimestamp(b) - getClinicTimestamp(a));

    return data;
  }, [clinics, search, filterCategory, filterApproval]);

  const totalPages = Math.max(1, Math.ceil(filteredClinics.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterApproval, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedClinics = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClinics.slice(start, start + itemsPerPage);
  }, [filteredClinics, currentPage, itemsPerPage]);

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Delete this clinic?", { danger: true }))) return;
    await fetch(`${API_URL}/clinics/${id}`, { method: "DELETE" });
    setClinics((prev) => prev.filter((c) => c._id !== id));
  };

  const resetEditMediaState = () => {
    setEditMedia({
      clinicLogo: null,
      bannerImage: null,
      rateCard: [],
      specialOffers: [],
      photos: [],
      certifications: [],
    });
  };

  const handleEdit = async (clinic: Clinic) => {
    setIsEditing(true);
    setEditingClinic(clinic);
    setEditLoading(true);
    resetEditMediaState();

    try {
      const res = await fetch(`${API_URL}/clinics/${clinic._id}`);
      if (!res.ok) throw new Error("Failed to load clinic details");
      const full: Clinic = await res.json();

      setEditingClinic(full);
      setEditForm({
        clinicName: full.clinicName || "",
        dermaCategory: full.dermaCategory?._id || "",
        clinicType: full.clinicType || "",
        ownerName: full.ownerName || "",
        website: full.website || "",
        contactNumber: full.contactNumber || "",
        whatsapp: full.whatsapp || "",
        email: full.email || "",
        address: full.address || "",
        city: full.city || "",
        services: full.services || "",
        sector: full.sector || "",
        pincode: full.pincode || "",
        mapLink: full.mapLink || "",
        video: full.video || "",
        clinicDescription: full.clinicDescription || "",
        licenseNo: full.licenseNo || "",
        experience: full.experience || "",
        treatmentsAvailable: full.treatmentsAvailable || "",
        availableServices: full.availableServices || "",
        consultationFee: full.consultationFee || "",
        bookingMode: full.bookingMode || "",
        instagram: full.instagram || "",
        linkedin: full.linkedin || "",
        facebook: full.facebook || "",
        standardPlanLink: full.standardPlanLink || "",
        clinicStatus: full.clinicStatus || "Open",
        verifiedBadge: !!full.verifiedBadge,
      });
      setEditDoctors(full.doctors || []);
      setEditWorkingHours({
        openTime: full.workingHours?.openTime || "",
        closeTime: full.workingHours?.closeTime || "",
        days: full.workingHours?.days || [],
        offDays: full.workingHours?.offDays || [],
      });
      setEditKeptLogo(full.clinicLogo || "");
      setEditKeptBanner(full.bannerImage || "");
      setEditKeptRateCard(full.rateCard || []);
      setEditKeptSpecialOffers(full.specialOffers || []);
      setEditKeptPhotos(full.photos || []);
      setEditKeptCertifications(full.certifications || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load clinic for editing");
      setIsEditing(false);
      setEditingClinic(null);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditWorkingTimeChange = (
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setEditWorkingHours((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEditWorkingDay = (day: string) => {
    setEditWorkingHours((prev) => {
      const isSelected = prev.days.includes(day);
      return {
        ...prev,
        days: isSelected ? prev.days.filter((d) => d !== day) : [...prev.days, day],
        offDays: isSelected ? prev.offDays : prev.offDays.filter((d) => d !== day),
      };
    });
  };

  const toggleEditOffDay = (day: string) => {
    setEditWorkingHours((prev) => {
      const isSelected = prev.offDays.includes(day);
      return {
        ...prev,
        offDays: isSelected ? prev.offDays.filter((d) => d !== day) : [...prev.offDays, day],
        days: isSelected ? prev.days : prev.days.filter((d) => d !== day),
      };
    });
  };

  const handleEditDoctorFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditDoctorForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEditDoctor = () => {
    if (!editDoctorForm.name || !editDoctorForm.regNo || !editDoctorForm.specialization) {
      toast.error("Please fill all doctor details");
      return;
    }
    setEditDoctors((prev) => [...prev, editDoctorForm]);
    setEditDoctorForm({ name: "", regNo: "", specialization: "" });
    setShowEditDoctorModal(false);
  };

  const removeEditDoctor = (index: number) => {
    setEditDoctors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "clinicLogo" | "bannerImage" | "rateCard" | "specialOffers" | "photos" | "certifications"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (field === "specialOffers" || field === "photos" || field === "certifications" || field === "rateCard") {
      setEditMedia((prev) => ({
        ...prev,
        [field]: [...prev[field], ...Array.from(files)],
      }));
    } else {
      setEditMedia((prev) => ({ ...prev, [field]: files[0] }));
    }
    e.target.value = "";
  };

  const removeStagedFile = (
    field: "rateCard" | "specialOffers" | "photos" | "certifications",
    index: number
  ) => {
    setEditMedia((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const getImage = (img?: string) => resolveMediaUrl(img) || "";

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinic) return;

    if (
      !editForm.clinicName.trim() ||
      !editForm.dermaCategory ||
      !editForm.contactNumber.trim() ||
      !editForm.whatsapp.trim()
    ) {
      toast.error(
        "Please fill Clinic Name, Category, Contact Number and Whatsapp Contact Number before saving."
      );
      return;
    }

    try {
      setEditSubmitting(true);
      const formData = new FormData();
      formData.append("clinicName", editForm.clinicName);
      formData.append("dermaCategory", editForm.dermaCategory);
      formData.append("clinicType", editForm.clinicType);
      formData.append("ownerName", editForm.ownerName);
      formData.append("website", editForm.website);
      formData.append("address", editForm.address);
      formData.append("city", editForm.city);
      formData.append("services", editForm.services);
      formData.append("sector", editForm.sector);
      formData.append("pincode", editForm.pincode);
      formData.append("mapLink", editForm.mapLink);
      formData.append("contactNumber", editForm.contactNumber);
      formData.append("whatsapp", editForm.whatsapp);
      formData.append("email", editForm.email);
      formData.append("video", editForm.video);
      formData.append("workingHours", JSON.stringify(editWorkingHours));
      formData.append("clinicDescription", editForm.clinicDescription);
      formData.append("licenseNo", editForm.licenseNo);
      formData.append("experience", editForm.experience);
      formData.append("treatmentsAvailable", editForm.treatmentsAvailable);
      formData.append("availableServices", editForm.availableServices);
      formData.append("consultationFee", editForm.consultationFee);
      formData.append("bookingMode", editForm.bookingMode);
      formData.append("instagram", editForm.instagram);
      formData.append("linkedin", editForm.linkedin);
      formData.append("facebook", editForm.facebook);
      formData.append("standardPlanLink", editForm.standardPlanLink);
      formData.append("clinicStatus", editForm.clinicStatus);
      formData.append("verifiedBadge", String(editForm.verifiedBadge));
      formData.append("doctors", JSON.stringify(editDoctors));

      formData.append("rateCard", JSON.stringify(editKeptRateCard));
      formData.append("specialOffers", JSON.stringify(editKeptSpecialOffers));
      formData.append("photos", JSON.stringify(editKeptPhotos));
      formData.append("certifications", JSON.stringify(editKeptCertifications));

      if (editMedia.clinicLogo) formData.append("clinicLogo", editMedia.clinicLogo);
      if (editMedia.bannerImage) formData.append("bannerImage", editMedia.bannerImage);
      editMedia.rateCard.forEach((file) => formData.append("rateCard", file));
      editMedia.specialOffers.forEach((file) => formData.append("specialOffers", file));
      editMedia.photos.forEach((file) => formData.append("photos", file));
      editMedia.certifications.forEach((file) => formData.append("certifications", file));

      const res = await fetch(`${API_URL}/clinics/${editingClinic._id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update clinic");
      }

      await fetchClinics();
      setIsEditing(false);
      setEditingClinic(null);
      setEditForm(emptyEditForm);
      resetEditMediaState();
      toast.success("Clinic updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update clinic");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingClinic(null);
    setEditForm(emptyEditForm);
    resetEditMediaState();
  };

  const handleToggleActive = async (clinic: Clinic) => {
    const nextIsActive = clinic.isActive === false;

    setClinics((prev) =>
      prev.map((item) =>
        item._id === clinic._id ? { ...item, isActive: nextIsActive } : item
      )
    );

    try {
      const res = await fetch(`${API_URL}/clinics/${clinic._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      const updated = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(updated?.message || "Failed to update clinic status");
      }

      setClinics((prev) =>
        prev.map((item) =>
          item._id === clinic._id ? { ...item, ...updated } : item
        )
      );
    } catch (error) {
      setClinics((prev) =>
        prev.map((item) =>
          item._id === clinic._id ? { ...item, isActive: clinic.isActive } : item
        )
      );
      toast.error(error instanceof Error ? error.message : "Failed to update clinic status");
    }
  };

  const handleApprove = async (clinic: Clinic) => {
    if (
      !(await confirmDialog(
        `Approve "${clinic.clinicName}"? They'll be notified by email and can log in right away.`,
        { confirmLabel: "Approve" }
      ))
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/clinics/${clinic._id}/approve`, {
        method: "PATCH",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to approve clinic");
      }

      setClinics((prev) =>
        prev.map((item) =>
          item._id === clinic._id
            ? { ...item, approvalStatus: "approved", rejectionReason: "" }
            : item
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve clinic");
    }
  };

  const handleReject = async (clinic: Clinic) => {
    const reason = window.prompt(
      `Reject "${clinic.clinicName}"? Optionally add a reason (sent to the clinic by email):`,
      ""
    );
    if (reason === null) return; // cancelled

    try {
      const res = await fetch(`${API_URL}/clinics/${clinic._id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to reject clinic");
      }

      setClinics((prev) =>
        prev.map((item) =>
          item._id === clinic._id
            ? { ...item, approvalStatus: "rejected", rejectionReason: reason }
            : item
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject clinic");
    }
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["CUC", "Clinic Name", "Email", "Contact", "Website", "Category", "Verified", "Active", "Status"],
      ...filteredClinics.map((c) => [
        c.cuc,
        c.clinicName,
        c.email || "",
        c.contactNumber || "",
        c.website || "",
        c.dermaCategory?.name || "",
        c.verifiedBadge ? "Yes" : "No",
        c.isActive === false ? "Inactive" : "Active",
        c.clinicStatus || "",
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
    link.download = "clinics.csv";
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

    const rows = filteredClinics
      .map(
        (c) => `<tr>
          <td>${escapeHtml(c.cuc)}</td>
          <td>${escapeHtml(c.clinicName)}</td>
          <td>${escapeHtml(c.email || "-")}</td>
          <td>${escapeHtml(c.contactNumber || "-")}</td>
          <td>${escapeHtml(c.website || "-")}</td>
          <td>${escapeHtml(c.dermaCategory?.name || "-")}</td>
          <td>${escapeHtml(c.verifiedBadge ? "Yes" : "No")}</td>
          <td>${escapeHtml(c.isActive === false ? "Inactive" : "Active")}</td>
          <td>${escapeHtml(c.clinicStatus || "-")}</td>
        </tr>`
      )
      .join("");

    printable.document.write(`
      <html>
        <head>
          <title>Clinics List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>Clinics List</h2>
          <table>
            <thead>
              <tr>
                <th>CUC</th>
                <th>Clinic Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Website</th>
                <th>Category</th>
                <th>Verified</th>
                <th>Active</th>
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

  return (
    <div className={styles.container}>
      {/* <h1 className={styles.heading}>List Of Clinic</h1> */}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search clinic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filter}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          className={styles.filter}
          value={filterApproval}
          onChange={(e) => setFilterApproval(e.target.value)}
        >
          <option value="all">All Registrations</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          className={`${styles.filter} ${styles.pageFilter}`}
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}/page
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

      {loading ? (
        <FullPageLoader />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>CUC</th>
                <th>Name</th>
                <th>Website</th>
                <th>Contact</th>
                <th>Category</th>
                <th>Verified</th>
                <th>Active</th>
                <th>Registration</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedClinics.map((clinic) => (
                <tr key={clinic._id}>
                  <td>{clinic.cuc}</td>
                  <td>{clinic.clinicName}</td>
                  <td>{clinic.website || "—"}</td>
                  <td>{clinic.contactNumber || "—"}</td>
                  <td>{clinic.dermaCategory?.name || "—"}</td>
                  <td>
                    <span className={clinic.verifiedBadge ? styles.verifiedBadge : styles.unverifiedBadge}>
                      {clinic.verifiedBadge ? "Verified" : "Not Verified"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.toggleSwitch} ${
                        clinic.isActive === false ? "" : styles.toggleSwitchOn
                      }`}
                      onClick={() => handleToggleActive(clinic)}
                      aria-pressed={clinic.isActive !== false}
                    >
                      <span className={styles.toggleKnob} />
                      {clinic.isActive === false ? "Inactive" : "Active"}
                    </button>
                  </td>
                  <td>
                    {(() => {
                      const status = clinic.approvalStatus || "pending";
                      const badgeClass =
                        status === "approved"
                          ? styles.approvedBadge
                          : status === "rejected"
                          ? styles.rejectedBadge
                          : styles.pendingBadge;
                      return (
                        <span
                          className={badgeClass}
                          title={
                            status === "rejected" && clinic.rejectionReason
                              ? `Reason: ${clinic.rejectionReason}`
                              : undefined
                          }
                        >
                          {status === "approved"
                            ? "Approved"
                            : status === "rejected"
                            ? "Rejected"
                            : "Pending"}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <TableActions
                      onView={() => setViewClinic(clinic)}
                      onEdit={() => handleEdit(clinic)}
                      onDelete={() => handleDelete(clinic._id)}
                      onApprove={
                        canEdit && (clinic.approvalStatus || "pending") !== "approved"
                          ? () => handleApprove(clinic)
                          : undefined
                      }
                      onReject={
                        canEdit && (clinic.approvalStatus || "pending") !== "rejected"
                          ? () => handleReject(clinic)
                          : undefined
                      }
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
              {paginatedClinics.length === 0 && (
                <tr>
                  <td colSpan={9}>No clinics found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
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
            Showing {paginatedClinics.length} of {filteredClinics.length}
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
      )}

      {/* ================= FULL INLINE EDIT FORM ================= */}
      {isEditing && editingClinic && (
        <div className={editStyles.container} style={{ marginTop: 40 }}>
          <h1 className={editStyles.heading}>Edit Clinic</h1>

          {editLoading ? (
            <FullPageLoader />
          ) : (
            <form className={editStyles.form} onSubmit={handleEditSubmit}>
              {/* 1. CLINIC IDENTITY */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Clinic Identity</h2>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Clinic Unique Code</label>
                  <input value={editingClinic.cuc} disabled className={editStyles.readonlyInput} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>
                    Clinic Name<span className={editStyles.required}>*</span>
                  </label>
                  <input
                    className={editStyles.input}
                    name="clinicName"
                    value={editForm.clinicName}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>
                    Clinic Category<span className={editStyles.required}>*</span>
                  </label>
                  <select
                    className={editStyles.select}
                    name="dermaCategory"
                    value={editForm.dermaCategory}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Select Clinic Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Clinic Type</label>
                  <input className={editStyles.input} name="clinicType" value={editForm.clinicType} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>
                    Contact Number<span className={editStyles.required}>*</span>
                  </label>
                  <input
                    className={editStyles.input}
                    name="contactNumber"
                    value={editForm.contactNumber}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Owner Name</label>
                  <input className={editStyles.input} name="ownerName" value={editForm.ownerName} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Website</label>
                  <input className={editStyles.input} name="website" value={editForm.website} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Verified Badge</label>
                  <select
                    className={editStyles.select}
                    value={String(editForm.verifiedBadge)}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, verifiedBadge: e.target.value === "true" }))
                    }
                  >
                    <option value="false">Verified Badge: No</option>
                    <option value="true">Verified Badge: Yes</option>
                  </select>
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Clinic Status</label>
                  <select
                    className={editStyles.select}
                    name="clinicStatus"
                    value={editForm.clinicStatus}
                    onChange={handleEditChange}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </section>

              {/* 2. BRANDING & MEDIA */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Branding & Media</h2>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Clinic Logo</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className={editStyles.input}
                    onChange={(e) => handleEditFileChange(e, "clinicLogo")}
                  />
                  {(editMedia.clinicLogo || editKeptLogo) && (
                    <img
                      src={
                        editMedia.clinicLogo
                          ? URL.createObjectURL(editMedia.clinicLogo)
                          : getImage(editKeptLogo)
                      }
                      alt=""
                      className={editStyles.singleMediaPreview}
                    />
                  )}
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Banner Image</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className={editStyles.input}
                    onChange={(e) => handleEditFileChange(e, "bannerImage")}
                  />
                  {(editMedia.bannerImage || editKeptBanner) && (
                    <img
                      src={
                        editMedia.bannerImage
                          ? URL.createObjectURL(editMedia.bannerImage)
                          : getImage(editKeptBanner)
                      }
                      alt=""
                      className={editStyles.singleMediaPreview}
                    />
                  )}
                </div>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Special Offers (Images)</label>
                  <p className={editStyles.mediaHint}>Existing offers are kept unless removed below.</p>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className={editStyles.input}
                    onChange={(e) => handleEditFileChange(e, "specialOffers")}
                  />
                  <div className={editStyles.previewStrip}>
                    {editKeptSpecialOffers.map((img, i) => (
                      <div key={`kept-so-${i}`} className={editStyles.previewThumb}>
                        <img src={getImage(img)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() =>
                            setEditKeptSpecialOffers((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {editMedia.specialOffers.map((file, i) => (
                      <div key={`new-so-${i}`} className={editStyles.previewThumb}>
                        <img src={URL.createObjectURL(file)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() => removeStagedFile("specialOffers", i)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Rate Card / Catalogue</label>
                  <p className={editStyles.mediaHint}>Existing pages are kept unless removed below.</p>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className={editStyles.input}
                    onChange={(e) => handleEditFileChange(e, "rateCard")}
                  />
                  <div className={editStyles.previewStrip}>
                    {editKeptRateCard.map((img, i) => (
                      <div key={`kept-rc-${i}`} className={editStyles.previewThumb}>
                        <img src={getImage(img)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() =>
                            setEditKeptRateCard((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {editMedia.rateCard.map((file, i) => (
                      <div key={`new-rc-${i}`} className={editStyles.previewThumb}>
                        <img src={URL.createObjectURL(file)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() => removeStagedFile("rateCard", i)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Photos</label>
                  <p className={editStyles.mediaHint}>Existing photos are kept unless removed below.</p>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className={editStyles.input}
                    onChange={(e) => handleEditFileChange(e, "photos")}
                  />
                  <div className={editStyles.previewStrip}>
                    {editKeptPhotos.map((img, i) => (
                      <div key={`kept-ph-${i}`} className={editStyles.previewThumb}>
                        <img src={getImage(img)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() =>
                            setEditKeptPhotos((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {editMedia.photos.map((file, i) => (
                      <div key={`new-ph-${i}`} className={editStyles.previewThumb}>
                        <img src={URL.createObjectURL(file)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() => removeStagedFile("photos", i)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Video URL</label>
                  <input className={editStyles.input} name="video" value={editForm.video} onChange={handleEditChange} />
                </div>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Certifications / Awards (Images)</label>
                  <p className={editStyles.mediaHint}>Existing certifications are kept unless removed below.</p>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className={editStyles.input}
                    onChange={(e) => handleEditFileChange(e, "certifications")}
                  />
                  <div className={editStyles.previewStrip}>
                    {editKeptCertifications.map((img, i) => (
                      <div key={`kept-cert-${i}`} className={editStyles.previewThumb}>
                        <img src={getImage(img)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() =>
                            setEditKeptCertifications((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {editMedia.certifications.map((file, i) => (
                      <div key={`new-cert-${i}`} className={editStyles.previewThumb}>
                        <img src={URL.createObjectURL(file)} alt="" />
                        <button
                          type="button"
                          className={editStyles.previewRemoveBtn}
                          onClick={() => removeStagedFile("certifications", i)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 3. DOCTORS & EXPERTISE */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Doctors & Expertise</h2>

                <button
                  type="button"
                  className={editStyles.addDoctorBtn}
                  onClick={() => setShowEditDoctorModal(true)}
                >
                  + Add Doctor
                </button>

                {editDoctors.map((doc, i) => (
                  <div key={i} className={editStyles.doctorCard}>
                    <div>
                      <strong>{doc.name}</strong>
                      <span>Reg No: {doc.regNo}</span>
                      <span>{doc.specialization}</span>
                    </div>
                    <button
                      type="button"
                      className={editStyles.removeDoctorBtn}
                      onClick={() => removeEditDoctor(i)}
                    >
                      Delete
                    </button>
                  </div>
                ))}

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Standard Treatment Plan Link</label>
                  <input
                    className={editStyles.input}
                    name="standardPlanLink"
                    value={editForm.standardPlanLink}
                    onChange={handleEditChange}
                  />
                </div>
              </section>

              {/* 4. LOCATION & CONTACT */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Location & Contact</h2>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Clinic Address</label>
                  <textarea className={editStyles.textarea} name="address" value={editForm.address} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>City</label>
                  <input className={editStyles.input} name="city" value={editForm.city} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Services</label>
                  <input className={editStyles.input} name="services" value={editForm.services} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Sector</label>
                  <input className={editStyles.input} name="sector" value={editForm.sector} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Pin Code</label>
                  <input className={editStyles.input} name="pincode" value={editForm.pincode} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Google Maps Link</label>
                  <input className={editStyles.input} name="mapLink" value={editForm.mapLink} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Email Address</label>
                  <input className={editStyles.input} name="email" value={editForm.email} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>
                    Whatsapp Contact<span className={editStyles.required}>*</span>
                  </label>
                  <input
                    className={editStyles.input}
                    name="whatsapp"
                    value={editForm.whatsapp}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Working Hours</label>

                  <div className={editStyles.timeRow}>
                    <div className={editStyles.field}>
                      <label className={editStyles.label}>Opening Time</label>
                      <input
                        type="time"
                        className={editStyles.input}
                        value={editWorkingHours.openTime}
                        onChange={(e) => handleEditWorkingTimeChange("openTime", e.target.value)}
                      />
                    </div>
                    <div className={editStyles.field}>
                      <label className={editStyles.label}>Closing Time</label>
                      <input
                        type="time"
                        className={editStyles.input}
                        value={editWorkingHours.closeTime}
                        onChange={(e) => handleEditWorkingTimeChange("closeTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label className={editStyles.label}>Working Days</label>
                    <div className={editStyles.dayChipRow} style={{ marginTop: 6 }}>
                      {WEEK_DAYS.map((day) => {
                        const selected = editWorkingHours.days.includes(day);
                        return (
                          <button
                            key={`work-${day}`}
                            type="button"
                            className={`${editStyles.dayChip} ${selected ? editStyles.dayChipWorking : ""}`}
                            onClick={() => toggleEditWorkingDay(day)}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <label className={editStyles.label}>Clinic Off Days</label>
                    <div className={editStyles.dayChipRow} style={{ marginTop: 6 }}>
                      {WEEK_DAYS.map((day) => {
                        const selected = editWorkingHours.offDays.includes(day);
                        return (
                          <button
                            key={`off-${day}`}
                            type="button"
                            className={`${editStyles.dayChip} ${selected ? editStyles.dayChipOff : ""}`}
                            onClick={() => toggleEditOffDay(day)}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. DESCRIPTION */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Clinic Description</h2>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Description</label>
                  <ReactQuill
                    theme="snow"
                    value={editForm.clinicDescription}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, clinicDescription: value }))}
                    modules={quillModules}
                  />
                </div>
              </section>

              {/* 6. OPERATIONS & LEGAL */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Operations & Legal</h2>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Clinic Establishment License No.</label>
                  <input className={editStyles.input} name="licenseNo" value={editForm.licenseNo} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Years of Experience</label>
                  <input className={editStyles.input} name="experience" value={editForm.experience} onChange={handleEditChange} />
                </div>
              </section>

              {/* 7. SERVICES & TREATMENTS */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Services & Treatments</h2>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Treatments Available</label>
                  <ReactQuill
                    theme="snow"
                    value={editForm.treatmentsAvailable}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, treatmentsAvailable: value }))}
                    modules={quillModules}
                  />
                </div>

                <div className={editStyles.fullField}>
                  <label className={editStyles.label}>Available Services</label>
                  <ReactQuill
                    theme="snow"
                    value={editForm.availableServices}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, availableServices: value }))}
                    modules={quillModules}
                  />
                </div>
              </section>

              {/* 8. PRICING & BOOKING */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Pricing & Booking</h2>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Consultation Fee</label>
                  <input className={editStyles.input} name="consultationFee" value={editForm.consultationFee} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Booking Mode</label>
                  <input className={editStyles.input} name="bookingMode" value={editForm.bookingMode} onChange={handleEditChange} />
                </div>
              </section>

              {/* 9. SOCIAL */}
              <section className={editStyles.section}>
                <h2 className={editStyles.sectionTitle}>Social Presence</h2>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Instagram</label>
                  <input className={editStyles.input} name="instagram" value={editForm.instagram} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>LinkedIn</label>
                  <input className={editStyles.input} name="linkedin" value={editForm.linkedin} onChange={handleEditChange} />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Facebook</label>
                  <input className={editStyles.input} name="facebook" value={editForm.facebook} onChange={handleEditChange} />
                </div>
              </section>

              <div className={editStyles.actionsRow}>
                <button type="submit" className={editStyles.submitBtn} disabled={editSubmitting}>
                  {editSubmitting ? "Saving..." : "Update Clinic"}
                </button>
                <button
                  type="button"
                  className={editStyles.cancelBtn}
                  onClick={handleCancelEdit}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* DOCTOR MODAL */}
          {showEditDoctorModal && (
            <div className={editStyles.modalOverlay}>
              <div className={editStyles.modal}>
                <h3>Add Doctor</h3>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Doctor Name</label>
                  <input
                    className={editStyles.input}
                    name="name"
                    value={editDoctorForm.name}
                    onChange={handleEditDoctorFormChange}
                  />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Registration No</label>
                  <input
                    className={editStyles.input}
                    name="regNo"
                    value={editDoctorForm.regNo}
                    onChange={handleEditDoctorFormChange}
                  />
                </div>

                <div className={editStyles.field}>
                  <label className={editStyles.label}>Specialization</label>
                  <input
                    className={editStyles.input}
                    name="specialization"
                    value={editDoctorForm.specialization}
                    onChange={handleEditDoctorFormChange}
                  />
                </div>

                <div className={editStyles.modalActions}>
                  <button type="button" onClick={() => setShowEditDoctorModal(false)}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveEditDoctor}>
                    Save Doctor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW MODAL (FIXED) ================= */}
      {viewClinic && (
        <div className={styles.modalOverlay}>
          <div className={styles.viewModal}>
            <h2>{viewClinic.clinicName}</h2>

            {viewClinic.bannerImage && (
              <img
                src={getImage(viewClinic.bannerImage)}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              />
            )}

            <div className={styles.viewGrid}>
              <p><b>CUC:</b> {viewClinic.cuc}</p>
              <p><b>Email:</b> {viewClinic.email}</p>
              <p><b>Contact:</b> {viewClinic.contactNumber}</p>
              <p><b>Website:</b> {viewClinic.website}</p>
              <p><b>Category:</b> {viewClinic.dermaCategory?.name}</p>
              <p><b>Status:</b> {viewClinic.clinicStatus}</p>
              <p><b>Verified:</b> {viewClinic.verifiedBadge ? "Yes" : "No"}</p>
              <p><b>Active:</b> {viewClinic.isActive === false ? "No" : "Yes"}</p>
              <p><b>Registration:</b> {viewClinic.approvalStatus || "pending"}</p>
              {viewClinic.approvalStatus === "rejected" && viewClinic.rejectionReason && (
                <p><b>Rejection Reason:</b> {viewClinic.rejectionReason}</p>
              )}
              <p><b>Address:</b> {viewClinic.address}</p>
            </div>

            {viewClinic.doctors?.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>Doctors</h3>
                <ul>
                  {viewClinic.doctors.map((d, i) => (
                    <li key={i}>
                      {d.name} – {d.specialization}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {viewClinic.photos && viewClinic.photos.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>Clinic Photos</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {viewClinic.photos.map((img, i) => (
                    <img
                      key={i}
                      src={getImage(img)}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <button
              className={styles.closeBtn}
              onClick={() => setViewClinic(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListOfClinic;

"use client";
export const dynamic = "force-dynamic";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import styles from "@/styles/Dashboard/listofclinic.module.css";
import editStyles from "@/styles/Dashboard/editclinic.module.css";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl, getExportSafeMediaValue } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import TableActions from "@/components/AdminPanel/common/TableActions";
import BulkSelectBar from "@/components/AdminPanel/common/BulkSelectBar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import bulkStyles from "@/styles/Dashboard/bulkSelect.module.css";
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

  latitude?: number;
  longitude?: number;
  gstNumber?: string;
  addresses?: Array<{ city?: string; pincode?: string }>;
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
  const [viewLoading, setViewLoading] = useState(false);

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

  const bulkSelection = useBulkSelection(paginatedClinics, (c) => c._id);

  const stripHtmlToText = (value: string | undefined, maxLength = 60) => {
    if (!value) return "-";
    const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return "-";
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  };

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Delete this clinic?", { danger: true }))) return;
    await fetch(`${API_URL}/clinics/${id}`, { method: "DELETE" });
    setClinics((prev) => prev.filter((c) => c._id !== id));
  };

  // The list is fetched with ?light=true, which only returns a subset of
  // fields — fetch the full clinic record (same endpoint handleEdit uses)
  // so the view modal can actually show everything.
  const handleView = async (clinic: Clinic) => {
    setViewClinic(clinic);
    setViewLoading(true);
    try {
      const res = await fetch(`${API_URL}/clinics/${clinic._id}`);
      if (!res.ok) throw new Error("Failed to load clinic details");
      const full: Clinic = await res.json();
      setViewClinic(full);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load clinic details");
    } finally {
      setViewLoading(false);
    }
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
      [
        "CUC",
        "Logo",
        "Clinic Name",
        "Slug",
        "Type",
        "Owner",
        "Website",
        "Contact",
        "Whatsapp",
        "Email",
        "Category",
        "Address",
        "City",
        "Services",
        "Sector",
        "Pincode",
        "Map Link",
        "Latitude",
        "Longitude",
        "GST Number",
        "Addresses",
        "Doctors",
        "Working Hours",
        "Banner",
        "Rate Card",
        "Special Offers",
        "Photos",
        "Certifications",
        "Video",
        "License No.",
        "Experience",
        "Treatments Available",
        "Available Services",
        "Consultation Fee",
        "Booking Mode",
        "Description",
        "Instagram",
        "LinkedIn",
        "Facebook",
        "Standard Plan Link",
        "Verified",
        "Active",
        "Registration",
        "Rejection Reason",
        "Approved At",
        "Created",
        "Status",
      ],
      ...filteredClinics.map((c) => {
        const registrationStatus = c.approvalStatus || "pending";
        const registrationLabel =
          registrationStatus === "approved"
            ? "Approved"
            : registrationStatus === "rejected"
            ? "Rejected"
            : "Pending";

        return [
          c.cuc,
          getExportSafeMediaValue(c.clinicLogo),
          c.clinicName,
          c.slug || "-",
          c.clinicType || "-",
          c.ownerName || "-",
          c.website || "",
          c.contactNumber || "",
          c.whatsapp || "-",
          c.email || "",
          c.dermaCategory?.name || "",
          c.address || "-",
          c.city || "-",
          c.services || "-",
          c.sector || "-",
          c.pincode || "-",
          c.mapLink || "-",
          c.latitude ?? "-",
          c.longitude ?? "-",
          c.gstNumber || "-",
          c.addresses?.length ? `${c.addresses.length} address(es)` : "-",
          c.doctors?.length ? `${c.doctors.length} doctor(s)` : "-",
          c.workingHours?.openTime && c.workingHours?.closeTime
            ? `${c.workingHours.openTime}-${c.workingHours.closeTime}`
            : "-",
          getExportSafeMediaValue(c.bannerImage),
          c.rateCard?.length ? `${c.rateCard.length} page(s)` : "-",
          c.specialOffers?.length ? `${c.specialOffers.length} offer(s)` : "-",
          c.photos?.length ? `${c.photos.length} photo(s)` : "-",
          c.certifications?.length ? `${c.certifications.length} cert(s)` : "-",
          c.video || "-",
          c.licenseNo || "-",
          c.experience || "-",
          stripHtmlToText(c.treatmentsAvailable),
          stripHtmlToText(c.availableServices),
          c.consultationFee || "-",
          c.bookingMode || "-",
          stripHtmlToText(c.clinicDescription),
          c.instagram || "-",
          c.linkedin || "-",
          c.facebook || "-",
          c.standardPlanLink || "-",
          c.verifiedBadge ? "Yes" : "No",
          c.isActive === false ? "Inactive" : "Active",
          registrationLabel,
          c.rejectionReason || "-",
          c.approvedAt ? String(c.approvedAt).slice(0, 10) : "-",
          c.createdAt ? String(c.createdAt).slice(0, 10) : "-",
          c.clinicStatus || "",
        ];
      }),
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
      .map((c) => {
        const registrationStatus = c.approvalStatus || "pending";
        const registrationLabel =
          registrationStatus === "approved"
            ? "Approved"
            : registrationStatus === "rejected"
            ? "Rejected"
            : "Pending";

        return `<tr>
          <td>${escapeHtml(c.cuc)}</td>
          <td>${escapeHtml(getExportSafeMediaValue(c.clinicLogo))}</td>
          <td>${escapeHtml(c.clinicName)}</td>
          <td>${escapeHtml(c.slug || "-")}</td>
          <td>${escapeHtml(c.clinicType || "-")}</td>
          <td>${escapeHtml(c.ownerName || "-")}</td>
          <td>${escapeHtml(c.website || "-")}</td>
          <td>${escapeHtml(c.contactNumber || "-")}</td>
          <td>${escapeHtml(c.whatsapp || "-")}</td>
          <td>${escapeHtml(c.email || "-")}</td>
          <td>${escapeHtml(c.dermaCategory?.name || "-")}</td>
          <td>${escapeHtml(c.address || "-")}</td>
          <td>${escapeHtml(c.city || "-")}</td>
          <td>${escapeHtml(c.services || "-")}</td>
          <td>${escapeHtml(c.sector || "-")}</td>
          <td>${escapeHtml(c.pincode || "-")}</td>
          <td>${escapeHtml(c.mapLink || "-")}</td>
          <td>${escapeHtml(String(c.latitude ?? "-"))}</td>
          <td>${escapeHtml(String(c.longitude ?? "-"))}</td>
          <td>${escapeHtml(c.gstNumber || "-")}</td>
          <td>${escapeHtml(c.addresses?.length ? `${c.addresses.length} address(es)` : "-")}</td>
          <td>${escapeHtml(c.doctors?.length ? `${c.doctors.length} doctor(s)` : "-")}</td>
          <td>${escapeHtml(
            c.workingHours?.openTime && c.workingHours?.closeTime
              ? `${c.workingHours.openTime}-${c.workingHours.closeTime}`
              : "-"
          )}</td>
          <td>${escapeHtml(getExportSafeMediaValue(c.bannerImage))}</td>
          <td>${escapeHtml(c.rateCard?.length ? `${c.rateCard.length} page(s)` : "-")}</td>
          <td>${escapeHtml(c.specialOffers?.length ? `${c.specialOffers.length} offer(s)` : "-")}</td>
          <td>${escapeHtml(c.photos?.length ? `${c.photos.length} photo(s)` : "-")}</td>
          <td>${escapeHtml(c.certifications?.length ? `${c.certifications.length} cert(s)` : "-")}</td>
          <td>${escapeHtml(c.video || "-")}</td>
          <td>${escapeHtml(c.licenseNo || "-")}</td>
          <td>${escapeHtml(c.experience || "-")}</td>
          <td>${escapeHtml(stripHtmlToText(c.treatmentsAvailable))}</td>
          <td>${escapeHtml(stripHtmlToText(c.availableServices))}</td>
          <td>${escapeHtml(c.consultationFee || "-")}</td>
          <td>${escapeHtml(c.bookingMode || "-")}</td>
          <td>${escapeHtml(stripHtmlToText(c.clinicDescription))}</td>
          <td>${escapeHtml(c.instagram || "-")}</td>
          <td>${escapeHtml(c.linkedin || "-")}</td>
          <td>${escapeHtml(c.facebook || "-")}</td>
          <td>${escapeHtml(c.standardPlanLink || "-")}</td>
          <td>${escapeHtml(c.verifiedBadge ? "Yes" : "No")}</td>
          <td>${escapeHtml(c.isActive === false ? "Inactive" : "Active")}</td>
          <td>${escapeHtml(registrationLabel)}</td>
          <td>${escapeHtml(c.rejectionReason || "-")}</td>
          <td>${escapeHtml(c.approvedAt ? String(c.approvedAt).slice(0, 10) : "-")}</td>
          <td>${escapeHtml(c.createdAt ? String(c.createdAt).slice(0, 10) : "-")}</td>
          <td>${escapeHtml(c.clinicStatus || "-")}</td>
        </tr>`;
      })
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
                <th>Logo</th>
                <th>Clinic Name</th>
                <th>Slug</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Website</th>
                <th>Contact</th>
                <th>Whatsapp</th>
                <th>Email</th>
                <th>Category</th>
                <th>Address</th>
                <th>City</th>
                <th>Services</th>
                <th>Sector</th>
                <th>Pincode</th>
                <th>Map Link</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>GST Number</th>
                <th>Addresses</th>
                <th>Doctors</th>
                <th>Working Hours</th>
                <th>Banner</th>
                <th>Rate Card</th>
                <th>Special Offers</th>
                <th>Photos</th>
                <th>Certifications</th>
                <th>Video</th>
                <th>License No.</th>
                <th>Experience</th>
                <th>Treatments Available</th>
                <th>Available Services</th>
                <th>Consultation Fee</th>
                <th>Booking Mode</th>
                <th>Description</th>
                <th>Instagram</th>
                <th>LinkedIn</th>
                <th>Facebook</th>
                <th>Standard Plan Link</th>
                <th>Verified</th>
                <th>Active</th>
                <th>Registration</th>
                <th>Rejection Reason</th>
                <th>Approved At</th>
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
        <>
          <BulkSelectBar
            endpointPath="clinics"
            selectedIds={Array.from(bulkSelection.selectedIds)}
            noun="clinics"
            canDelete={canDelete}
            onClear={bulkSelection.clear}
            onDeleted={(deletedIds) => {
              setClinics((prev) => prev.filter((c) => !deletedIds.includes(c._id)));
              bulkSelection.removeIds(deletedIds);
            }}
          />
          <div className={`${styles.tableWrapper} ${bulkStyles.tableScroll}`}>
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
                      aria-label="Select all clinics on this page"
                    />
                  </th>
                )}
                <th>CUC</th>
                <th>Logo</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Website</th>
                <th>Contact</th>
                <th>Whatsapp</th>
                <th>Email</th>
                <th>Category</th>
                <th>Address</th>
                <th>City</th>
                <th>Services</th>
                <th>Sector</th>
                <th>Pincode</th>
                <th>Map Link</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>GST Number</th>
                <th>Addresses</th>
                <th>Doctors</th>
                <th>Working Hours</th>
                <th>Banner</th>
                <th>Rate Card</th>
                <th>Special Offers</th>
                <th>Photos</th>
                <th>Certifications</th>
                <th>Video</th>
                <th>License No.</th>
                <th>Experience</th>
                <th>Treatments Available</th>
                <th>Available Services</th>
                <th>Consultation Fee</th>
                <th>Booking Mode</th>
                <th>Description</th>
                <th>Instagram</th>
                <th>LinkedIn</th>
                <th>Facebook</th>
                <th>Standard Plan Link</th>
                <th>Verified</th>
                <th>Active</th>
                <th>Registration</th>
                <th>Rejection Reason</th>
                <th>Approved At</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedClinics.map((clinic) => (
                <tr key={clinic._id}>
                  {canDelete && (
                    <td className={bulkStyles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(clinic._id)}
                        onChange={() => bulkSelection.toggle(clinic._id)}
                        aria-label={`Select ${clinic.clinicName}`}
                      />
                    </td>
                  )}
                  <td>{clinic.cuc}</td>
                  <td>
                    {clinic.clinicLogo ? (
                      <img
                        src={resolveMediaUrl(clinic.clinicLogo) || clinic.clinicLogo}
                        alt={clinic.clinicName}
                        style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{clinic.clinicName}</td>
                  <td>{clinic.slug || "-"}</td>
                  <td>{clinic.clinicType || "-"}</td>
                  <td>{clinic.ownerName || "-"}</td>
                  <td>{clinic.website || "—"}</td>
                  <td>{clinic.contactNumber || "—"}</td>
                  <td>{clinic.whatsapp || "-"}</td>
                  <td>{clinic.email || "-"}</td>
                  <td>{clinic.dermaCategory?.name || "—"}</td>
                  <td>{clinic.address || "-"}</td>
                  <td>{clinic.city || "-"}</td>
                  <td>{clinic.services || "-"}</td>
                  <td>{clinic.sector || "-"}</td>
                  <td>{clinic.pincode || "-"}</td>
                  <td>
                    {clinic.mapLink ? (
                      <a href={clinic.mapLink} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{clinic.latitude ?? "-"}</td>
                  <td>{clinic.longitude ?? "-"}</td>
                  <td>{clinic.gstNumber || "-"}</td>
                  <td>{clinic.addresses?.length ? `${clinic.addresses.length} address(es)` : "-"}</td>
                  <td>{clinic.doctors?.length ? `${clinic.doctors.length} doctor(s)` : "-"}</td>
                  <td>
                    {clinic.workingHours?.openTime && clinic.workingHours?.closeTime
                      ? `${clinic.workingHours.openTime}-${clinic.workingHours.closeTime}`
                      : "-"}
                  </td>
                  <td>
                    {clinic.bannerImage ? (
                      <img
                        src={resolveMediaUrl(clinic.bannerImage) || clinic.bannerImage}
                        alt={clinic.clinicName}
                        style={{ width: 44, height: 30, objectFit: "cover", borderRadius: 6 }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{clinic.rateCard?.length ? `${clinic.rateCard.length} page(s)` : "-"}</td>
                  <td>{clinic.specialOffers?.length ? `${clinic.specialOffers.length} offer(s)` : "-"}</td>
                  <td>{clinic.photos?.length ? `${clinic.photos.length} photo(s)` : "-"}</td>
                  <td>
                    {clinic.certifications?.length ? `${clinic.certifications.length} cert(s)` : "-"}
                  </td>
                  <td>
                    {clinic.video ? (
                      <a href={clinic.video} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{clinic.licenseNo || "-"}</td>
                  <td>{clinic.experience || "-"}</td>
                  <td>{stripHtmlToText(clinic.treatmentsAvailable)}</td>
                  <td>{stripHtmlToText(clinic.availableServices)}</td>
                  <td>{clinic.consultationFee || "-"}</td>
                  <td>{clinic.bookingMode || "-"}</td>
                  <td>{stripHtmlToText(clinic.clinicDescription)}</td>
                  <td>
                    {clinic.instagram ? (
                      <a href={clinic.instagram} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {clinic.linkedin ? (
                      <a href={clinic.linkedin} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {clinic.facebook ? (
                      <a href={clinic.facebook} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {clinic.standardPlanLink ? (
                      <a href={clinic.standardPlanLink} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
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
                  <td>{clinic.rejectionReason || "-"}</td>
                  <td>{clinic.approvedAt ? String(clinic.approvedAt).slice(0, 10) : "-"}</td>
                  <td>{clinic.createdAt ? String(clinic.createdAt).slice(0, 10) : "-"}</td>
                  <td>
                    <TableActions
                      onView={() => handleView(clinic)}
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
                  <td colSpan={canDelete ? 47 : 46}>No clinics found.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
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

      {/* ================= VIEW CLINIC MODAL ================= */}
      {viewClinic && (
        <div className={styles.modalOverlay} onClick={() => setViewClinic(null)}>
          <div
            className={styles.viewModal}
            style={{ width: 960, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {viewLoading ? (
              <FullPageLoader />
            ) : (
              <>
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
                    <h2 style={{ margin: "0 0 4px" }}>{viewClinic.clinicName}</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                      CUC: {viewClinic.cuc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewClinic(null)}
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
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background: viewClinic.isActive === false ? "rgba(220, 38, 38, 0.1)" : "rgba(22, 163, 74, 0.12)",
                      color: viewClinic.isActive === false ? "#dc2626" : "#15803d",
                    }}
                  >
                    {viewClinic.isActive === false ? "Inactive" : "Active"}
                  </span>
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background: viewClinic.verifiedBadge ? "rgba(13, 93, 143, 0.12)" : "rgba(100, 116, 139, 0.12)",
                      color: viewClinic.verifiedBadge ? "#0d5d8f" : "#475569",
                    }}
                  >
                    {viewClinic.verifiedBadge ? "Verified" : "Not Verified"}
                  </span>
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background:
                        (viewClinic.approvalStatus || "pending") === "approved"
                          ? "rgba(22, 163, 74, 0.12)"
                          : (viewClinic.approvalStatus || "pending") === "rejected"
                          ? "rgba(220, 38, 38, 0.1)"
                          : "rgba(245, 158, 11, 0.14)",
                      color:
                        (viewClinic.approvalStatus || "pending") === "approved"
                          ? "#15803d"
                          : (viewClinic.approvalStatus || "pending") === "rejected"
                          ? "#dc2626"
                          : "#b45309",
                    }}
                    title={
                      viewClinic.approvalStatus === "rejected" && viewClinic.rejectionReason
                        ? `Reason: ${viewClinic.rejectionReason}`
                        : undefined
                    }
                  >
                    {(viewClinic.approvalStatus || "pending") === "approved"
                      ? "Approved"
                      : (viewClinic.approvalStatus || "pending") === "rejected"
                      ? "Rejected"
                      : "Pending Approval"}
                  </span>
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background: "rgba(99, 102, 241, 0.1)",
                      color: "#4f46e5",
                    }}
                  >
                    {viewClinic.clinicStatus || "Open"}
                  </span>
                </div>

                {viewClinic.approvalStatus === "rejected" && viewClinic.rejectionReason && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "rgba(220, 38, 38, 0.06)",
                      color: "#b91c1c",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 20,
                    }}
                  >
                    Rejection reason: {viewClinic.rejectionReason}
                  </div>
                )}

                {(viewClinic.bannerImage || viewClinic.clinicLogo) && (
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20 }}>
                    {viewClinic.bannerImage && (
                      <img
                        src={getImage(viewClinic.bannerImage)}
                        alt="Banner"
                        style={{
                          flex: 1,
                          height: 180,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                    )}
                    {viewClinic.clinicLogo && (
                      <img
                        src={getImage(viewClinic.clinicLogo)}
                        alt="Logo"
                        style={{
                          width: 96,
                          height: 96,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid #e5e7eb",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                )}

                <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                  Clinic Identity
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    ["Clinic Type", viewClinic.clinicType || "-"],
                    ["Owner Name", viewClinic.ownerName || "-"],
                    ["Category", viewClinic.dermaCategory?.name || "-"],
                    ["Website", viewClinic.website || "-"],
                    ["Contact Number", viewClinic.contactNumber || "-"],
                    ["WhatsApp", viewClinic.whatsapp || "-"],
                    ["Email", viewClinic.email || "-"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                  Location
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    ["Address", viewClinic.address || "-"],
                    ["City", viewClinic.city || "-"],
                    ["Sector", viewClinic.sector || "-"],
                    ["Pincode", viewClinic.pincode || "-"],
                    ["Services", viewClinic.services || "-"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
                  {viewClinic.mapLink && (
                    <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                        Google Maps
                      </div>
                      <a href={viewClinic.mapLink} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                        Open map link
                      </a>
                    </div>
                  )}
                </div>

                {viewClinic.workingHours && (
                  <>
                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                      Working Hours
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                      <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                          Timing
                        </div>
                        <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>
                          {viewClinic.workingHours.openTime || "-"} – {viewClinic.workingHours.closeTime || "-"}
                        </div>
                      </div>
                      <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                          Working Days
                        </div>
                        <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>
                          {(viewClinic.workingHours.days || []).join(", ") || "-"}
                        </div>
                      </div>
                      <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                          Off Days
                        </div>
                        <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>
                          {(viewClinic.workingHours.offDays || []).join(", ") || "-"}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                  Operations, Pricing &amp; Booking
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    ["License No.", viewClinic.licenseNo || "-"],
                    ["Experience", viewClinic.experience || "-"],
                    ["Consultation Fee", viewClinic.consultationFee || "-"],
                    ["Booking Mode", viewClinic.bookingMode || "-"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
                  {viewClinic.standardPlanLink && (
                    <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                        Standard Treatment Plan
                      </div>
                      <a href={viewClinic.standardPlanLink} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                        Open plan link
                      </a>
                    </div>
                  )}
                </div>

                {(viewClinic.instagram || viewClinic.linkedin || viewClinic.facebook) && (
                  <>
                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                      Social Presence
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                      {viewClinic.instagram && (
                        <a href={viewClinic.instagram} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                          Instagram
                        </a>
                      )}
                      {viewClinic.linkedin && (
                        <a href={viewClinic.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                          LinkedIn
                        </a>
                      )}
                      {viewClinic.facebook && (
                        <a href={viewClinic.facebook} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                          Facebook
                        </a>
                      )}
                    </div>
                  </>
                )}

                {viewClinic.doctors && viewClinic.doctors.length > 0 && (
                  <>
                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                      Doctors
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
                      {viewClinic.doctors.map((d, i) => (
                        <div
                          key={i}
                          style={{ padding: "10px 14px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e5e7eb" }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{d.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Reg No: {d.regNo}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{d.specialization}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {[
                  ["Clinic Description", viewClinic.clinicDescription],
                  ["Treatments Available", viewClinic.treatmentsAvailable],
                  ["Available Services", viewClinic.availableServices],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                        {label}
                      </h4>
                      <div
                        style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: value }}
                      />
                    </div>
                  ) : null
                )}

                {viewClinic.video && (
                  <p style={{ fontSize: 14 }}>
                    <b>Video:</b>{" "}
                    <a href={viewClinic.video} target="_blank" rel="noreferrer">
                      {viewClinic.video}
                    </a>
                  </p>
                )}

                {[
                  ["Rate Card / Catalogue", viewClinic.rateCard],
                  ["Special Offers", viewClinic.specialOffers],
                  ["Certifications / Awards", viewClinic.certifications],
                  ["Clinic Photos", viewClinic.photos],
                ].map(([label, images]) =>
                  images && (images as string[]).length > 0 ? (
                    <div key={label as string} style={{ marginBottom: 20 }}>
                      <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#173252" }}>
                        {label}
                      </h4>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {(images as string[]).map((img, i) => (
                          <img
                            key={i}
                            src={getImage(img)}
                            alt={label as string}
                            style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button className={styles.closeBtn} onClick={() => setViewClinic(null)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListOfClinic;

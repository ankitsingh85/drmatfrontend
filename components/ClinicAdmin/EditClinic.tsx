"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineRadioButtonChecked,
  MdOutlineRadioButtonUnchecked,
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import styles from "@/styles/clinicdashboard/editprofile.module.css";
import { API_URL } from "@/config/api";

type Doctor = {
  name: string;
  regNo: string;
  specialization: string;
};

type ClinicCategory = {
  _id: string;
  name: string;
};

type AddressType = "Clinic" | "Home";

type ClinicAddress = {
  type: AddressType;
  address?: string;
  fullName?: string;
  mobileNo?: string;
  houseNo?: string;
  street?: string;
  localArea?: string;
  pincode?: string;
  district?: string;
  state?: string;
};

type ClinicRecord = {
  _id: string;
  cuc?: string;
  slug?: string;
  clinicName?: string;
  clinicType?: string;
  ownerName?: string;
  website?: string;
  dermaCategory?: ClinicCategory | string;
  clinicLogo?: string;
  bannerImage?: string;
  specialOffers?: string[];
  rateCard?: string[];
  photos?: string[];
  video?: string;
  certifications?: string[];
  doctors?: Doctor[];
  address?: string;
  addresses?: ClinicAddress[];
  city?: string;
  services?: string;
  sector?: string;
  pincode?: string;
  mapLink?: string;
  contactNumber?: string;
  whatsapp?: string;
  email?: string;
  workingHours?: string;
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
  clinicStatus?: string;
};

interface EditClinicProps {
  clinicId?: string;
  clinic?: any;
  onSaved?: (clinic: any) => void;
}

type JwtPayload = {
  id: string;
  role: string;
  exp: number;
};

const ADDRESS_TYPES: AddressType[] = ["Clinic", "Home"];

const emptyDoctor: Doctor = { name: "", regNo: "", specialization: "" };

const emptyAddress: ClinicAddress = {
  type: "Clinic",
  address: "",
  fullName: "",
  mobileNo: "",
  houseNo: "",
  street: "",
  localArea: "",
  pincode: "",
  district: "",
  state: "",
};

const emptyForm = {
  cuc: "",
  slug: "",
  clinicName: "",
  clinicType: "",
  ownerName: "",
  website: "",
  dermaCategory: "",
  clinicLogo: "",
  bannerImage: "",
  specialOffers: "",
  rateCard: "",
  photos: "",
  video: "",
  certifications: "",
  address: "",
  city: "",
  services: "",
  sector: "",
  pincode: "",
  mapLink: "",
  contactNumber: "",
  whatsapp: "",
  email: "",
  workingHours: "",
  licenseNo: "",
  experience: "",
  treatmentsAvailable: "",
  availableServices: "",
  consultationFee: "",
  bookingMode: "",
  clinicDescription: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  standardPlanLink: "",
  clinicStatus: "Open",
};

const resolveMediaUrl = (value?: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("data:")) return value;
  return value.startsWith("/") ? `${API_URL.replace(/\/api$/, "")}${value}` : value;
};

const toTextareaValue = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "string") return value;
  return "";
};

const parseDoctors = (value: unknown): Doctor[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        name: String((item as any)?.name ?? "").trim(),
        regNo: String((item as any)?.regNo ?? "").trim(),
        specialization: String((item as any)?.specialization ?? "").trim(),
      }))
      .filter((item) => item.name && item.regNo && item.specialization);
  }
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    return parseDoctors(JSON.parse(value));
  } catch {
    return [];
  }
};

const getCategoryId = (category?: ClinicCategory | string) => {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category._id || "";
};

const sanitizeAddressType = (value?: string): AddressType => (value === "Home" ? "Home" : "Clinic");

const formatAddressText = (addr: {
  houseNo?: string;
  street?: string;
  localArea?: string;
  pincode?: string;
  district?: string;
  state?: string;
  address?: string;
}) => {
  const parts = [addr.houseNo, addr.street, addr.localArea, addr.district, addr.state, addr.pincode]
    .map((v) => (v || "").trim())
    .filter(Boolean);
  return parts.join(", ") || (addr.address || "").trim();
};

const parseLegacyAddress = (value?: string) => {
  const source = (value || "").trim();
  if (!source) return {};
  const parts = source.split(",").map((part) => part.trim()).filter(Boolean);
  const parsed: Partial<ClinicAddress> = {};
  if (parts[0]) parsed.houseNo = parts[0];
  if (parts[1]) parsed.street = parts[1];
  if (parts[2]) parsed.localArea = parts[2];
  if (parts[3]) parsed.district = parts[3];
  if (parts[4]) parsed.state = parts[4];
  if (parts[5]) parsed.pincode = parts[5].replace(/\D/g, "").slice(0, 6);
  if (!parsed.pincode) {
    const pincodeMatch = source.match(/\b\d{6}\b/);
    if (pincodeMatch) parsed.pincode = pincodeMatch[0];
  }
  return parsed;
};

const normalizeAddress = (addr: any): ClinicAddress => {
  if (!addr || typeof addr !== "object") return { ...emptyAddress };
  const legacy = parseLegacyAddress(addr.address);
  return {
    type: sanitizeAddressType(addr.type),
    address: addr.address || "",
    fullName: addr.fullName || "",
    mobileNo: addr.mobileNo || "",
    houseNo: addr.houseNo || legacy.houseNo || "",
    street: addr.street || legacy.street || "",
    localArea: addr.localArea || legacy.localArea || "",
    pincode: addr.pincode || legacy.pincode || "",
    district: addr.district || legacy.district || "",
    state: addr.state || legacy.state || "",
  };
};

const addressSignature = (addr: ClinicAddress) =>
  [addr.type, addr.fullName, addr.mobileNo, addr.houseNo, addr.street, addr.localArea, addr.pincode, addr.district, addr.state]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");

const mergeAddresses = (base: ClinicAddress[], next: ClinicAddress[]) => {
  const seen = new Set<string>();
  return [...base, ...next].filter((addr) => {
    const normalized = normalizeAddress(addr);
    const key = addressSignature(normalized);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toBackendAddress = (addr: ClinicAddress): ClinicAddress => ({
  ...addr,
  type: sanitizeAddressType(addr.type),
  fullName: (addr.fullName || "").trim(),
  mobileNo: (addr.mobileNo || "").replace(/\D/g, "").slice(0, 10),
  houseNo: (addr.houseNo || "").trim(),
  street: (addr.street || "").trim(),
  localArea: (addr.localArea || "").trim(),
  pincode: (addr.pincode || "").replace(/\D/g, "").slice(0, 6),
  district: (addr.district || "").trim(),
  state: (addr.state || "").trim(),
  address: formatAddressText(addr),
});

const clinicAddressStorageKey = (clinicId?: string) => `clinic-addresses:${clinicId || "guest"}`;
const clinicSelectedAddressStorageKey = (clinicId?: string) => `clinic-address-index:${clinicId || "guest"}`;

const readStoredClinicAddresses = (clinicId?: string) => {
  if (typeof window === "undefined") return [] as ClinicAddress[];
  try {
    const stored = localStorage.getItem(clinicAddressStorageKey(clinicId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? mergeAddresses([], parsed.map(normalizeAddress)) : [];
  } catch {
    return [];
  }
};

const storeClinicAddresses = (clinicId?: string, addresses?: ClinicAddress[], selectedIndex = 0) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(clinicAddressStorageKey(clinicId), JSON.stringify(addresses || []));
    localStorage.setItem(clinicSelectedAddressStorageKey(clinicId), String(selectedIndex));
  } catch {
    // ignore storage failures
  }
};

const initialClinicRecord = (): ClinicRecord | null => null;

export default function EditClinic({ clinicId, clinic, onSaved }: EditClinicProps) {
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [doctors, setDoctors] = useState<Doctor[]>([emptyDoctor]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [specialOfferFiles, setSpecialOfferFiles] = useState<File[]>([]);
  const [rateCardFiles, setRateCardFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [certificationFiles, setCertificationFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [specialOfferPreview, setSpecialOfferPreview] = useState<string[]>([]);
  const [rateCardPreview, setRateCardPreview] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [certificationPreview, setCertificationPreview] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [clinicRecord, setClinicRecord] = useState<ClinicRecord | null>(initialClinicRecord());
  const [addresses, setAddresses] = useState<ClinicAddress[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<ClinicAddress>({ ...emptyAddress });

  const decodedClinicId = useMemo(() => {
    if (clinicId) return clinicId;
    const token = Cookies.get("token");
    if (!token) return "";
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded?.id || "";
    } catch {
      return "";
    }
  }, [clinicId]);

  const fetchPincodeMeta = async (pincode: string) => {
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const office = data?.[0]?.PostOffice?.[0];
      if (!office) return;
      setAddressForm((prev) => ({
        ...prev,
        district: office.District || prev.district,
        state: office.State || prev.state,
      }));
    } catch {
      // Ignore lookup failures and allow manual entry.
    }
  };

  const validateAddress = (addr: ClinicAddress) => {
    if (
      !addr.fullName?.trim() ||
      !addr.houseNo?.trim() ||
      !addr.street?.trim() ||
      !addr.localArea?.trim() ||
      !addr.pincode?.trim() ||
      !addr.district?.trim() ||
      !addr.state?.trim()
    ) {
      alert("Please fill all address fields.");
      return false;
    }
    if (!/^\d{6}$/.test(addr.pincode || "")) {
      alert("Please enter a valid 6-digit pincode.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/clinic-categories`);
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch (error) {
        console.error("Failed to fetch clinic categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const hydrate = (data: ClinicRecord | null) => {
      if (!data) return;

      const apiAddresses = Array.isArray(data.addresses)
        ? mergeAddresses([], data.addresses.map(normalizeAddress))
        : [];
      const legacyAddress = data.address
        ? normalizeAddress({
            type: "Clinic",
            fullName: data.clinicName || "",
            mobileNo: data.contactNumber || "",
            address: data.address,
          })
        : null;
      const storedAddresses = readStoredClinicAddresses(data._id);
      const nextAddresses = mergeAddresses(
        apiAddresses.length > 0 ? apiAddresses : legacyAddress ? [legacyAddress] : [],
        storedAddresses
      );
      const selected = nextAddresses[0] || legacyAddress || normalizeAddress({ type: "Clinic" });

      setClinicRecord({
        ...data,
        addresses: nextAddresses,
        address: formatAddressText(selected) || data.address || "",
      });
      setAddresses(nextAddresses);
      setSelectedAddressIndex(0);
      setAddressForm(selected);
      setForm({
        cuc: data.cuc || "",
        slug: data.slug || "",
        clinicName: data.clinicName || "",
        clinicType: data.clinicType || "",
        ownerName: data.ownerName || "",
        website: data.website || "",
        dermaCategory: getCategoryId(data.dermaCategory),
        clinicLogo: data.clinicLogo || "",
        bannerImage: data.bannerImage || "",
        specialOffers: toTextareaValue(data.specialOffers),
        rateCard: toTextareaValue(data.rateCard),
        photos: toTextareaValue(data.photos),
        video: data.video || "",
        certifications: toTextareaValue(data.certifications),
        address: data.address || "",
        city: data.city || "",
        services: data.services || "",
        sector: data.sector || "",
        pincode: data.pincode || "",
        mapLink: data.mapLink || "",
        contactNumber: data.contactNumber || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        workingHours: data.workingHours || "",
        licenseNo: data.licenseNo || "",
        experience: data.experience || "",
        treatmentsAvailable: data.treatmentsAvailable || "",
        availableServices: data.availableServices || "",
        consultationFee: data.consultationFee || "",
        bookingMode: data.bookingMode || "",
        clinicDescription: data.clinicDescription || "",
        instagram: data.instagram || "",
        linkedin: data.linkedin || "",
        facebook: data.facebook || "",
        standardPlanLink: data.standardPlanLink || "",
        clinicStatus: data.clinicStatus || "Open",
      });

      setDoctors(
        data.doctors && data.doctors.length > 0
          ? data.doctors.map((doctor) => ({
              name: doctor.name || "",
              regNo: doctor.regNo || "",
              specialization: doctor.specialization || "",
            }))
          : [emptyDoctor]
      );

      setLogoPreview(resolveMediaUrl(data.clinicLogo));
      setBannerPreview(resolveMediaUrl(data.bannerImage));
      setSpecialOfferPreview((data.specialOffers || []).map((item) => resolveMediaUrl(item)));
      setRateCardPreview((data.rateCard || []).map((item) => resolveMediaUrl(item)));
      setPhotoPreview((data.photos || []).map((item) => resolveMediaUrl(item)));
      setCertificationPreview((data.certifications || []).map((item) => resolveMediaUrl(item)));
      setLogoFile(null);
      setBannerFile(null);
      setSpecialOfferFiles([]);
      setRateCardFiles([]);
      setPhotoFiles([]);
      setCertificationFiles([]);
      setMessage("");
      setLoading(false);
    };

    if (clinic) {
      hydrate(clinic);
      return;
    }

    const loadClinic = async () => {
      if (!decodedClinicId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/clinics/${decodedClinicId}`);
        if (!res.ok) throw new Error("Failed to fetch clinic profile");
        const data = await res.json();
        hydrate(data);
      } catch (error) {
        console.error("Error fetching clinic:", error);
        setMessage("Failed to load clinic profile");
        setLoading(false);
      }
    };

    loadClinic();
  }, [clinic, decodedClinicId]);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (index: number, field: keyof Doctor, value: string) => {
    setDoctors((prev) =>
      prev.map((doctor, doctorIndex) =>
        doctorIndex === index ? { ...doctor, [field]: value } : doctor
      )
    );
  };

  const addDoctor = () => setDoctors((prev) => [...prev, { ...emptyDoctor }]);

  const removeDoctor = (index: number) => {
    setDoctors((prev) => {
      const next = prev.filter((_, doctorIndex) => doctorIndex !== index);
      return next.length > 0 ? next : [{ ...emptyDoctor }];
    });
  };

  const handleSingleFilePreview =
    (setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setter(file);
      previewSetter(file ? URL.createObjectURL(file) : "");
    };

  const handleMultiFilePreview =
    (setter: React.Dispatch<React.SetStateAction<File[]>>, previewSetter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setter(files);
      previewSetter(files.map((file) => URL.createObjectURL(file)));
    };

  const logoInputChange = handleSingleFilePreview(setLogoFile, setLogoPreview);
  const bannerInputChange = handleSingleFilePreview(setBannerFile, setBannerPreview);
  const specialOffersInputChange = handleMultiFilePreview(setSpecialOfferFiles, setSpecialOfferPreview);
  const rateCardInputChange = handleMultiFilePreview(setRateCardFiles, setRateCardPreview);
  const photosInputChange = handleMultiFilePreview(setPhotoFiles, setPhotoPreview);
  const certificationsInputChange = handleMultiFilePreview(setCertificationFiles, setCertificationPreview);

  const appendValue = (formData: FormData, key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    formData.append(key, String(value));
  };

  const persistClinic = async (nextAddresses = addresses, nextSelectedIndex = selectedAddressIndex) => {
    const clinicKey = clinicRecord?._id || decodedClinicId || clinicId || "";
    const normalizedAddresses = mergeAddresses([], nextAddresses.map(normalizeAddress));
    const safeIndex = normalizedAddresses.length
      ? Math.min(Math.max(nextSelectedIndex, 0), normalizedAddresses.length - 1)
      : 0;
    const selected = normalizedAddresses[safeIndex] || normalizedAddresses[0] || normalizeAddress({ type: "Clinic" });

    const formData = new FormData();
    appendValue(formData, "cuc", form.cuc);
    appendValue(formData, "slug", form.slug);
    appendValue(formData, "clinicName", form.clinicName.trim());
    appendValue(formData, "clinicType", form.clinicType);
    appendValue(formData, "ownerName", form.ownerName);
    appendValue(formData, "website", form.website);
    appendValue(formData, "dermaCategory", form.dermaCategory);
    appendValue(formData, "address", form.address.trim() || formatAddressText(selected));
    appendValue(formData, "city", form.city);
    appendValue(formData, "services", form.services);
    appendValue(formData, "sector", form.sector);
    appendValue(formData, "pincode", form.pincode);
    appendValue(formData, "mapLink", form.mapLink);
    appendValue(formData, "contactNumber", form.contactNumber);
    appendValue(formData, "whatsapp", form.whatsapp);
    appendValue(formData, "email", form.email.trim());
    appendValue(formData, "workingHours", form.workingHours);
    appendValue(formData, "licenseNo", form.licenseNo);
    appendValue(formData, "experience", form.experience);
    appendValue(formData, "treatmentsAvailable", form.treatmentsAvailable);
    appendValue(formData, "availableServices", form.availableServices);
    appendValue(formData, "consultationFee", form.consultationFee);
    appendValue(formData, "bookingMode", form.bookingMode);
    appendValue(formData, "clinicDescription", form.clinicDescription);
    appendValue(formData, "instagram", form.instagram);
    appendValue(formData, "linkedin", form.linkedin);
    appendValue(formData, "facebook", form.facebook);
    appendValue(formData, "standardPlanLink", form.standardPlanLink);
    appendValue(formData, "clinicStatus", form.clinicStatus);
    appendValue(formData, "video", form.video);

    if (logoFile) formData.append("clinicLogo", logoFile);
    if (bannerFile) formData.append("bannerImage", bannerFile);
    specialOfferFiles.forEach((file) => formData.append("specialOffers", file));
    rateCardFiles.forEach((file) => formData.append("rateCard", file));
    photoFiles.forEach((file) => formData.append("photos", file));
    certificationFiles.forEach((file) => formData.append("certifications", file));
    formData.append("doctors", JSON.stringify(parseDoctors(doctors)));
    formData.append("addresses", JSON.stringify(normalizedAddresses.map(toBackendAddress)));

    const res = await fetch(`${API_URL}/clinics/${clinicKey}`, {
      method: "PUT",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to update clinic");

    const updatedClinic: ClinicRecord = {
      ...(clinicRecord || clinic || {}),
      ...data,
      clinicName: data?.clinicName || form.clinicName.trim(),
      email: data?.email || form.email.trim(),
      contactNumber: data?.contactNumber || form.contactNumber,
      ownerName: data?.ownerName || form.ownerName,
      address: data?.address || form.address.trim() || formatAddressText(selected),
      addresses: normalizedAddresses,
    };

    setClinicRecord(updatedClinic);
    setAddresses(normalizedAddresses);
    setSelectedAddressIndex(safeIndex);
    storeClinicAddresses(clinicKey, normalizedAddresses, safeIndex);
    onSaved?.(updatedClinic);
    window.dispatchEvent(new CustomEvent("addresses-updated"));
    window.dispatchEvent(new CustomEvent("profile-updated"));
    return updatedClinic;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decodedClinicId) {
      setMessage("Clinic session expired. Please login again.");
      return;
    }
    if (!form.clinicName.trim() || !form.dermaCategory || !form.address.trim() || !form.email.trim()) {
      setMessage("Clinic name, category, address and email are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await persistClinic();
      setMessage("Clinic profile updated successfully.");
      setLogoFile(null);
      setBannerFile(null);
    } catch (error: any) {
      console.error("Update failed:", error);
      setMessage(error?.message || "Failed to update clinic");
    } finally {
      setSaving(false);
    }
  };

  const openAddAddress = () => {
    setEditingAddressIndex(null);
    setAddressForm({
      ...emptyAddress,
      type: "Clinic",
      fullName: form.clinicName || clinicRecord?.clinicName || "",
      mobileNo: form.contactNumber || clinicRecord?.contactNumber || "",
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (index: number) => {
    const selected = addresses[index];
    if (!selected) return;
    setEditingAddressIndex(index);
    setAddressForm({
      ...normalizeAddress(selected),
      fullName: selected.fullName || form.clinicName || clinicRecord?.clinicName || "",
      mobileNo: selected.mobileNo || form.contactNumber || clinicRecord?.contactNumber || "",
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    const nextAddress = normalizeAddress({
      ...addressForm,
      type: sanitizeAddressType(addressForm.type),
      fullName: addressForm.fullName || form.clinicName || clinicRecord?.clinicName || "",
      mobileNo: addressForm.mobileNo || form.contactNumber || clinicRecord?.contactNumber || "",
    });

    if (!validateAddress(nextAddress)) return;
    setSaving(true);
    setMessage("");
    try {
      const nextAddresses =
        editingAddressIndex === null
          ? mergeAddresses(addresses, [nextAddress])
          : addresses.map((addr, index) => (index === editingAddressIndex ? nextAddress : addr));
      const nextSelectedIndex =
        editingAddressIndex === null ? nextAddresses.length - 1 : editingAddressIndex;
      await persistClinic(nextAddresses, nextSelectedIndex);
      setShowAddressModal(false);
      setEditingAddressIndex(null);
      setMessage("Clinic address saved successfully.");
    } catch (error: any) {
      console.error("Address save failed:", error);
      setMessage(error?.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAddress = async (index: number) => {
    setSelectedAddressIndex(index);
    await persistClinic(addresses, index);
  };

  const handleDeleteAddress = async (index: number) => {
    const nextAddresses = addresses.filter((_, addressIndex) => addressIndex !== index);
    const nextSelectedIndex =
      nextAddresses.length === 0
        ? 0
        : selectedAddressIndex > index
        ? selectedAddressIndex - 1
        : selectedAddressIndex === index
        ? Math.min(index, nextAddresses.length - 1)
        : selectedAddressIndex;

    setAddresses(nextAddresses);
    setSelectedAddressIndex(nextSelectedIndex);
    setClinicRecord((prev) =>
      prev
        ? {
            ...prev,
            addresses: nextAddresses,
            address: formatAddressText(nextAddresses[nextSelectedIndex] || nextAddresses[0] || emptyAddress),
          }
        : prev
    );
    storeClinicAddresses(clinicRecord?._id || decodedClinicId || clinicId || "", nextAddresses, nextSelectedIndex);
    await persistClinic(nextAddresses, nextSelectedIndex);
  };

  const selectedAddress = addresses[selectedAddressIndex] || addresses[0] || normalizeAddress({ type: "Clinic" });

  if (loading) {
    return <div className={styles.loadingState}>Loading clinic profile...</div>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Identity</p>
            <h3 className={styles.sectionTitle}>Clinic Identity</h3>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>CUC</label>
            <input name="cuc" value={form.cuc} disabled className={styles.readOnly} />
          </div>
          <div className={styles.field}>
            <label>Slug</label>
            <input name="slug" value={form.slug} disabled className={styles.readOnly} />
          </div>
          <div className={styles.field}>
            <label>Clinic Name</label>
            <input name="clinicName" value={form.clinicName} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Clinic Type</label>
            <input name="clinicType" value={form.clinicType} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Owner Name</label>
            <input name="ownerName" value={form.ownerName} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Website</label>
            <input name="website" value={form.website} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Category</label>
            <select name="dermaCategory" value={form.dermaCategory} onChange={handleTextChange} required>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Status</label>
            <select name="clinicStatus" value={form.clinicStatus} onChange={handleTextChange}>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Contact</p>
            <h3 className={styles.sectionTitle}>Location & Contact</h3>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Contact Number</label>
            <input name="contactNumber" value={form.contactNumber} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>WhatsApp Number</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Working Hours</label>
            <input name="workingHours" value={form.workingHours} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Address</label>
            <textarea name="address" value={form.address} onChange={handleTextChange} rows={3} />
          </div>
          <div className={styles.field}>
            <label>City</label>
            <input name="city" value={form.city} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Sector</label>
            <input name="sector" value={form.sector} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Pin Code</label>
            <input
              name="pincode"
              value={form.pincode}
              onChange={(e) => {
                handleTextChange(e);
                const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                setForm((prev) => ({ ...prev, pincode }));
              }}
            />
          </div>
          <div className={styles.field}>
            <label>Google Map Link</label>
            <input name="mapLink" value={form.mapLink} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Services</label>
            <input name="services" value={form.services} onChange={handleTextChange} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Addresses</p>
            <h3 className={styles.sectionTitle}>Clinic Addresses</h3>
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={openAddAddress}>
            + Add Address
          </button>
        </div>

        <div className={styles.summaryMeta}>
          <span>{addresses.length} saved address{addresses.length === 1 ? "" : "es"}</span>
          <span>Primary: {selectedAddress.type}</span>
        </div>

        <div className={styles.selectedPreview}>
          <strong>{selectedAddress.fullName || form.clinicName || clinicRecord?.clinicName || "Clinic"}</strong>
          <p>{formatAddressText(selectedAddress) || form.address || clinicRecord?.address || "-"}</p>
          <small>{sanitizeAddressType(selectedAddress.type)}</small>
        </div>

        {showAddressModal && (
          <div className={styles.addressInlineForm}>
            <div className={styles.modalHeader}>
              <h3>{editingAddressIndex === null ? "Add Clinic Address" : "Edit Clinic Address"}</h3>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                <div className={styles.field}>
                  <label>Full Name</label>
                  <input
                    value={addressForm.fullName || ""}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Mobile No</label>
                  <input
                    value={addressForm.mobileNo || ""}
                    onChange={(e) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        mobileNo: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>House No</label>
                  <input
                    value={addressForm.houseNo || ""}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, houseNo: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Street</label>
                  <input
                    value={addressForm.street || ""}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Local Area</label>
                  <input
                    value={addressForm.localArea || ""}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, localArea: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Pincode</label>
                  <input
                    value={addressForm.pincode || ""}
                    onChange={(e) => {
                      const pincode = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setAddressForm((prev) => ({ ...prev, pincode }));
                      fetchPincodeMeta(pincode);
                    }}
                  />
                </div>
                <div className={styles.field}>
                  <label>District</label>
                  <input
                    value={addressForm.district || ""}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, district: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>State</label>
                  <input
                    value={addressForm.state || ""}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Address Type</label>
                  <select
                    value={addressForm.type || "Clinic"}
                    onChange={(e) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        type: sanitizeAddressType(e.target.value),
                      }))
                    }
                  >
                    {ADDRESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setShowAddressModal(false);
                    setEditingAddressIndex(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSaveAddress}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.addressList} style={{ marginTop: 14 }}>
          {addresses.map((addr, index) => {
            const isSelected = selectedAddressIndex === index;
            return (
              <div
                key={`${addr.fullName || form.clinicName || "clinic"}-${index}`}
                className={`${styles.addressCard} ${isSelected ? styles.addressSelected : ""}`}
              >
                <div className={styles.addressTopRow}>
                  <button
                    type="button"
                    className={styles.radioButton}
                    onClick={() => handleSelectAddress(index)}
                    aria-label="Select address"
                  >
                    {isSelected ? <MdOutlineRadioButtonChecked /> : <MdOutlineRadioButtonUnchecked />}
                  </button>
                  <div className={styles.addressText}>
                    <strong>{addr.fullName || form.clinicName || clinicRecord?.clinicName || "Clinic"}</strong>
                    <p>{formatAddressText(addr) || addr.address || "-"}</p>
                    <small>Phone: {addr.mobileNo || form.contactNumber || clinicRecord?.contactNumber || "-"}</small>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className={styles.iconBtn} onClick={() => openEditAddress(index)}>
                      <MdOutlineEdit />
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => handleDeleteAddress(index)}>
                      <MdOutlineDelete />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className={styles.typePill}>{sanitizeAddressType(addr.type)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Branding</p>
            <h3 className={styles.sectionTitle}>Branding & Media</h3>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Clinic Logo</label>
            <input type="file" accept="image/*" onChange={logoInputChange} />
            <p className={styles.helperText}>Choose or upload an image.</p>
            {logoPreview && <img src={logoPreview} alt="Clinic logo preview" className={styles.previewImage} />}
          </div>
          <div className={styles.field}>
            <label>Banner Image</label>
            <input type="file" accept="image/*" onChange={bannerInputChange} />
            <p className={styles.helperText}>Choose or upload an image.</p>
            {bannerPreview && <img src={bannerPreview} alt="Banner preview" className={styles.previewImage} />}
          </div>
          <div className={styles.field}>
            <label>Special Offers</label>
            <input type="file" accept="image/*" multiple onChange={specialOffersInputChange} />
            <p className={styles.helperText}>Choose or upload images for special offers.</p>
            {!!specialOfferPreview.length && (
              <div className={styles.previewStrip}>
                {specialOfferPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Special offer ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label>Rate Card</label>
            <input type="file" accept="image/*" multiple onChange={rateCardInputChange} />
            <p className={styles.helperText}>Choose or upload rate card images.</p>
            {!!rateCardPreview.length && (
              <div className={styles.previewStrip}>
                {rateCardPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Rate card ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label>Photos</label>
            <input type="file" accept="image/*" multiple onChange={photosInputChange} />
            <p className={styles.helperText}>Choose or upload clinic photos.</p>
            {!!photoPreview.length && (
              <div className={styles.previewStrip}>
                {photoPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Photo ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label>Video</label>
            <input name="video" value={form.video} onChange={handleTextChange} />
            <p className={styles.helperText}>Video should be a URL only.</p>
          </div>
          <div className={styles.field}>
            <label>Certifications</label>
            <input type="file" accept="image/*" multiple onChange={certificationsInputChange} />
            <p className={styles.helperText}>Choose or upload certification images.</p>
            {!!certificationPreview.length && (
              <div className={styles.previewStrip}>
                {certificationPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Certification ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Doctors</p>
            <h3 className={styles.sectionTitle}>Doctors & Expertise</h3>
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={addDoctor}>
            + Add Doctor
          </button>
        </div>
        <div className={styles.stack}>
          {doctors.map((doctor, index) => (
            <div key={`${doctor.name}-${index}`} className={styles.doctorCard}>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Doctor Name</label>
                  <input value={doctor.name} onChange={(e) => handleDoctorChange(index, "name", e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>Registration No</label>
                  <input value={doctor.regNo} onChange={(e) => handleDoctorChange(index, "regNo", e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label>Specialization</label>
                  <input value={doctor.specialization} onChange={(e) => handleDoctorChange(index, "specialization", e.target.value)} />
                </div>
              </div>
              <div className={styles.rowActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => removeDoctor(index)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Operations</p>
            <h3 className={styles.sectionTitle}>Operations & Legal</h3>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>License No</label>
            <input name="licenseNo" value={form.licenseNo} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Experience</label>
            <input name="experience" value={form.experience} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Consultation Fee</label>
            <input name="consultationFee" value={form.consultationFee} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Booking Mode</label>
            <input name="bookingMode" value={form.bookingMode} onChange={handleTextChange} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Content</p>
            <h3 className={styles.sectionTitle}>Services & Description</h3>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Treatments Available</label>
            <textarea name="treatmentsAvailable" value={form.treatmentsAvailable} onChange={handleTextChange} rows={4} />
          </div>
          <div className={styles.field}>
            <label>Available Services</label>
            <textarea name="availableServices" value={form.availableServices} onChange={handleTextChange} rows={4} />
          </div>
          <div className={styles.field}>
            <label>Clinic Description</label>
            <textarea name="clinicDescription" value={form.clinicDescription} onChange={handleTextChange} rows={4} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Social</p>
            <h3 className={styles.sectionTitle}>Social Presence</h3>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Instagram</label>
            <input name="instagram" value={form.instagram} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>LinkedIn</label>
            <input name="linkedin" value={form.linkedin} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Facebook</label>
            <input name="facebook" value={form.facebook} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Standard Plan Link</label>
            <input name="standardPlanLink" value={form.standardPlanLink} onChange={handleTextChange} />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

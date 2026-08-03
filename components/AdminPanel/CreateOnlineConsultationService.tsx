"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/Dashboard/createcategory.module.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";

type Doctor = {
  _id: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  specialist?: string;
};

type SlotEntry = { label: string; booked: boolean };

const getDoctorName = (doctor: Doctor) =>
  [doctor.title || "Dr.", doctor.firstName, doctor.lastName].filter(Boolean).join(" ") ||
  "Doctor";

const CreateOnlineConsultationService = () => {
  const toast = useToast();
  const [serviceCode, setServiceCode] = useState("Auto-assigned on save");
  const [loadingCode, setLoadingCode] = useState(true);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);

  const [serviceType, setServiceType] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [slotInput, setSlotInput] = useState("");

  const [serviceImage, setServiceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadNextCode = async () => {
    try {
      setLoadingCode(true);
      const res = await fetch(`${API_URL}/online-consultation-services/next-code`);
      const data = await res.json().catch(() => ({}));
      setServiceCode(res.ok ? data.serviceCode || "Auto-assigned on save" : "Auto-assigned on save");
    } catch {
      setServiceCode("Auto-assigned on save");
    } finally {
      setLoadingCode(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await fetch(`${API_URL}/doctoradmin`);
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    loadNextCode();
    fetchDoctors();
  }, []);

  const isAllowedImage = (file: File) =>
    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedImage(file)) {
      setError("Image must be JPG, JPEG, PNG, or WEBP");
      setServiceImage(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Image must be less than or equal to 1MB");
      setServiceImage(null);
      setPreviewUrl(null);
      return;
    }

    setError("");
    setServiceImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const toggleDoctor = (doctorId: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(doctorId) ? prev.filter((id) => id !== doctorId) : [...prev, doctorId]
    );
  };

  const addSlot = () => {
    const label = slotInput.trim();
    if (!label) return;
    if (slots.some((slot) => slot.label.toLowerCase() === label.toLowerCase())) {
      setSlotInput("");
      return;
    }
    setSlots((prev) => [...prev, { label, booked: false }]);
    setSlotInput("");
  };

  const handleSlotKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSlot();
    }
  };

  const toggleSlotBooked = (label: string) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.label === label ? { ...slot, booked: !slot.booked } : slot))
    );
  };

  const removeSlot = (label: string) => {
    setSlots((prev) => prev.filter((slot) => slot.label !== label));
  };

  const nextAvailableSlotPreview = slots.find((slot) => !slot.booked)?.label || "";

  const resetForm = () => {
    setServiceType("");
    setConsultationFee("");
    setOfferPrice("");
    setDiscountPercent("");
    setSelectedDoctorIds([]);
    setSlots([]);
    setSlotInput("");
    setServiceImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serviceType.trim()) {
      setError("Service type is required");
      return;
    }

    if (selectedDoctorIds.length === 0) {
      setError("Please select at least one doctor");
      return;
    }

    if (!serviceImage) {
      setError("Please select a service image");
      return;
    }

    const feeValue = Number(consultationFee);
    if (!consultationFee.trim() || Number.isNaN(feeValue) || feeValue < 0) {
      setError("Enter a valid consultation fee");
      return;
    }

    if (offerPrice.trim()) {
      const offerValue = Number(offerPrice);
      if (Number.isNaN(offerValue) || offerValue < 0) {
        setError("Enter a valid offer price");
        return;
      }
    }

    if (discountPercent.trim()) {
      const discountValue = Number(discountPercent);
      if (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        setError("Discount % must be between 0 and 100");
        return;
      }
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("serviceType", serviceType.trim());
      formData.append("consultationFee", String(feeValue));
      if (offerPrice.trim()) formData.append("offerPrice", offerPrice.trim());
      if (discountPercent.trim()) formData.append("discountPercent", discountPercent.trim());
      formData.append("doctors", JSON.stringify(selectedDoctorIds));
      formData.append("timingSlots", JSON.stringify(slots.map((slot) => slot.label)));
      formData.append(
        "bookedSlots",
        JSON.stringify(slots.filter((slot) => slot.booked).map((slot) => slot.label))
      );
      formData.append("imageUrl", serviceImage);

      const response = await fetch(`${API_URL}/online-consultation-services`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create service");

      resetForm();
      toast.success("Online consultation service created successfully");
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
      loadNextCode();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Online Consultation Service Details</h2>

          <div className={styles.field}>
            <label className={styles.label}>Service Code</label>
            <input
              className={styles.readOnlyInput}
              value={serviceCode}
              readOnly
              placeholder={loadingCode ? "Generating..." : ""}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Service Type<span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className={styles.input}
              placeholder="e.g. Dermatology Consultation"
              required
            />
          </div>

          <div className={styles.fullField}>
            <label className={styles.label}>
              Doctors<span className={styles.required}>*</span>
            </label>
            <div className={styles.checkboxScrollBox}>
              {loadingDoctors ? (
                <span>Loading doctors...</span>
              ) : doctors.length === 0 ? (
                <span>No doctors found. Create one from the dashboard first.</span>
              ) : (
                doctors.map((doctor) => (
                  <label
                    key={doctor._id}
                    style={{ display: "block", marginBottom: "8px", cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDoctorIds.includes(doctor._id)}
                      onChange={() => toggleDoctor(doctor._id)}
                    />{" "}
                    {getDoctorName(doctor)}
                    {doctor.specialist ? ` — ${doctor.specialist}` : ""}
                  </label>
                ))
              )}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pricing</h2>

          <div className={styles.field}>
            <label className={styles.label}>
              Consultation Fee (INR)<span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value.replace(/[^0-9.]/g, ""))}
              className={styles.input}
              placeholder="e.g. 499"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Offer Price (INR)</label>
            <input
              type="text"
              inputMode="decimal"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              className={styles.input}
              placeholder="e.g. 399 (optional)"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value.replace(/[^0-9.]/g, ""))}
              className={styles.input}
              placeholder="e.g. 20 (optional)"
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Availability</h2>

          <div className={styles.fullField}>
            <label className={styles.label}>Timing Slots</label>
            <div className={styles.tagInputRow}>
              <input
                type="text"
                className={styles.input}
                value={slotInput}
                onChange={(e) => setSlotInput(e.target.value)}
                onKeyDown={handleSlotKeyDown}
                placeholder="e.g. 10:00 AM - 10:30 AM, press Enter to add"
              />
              <button type="button" className={styles.tagAddButton} onClick={addSlot}>
                Add
              </button>
            </div>

            {slots.length > 0 && (
              <div className={styles.tagChips}>
                {slots.map((slot) => (
                  <div
                    key={slot.label}
                    className={`${styles.tagChip} ${slot.booked ? styles.tagChipBooked : ""}`}
                  >
                    <span className={styles.tagChipText}>{slot.label}</span>
                    <button
                      type="button"
                      className={styles.tagChipBookedToggle}
                      onClick={() => toggleSlotBooked(slot.label)}
                    >
                      {slot.booked ? "Booked" : "Mark booked"}
                    </button>
                    <button
                      type="button"
                      className={styles.tagChipRemove}
                      onClick={() => removeSlot(slot.label)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {slots.length > 0 && (
              <p className={styles.nextSlotBanner}>
                Next available slot:{" "}
                {nextAvailableSlotPreview || "None — all slots are booked"}
              </p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Media</h2>

          <div className={styles.fullField}>
            <label className={styles.label}>
              Service Image<span className={styles.required}>*</span>
            </label>

            <div className={styles.uploadBox}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </button>
              <span className={styles.uploadHint}>JPG/PNG/WEBP - Max 1MB</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />

            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className={styles.preview} />
            ) : (
              <p className={styles.noImage}>No image selected</p>
            )}
          </div>
        </section>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Add Online Consultation Service"}
        </button>
      </form>
    </div>
  );
};

export default CreateOnlineConsultationService;

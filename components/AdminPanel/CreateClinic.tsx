"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Dashboard/createclinic.module.css";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

/* ================= TYPES ================= */
interface Doctor {
  name: string;
  regNo: string;
  specialization: string;
}

interface ClinicCategory {
  _id: string;
  name: string;
}

interface WorkingHours {
  openTime: string;
  closeTime: string;
  days: string[];
  offDays: string[];
}

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* ================= BASE64 HELPER ================= */
export default function CreateClinic() {
  const [cuc, setCuc] = useState("Auto-assigned on save");
  const [videoUrls, setVideoUrls] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  /* ================= CATEGORY STATE ================= */
  const [categories, setCategories] = useState<ClinicCategory[]>([]);

  /* ================= DOCTOR MODAL STATE ================= */
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState<Doctor>({
    name: "",
    regNo: "",
    specialization: "",
  });

  /* ================= WORKING HOURS STATE ================= */
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    openTime: "",
    closeTime: "",
    days: [],
    offDays: [],
  });

  const handleWorkingTimeChange = (
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setWorkingHours((prev) => ({ ...prev, [field]: value }));
  };

  // Toggling a day as a "working day" removes it from "off days" and vice versa.
  const toggleWorkingDay = (day: string) => {
    setWorkingHours((prev) => {
      const isSelected = prev.days.includes(day);
      return {
        ...prev,
        days: isSelected
          ? prev.days.filter((d) => d !== day)
          : [...prev.days, day],
        offDays: isSelected
          ? prev.offDays
          : prev.offDays.filter((d) => d !== day),
      };
    });
  };

  const toggleOffDay = (day: string) => {
    setWorkingHours((prev) => {
      const isSelected = prev.offDays.includes(day);
      return {
        ...prev,
        offDays: isSelected
          ? prev.offDays.filter((d) => d !== day)
          : [...prev.offDays, day],
        days: isSelected ? prev.days : prev.days.filter((d) => d !== day),
      };
    });
  };

  /* ================= MAIN FORM STATE ================= */
  const [form, setForm] = useState({
    clinicName: "",
    dermaCategory: "",

    /* 🔥 MEDIA (BASE64) */
    clinicLogo: "",
    bannerImage: "",
    specialOffers: [] as string[],
    rateCard: "",
    photos: [] as string[],
    videos: [] as string[],
    certifications: [] as string[],

    clinicType: "",
    ownerName: "",
    website: "",

    address: "",
    city: "",
    services: "",
    sector: "",
    pincode: "",
    mapLink: "",
    contactNumber: "",
    whatsapp: "",
    email: "",
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
    verifiedBadge: "no",
    isActive: "true",
  });

  const [media, setMedia] = useState({
    clinicLogo: null as File | null,
    bannerImage: null as File | null,
    rateCard: null as File | null,
    specialOffers: [] as File[],
    photos: [] as File[],
    certifications: [] as File[],
  });

  /* ================= FETCH CLINIC CATEGORIES ================= */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/clinic-categories`);
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  /* ================= TEXT / CHECKBOX HANDLER ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  /* ================= FILE HANDLER ================= */
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field:
      | "clinicLogo"
      | "bannerImage"
      | "rateCard"
      | "specialOffers"
      | "photos"
      | "certifications"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (field === "specialOffers" || field === "photos" || field === "certifications") {
      setMedia((prev) => ({
        ...prev,
        [field]: [...prev[field], ...Array.from(files)],
      }));
    } else {
      setMedia((prev) => ({
        ...prev,
        [field]: files[0],
      }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      dermaCategory: e.target.value,
    }));
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDoctorForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveDoctor = () => {
    if (!doctorForm.name || !doctorForm.regNo || !doctorForm.specialization) {
      alert("Please fill all doctor details");
      return;
    }
    setDoctors((prev) => [...prev, doctorForm]);
    setDoctorForm({ name: "", regNo: "", specialization: "" });
    setShowDoctorModal(false);
  };

  const removeDoctor = (index: number) => {
    setDoctors((prev) => prev.filter((_, doctorIndex) => doctorIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.clinicName.trim() ||
      !form.dermaCategory ||
      !form.address.trim() ||
      !form.email.trim()
    ) {
      alert("Please fill Clinic Name, Category, Address and Email before creating the clinic.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("clinicName", form.clinicName);
      formData.append("dermaCategory", form.dermaCategory);
      formData.append("clinicType", form.clinicType);
      formData.append("ownerName", form.ownerName);
      formData.append("website", form.website);
      formData.append("address", form.address);
      formData.append("city", form.city);
      formData.append("services", form.services);
      formData.append("sector", form.sector);
      formData.append("pincode", form.pincode);
      formData.append("mapLink", form.mapLink);
      formData.append("contactNumber", form.contactNumber);
      formData.append("whatsapp", form.whatsapp);
      formData.append("email", form.email);
      formData.append("workingHours", JSON.stringify(workingHours));
      formData.append("clinicDescription", form.clinicDescription);
      formData.append("licenseNo", form.licenseNo);
      formData.append("experience", form.experience);
      formData.append("treatmentsAvailable", form.treatmentsAvailable);
      formData.append("availableServices", form.availableServices);
      formData.append("consultationFee", form.consultationFee);
      formData.append("bookingMode", form.bookingMode);
      formData.append("instagram", form.instagram);
      formData.append("linkedin", form.linkedin);
      formData.append("facebook", form.facebook);
      formData.append("standardPlanLink", form.standardPlanLink);
      formData.append("clinicStatus", form.clinicStatus);
      formData.append("verifiedBadge", String(form.verifiedBadge === "yes"));
      formData.append("isActive", form.isActive);
      formData.append("videos", JSON.stringify(
        videoUrls
          .split(/\r?\n|,/)
          .map((url) => url.trim())
          .filter(Boolean)
      ));
      formData.append("doctors", JSON.stringify(doctors));

      if (media.clinicLogo) formData.append("clinicLogo", media.clinicLogo);
      if (media.bannerImage) formData.append("bannerImage", media.bannerImage);
      if (media.rateCard) formData.append("rateCard", media.rateCard);
      media.specialOffers.forEach((file) => formData.append("specialOffers", file));
      media.photos.forEach((file) => formData.append("photos", file));
      media.certifications.forEach((file) => formData.append("certifications", file));

      const res = await fetch(`${API_URL}/clinics`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.message ||
          data?.error ||
          "Failed to create clinic";
        throw new Error(message);
      }

      const createdCuc = data?.clinic?.cuc || "Auto-assigned on save";
      alert(`Clinic created successfully. CUC: ${createdCuc}`);
      setCuc(createdCuc);
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
    } catch (error) {
      console.error("Failed to create clinic:", error);
      alert(error instanceof Error ? error.message : "Failed to create clinic");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= JSX ================= */
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ================= 1. CLINIC IDENTITY ================= */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Clinic Identity</h2>

            <div className={styles.field}>
              <label>Clinic Unique Code</label>
              <input value={cuc} disabled className={styles.readonlyInput} />
            </div>

            <div className={styles.field}>
              <label>Clinic Name</label>
              <input className={styles.input} name="clinicName" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Clinic Category</label>
              <select className={styles.input} value={form.dermaCategory} onChange={handleCategoryChange}>
                <option value="">Select Clinic Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Clinic Type</label>
              <input className={styles.input} name="clinicType" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Contact Number</label>
              <input className={styles.input} name="contactNumber" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Owner Name</label>
              <input className={styles.input} name="ownerName" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Website</label>
              <input className={styles.input} name="website" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Verified Badge</label>
              <select
                className={styles.input}
                name="verifiedBadge"
                value={form.verifiedBadge}
                onChange={handleChange}
              >
                <option value="no">Verified Badge: No</option>
                <option value="yes">Verified Badge: Yes</option>
              </select>
            </div>
          </section>

          {/* ================= 2. BRANDING & MEDIA ================= */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Branding & Media</h2>

            <div className={styles.field}>
              <label>Clinic Logo</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className={styles.input}
                onChange={(e) => handleFileChange(e, "clinicLogo")}
              />
            </div>

            <div className={styles.field}>
              <label>Banner Image</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className={styles.input}
                onChange={(e) => handleFileChange(e, "bannerImage")}
              />
            </div>

            <div className={styles.field}>
              <label>Special Offers (Images)</label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className={styles.input}
                onChange={(e) => handleFileChange(e, "specialOffers")}
              />
            </div>

            <div className={styles.field}>
              <label>Rate Card / Catalogue</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className={styles.input}
                onChange={(e) => handleFileChange(e, "rateCard")}
              />
            </div>

            <div className={styles.field}>
              <label>Photos</label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className={styles.input}
                onChange={(e) => handleFileChange(e, "photos")}
              />
            </div>

            <div className={styles.field}>
              <label>Videos</label>
              <textarea
                className={styles.textarea}
                value={videoUrls}
                onChange={(e) => setVideoUrls(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Certifications / Awards (Images)</label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className={styles.input}
                onChange={(e) => handleFileChange(e, "certifications")}
              />
            </div>
          </section>

          {/* 3. DOCTORS & EXPERTISE */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Doctors & Expertise</h2>

            <button
              type="button"
              className={styles.addDoctorBtn}
              onClick={() => setShowDoctorModal(true)}
            >
              + Add Doctor
            </button>

            {doctors.map((doc, i) => (
              <div key={i} className={styles.doctorCard}>
                <div>
                  <strong>{doc.name}</strong>
                  <span>Reg No: {doc.regNo}</span>
                  <span>{doc.specialization}</span>
                </div>
                <button
                  type="button"
                  className={styles.removeDoctorBtn}
                  onClick={() => removeDoctor(i)}
                >
                  Delete
                </button>
              </div>
            ))}

            <div className={styles.field}>
              <label>Standard Treatment Plan Link</label>
              <input
                className={styles.input}
                name="standardPlanLink"
                onChange={handleChange}
              />
            </div>
          </section>

          {/* 4. LOCATION & CONTACT */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Location & Contact</h2>

            <div className={styles.field}>
              <label>Clinic Address</label>
              <textarea className={styles.textarea} name="address" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>City</label>
              <input className={styles.input} name="city" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Services</label>
              <input className={styles.input} name="services" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Sector</label>
              <input className={styles.input} name="sector" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Pin Code</label>
              <input className={styles.input} name="pincode" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Google Maps Link</label>
              <input className={styles.input} name="mapLink" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Email Address</label>
              <input className={styles.input} name="email" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Whatsapp Contact</label>
              <input className={styles.input} name="whatsapp" onChange={handleChange} />
            </div>

            {/* ===== WORKING HOURS (WhatsApp-Business style) ===== */}
            <div className={styles.field}>
              <label>Working Hours</label>

              <div style={{ display: "flex", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
                    Opening Time
                  </label>
                  <input
                    type="time"
                    className={styles.input}
                    value={workingHours.openTime}
                    onChange={(e) => handleWorkingTimeChange("openTime", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
                    Closing Time
                  </label>
                  <input
                    type="time"
                    className={styles.input}
                    value={workingHours.closeTime}
                    onChange={(e) => handleWorkingTimeChange("closeTime", e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>
                  Working Days
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {WEEK_DAYS.map((day) => {
                    const selected = workingHours.days.includes(day);
                    return (
                      <button
                        key={`work-${day}`}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "16px",
                          border: selected ? "1px solid #16a34a" : "1px solid #ccc",
                          background: selected ? "#dcfce7" : "#fff",
                          color: selected ? "#166534" : "#333",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>
                  Clinic Off Days
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {WEEK_DAYS.map((day) => {
                    const selected = workingHours.offDays.includes(day);
                    return (
                      <button
                        key={`off-${day}`}
                        type="button"
                        onClick={() => toggleOffDay(day)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "16px",
                          border: selected ? "1px solid #dc2626" : "1px solid #ccc",
                          background: selected ? "#fee2e2" : "#fff",
                          color: selected ? "#991b1b" : "#333",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
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
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Clinic Description</h2>

            <div className={styles.field}>
              <label>Description</label>
              <ReactQuill
                className={styles.ql_Container}
                theme="snow"
                value={form.clinicDescription}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, clinicDescription: value }))
                }
                modules={quillModules}
              />
            </div>
          </section>

          {/* 6. OPERATIONS & LEGAL */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Operations & Legal</h2>

            <div className={styles.field}>
              <label>Clinic Establishment License No.</label>
              <input className={styles.input} name="licenseNo" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Years of Experience</label>
              <input className={styles.input} name="experience" onChange={handleChange} />
            </div>
          </section>

          {/* 7. SERVICES & TREATMENTS */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Services & Treatments</h2>

            <div className={styles.field}>
              <label>Treatments Available</label>
              <ReactQuill
                className={styles.ql_Container}
                theme="snow"
                value={form.treatmentsAvailable}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, treatmentsAvailable: value }))
                }
                modules={quillModules}
              />
            </div>

            <div className={styles.field}>
              <label>Available Services</label>
              <ReactQuill
                className={styles.ql_Container}
                theme="snow"
                value={form.availableServices}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, availableServices: value }))
                }
                modules={quillModules}
              />
            </div>
          </section>

          {/* 8. PRICING & BOOKING */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Pricing & Booking</h2>

            <div className={styles.field}>
              <label>Consultation Fee</label>
              <input className={styles.input} name="consultationFee" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Booking Mode</label>
              <input className={styles.input} name="bookingMode" onChange={handleChange} />
            </div>
          </section>

          {/* 9. SOCIAL */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Social Presence</h2>

            <div className={styles.field}>
              <label>Instagram</label>
              <input className={styles.input} name="instagram" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>LinkedIn</label>
              <input className={styles.input} name="linkedin" onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <label>Facebook</label>
              <input className={styles.input} name="facebook" onChange={handleChange} />
            </div>
          </section>

          <button className={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Clinic"}
          </button>
        </form>
      </div>

      {/* DOCTOR MODAL */}
      {showDoctorModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Add Doctor</h3>

            <div className={styles.field}>
              <label>Doctor Name</label>
              <input
                className={styles.input}
                name="name"
                value={doctorForm.name}
                onChange={handleDoctorChange}
              />
            </div>

            <div className={styles.field}>
              <label>Registration No</label>
              <input
                className={styles.input}
                name="regNo"
                value={doctorForm.regNo}
                onChange={handleDoctorChange}
              />
            </div>

            <div className={styles.field}>
              <label>Specialization</label>
              <input
                className={styles.input}
                name="specialization"
                value={doctorForm.specialization}
                onChange={handleDoctorChange}
              />
            </div>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowDoctorModal(false)}>Cancel</button>
              <button type="button" onClick={saveDoctor}>Save Doctor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
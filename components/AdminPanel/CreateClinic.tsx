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

/* ================= BASE64 HELPER ================= */
export default function CreateClinic() {
  const [cuc] = useState(`CUC-${Date.now().toString().slice(-6)}`);
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
    workingHours: "",

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      formData.append("cuc", cuc);
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
      formData.append("workingHours", form.workingHours);
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

      alert("Clinic created successfully");
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
        {/* <h1 className={styles.heading}>Create Clinic</h1> */}

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ================= 1. CLINIC IDENTITY ================= */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Clinic Identity</h2>
            <input value={cuc} disabled className={styles.readonlyInput} />

            <input className={styles.input} name="clinicName" placeholder="Clinic Name" onChange={handleChange} />

            <select className={styles.input} value={form.dermaCategory} onChange={handleCategoryChange}>
              <option value="">Select Clinic Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            <input className={styles.input} name="clinicType" placeholder="Clinic Type" onChange={handleChange} />
            <input className={styles.input} name="ownerName" placeholder="Owner Name" onChange={handleChange} />
            <input className={styles.input} name="website" placeholder="Website" onChange={handleChange} />
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
      placeholder="Add video URL(s), one per line"
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
           {/* 3. DOCTORS & EXPERTISE (UPDATED ONLY SECTION) */}
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
                <strong>{doc.name}</strong>
                <span>Reg No: {doc.regNo}</span>
                <span>{doc.specialization}</span>
              </div>
            ))}

            <input
              className={styles.input}
              name="standardPlanLink"
              placeholder="Standard Treatment Plan Link"
              onChange={handleChange}
            />
          </section>

{/* 4. LOCATION & CONTACT */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Location & Contact</h2>

            <textarea className={styles.textarea} name="address" placeholder="Clinic Address" onChange={handleChange} />
            <input className={styles.input} name="city" placeholder="City" onChange={handleChange} />
            <input className={styles.input} name="services" placeholder="Services" onChange={handleChange} />
            <input className={styles.input} name="sector" placeholder="Sector" onChange={handleChange} />
            <input className={styles.input} name="pincode" placeholder="Pin Code" onChange={handleChange} />
            <input className={styles.input} name="mapLink" placeholder="Google Maps Link" onChange={handleChange} />
            <input className={styles.input} name="contactNumber" placeholder="Clinic Contact Number" onChange={handleChange} />
            <input className={styles.input} name="email" placeholder="Email Address" onChange={handleChange} />
            <input className={styles.input} name="whatsapp" placeholder="Whatsapp Contact" onChange={handleChange} />
            <input className={styles.input} name="workingHours" placeholder="Working Hours / Days" onChange={handleChange} />
          </section>

          {/* 5. OPERATIONS & LEGAL */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Operations & Legal</h2>

            <input className={styles.input} name="licenseNo" placeholder="Clinic Establishment License No." onChange={handleChange} />
            <input className={styles.input} name="experience" placeholder="Years of Experience" onChange={handleChange} />
          </section>

          {/* 6. SERVICES & TREATMENTS */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Services & Treatments</h2>

            <div className={styles.field}>
              <label>Treatments Available</label>
              <ReactQuill
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
                theme="snow"
                value={form.availableServices}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, availableServices: value }))
                }
                modules={quillModules}
              />
            </div>
          </section>

          {/* 7. PRICING & BOOKING */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Pricing & Booking</h2>

            <input className={styles.input} name="consultationFee" placeholder="Consultation Fee" onChange={handleChange} />
            <input className={styles.input} name="bookingMode" placeholder="Booking Mode" onChange={handleChange} />
          </section>

          {/* 9. SOCIAL */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Social Presence</h2>

            <input className={styles.input} name="instagram" placeholder="Instagram" onChange={handleChange} />
            <input className={styles.input} name="linkedin" placeholder="LinkedIn" onChange={handleChange} />
            <input className={styles.input} name="facebook" placeholder="Facebook" onChange={handleChange} />
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
            <input className={styles.input} name="name" placeholder="Doctor Name" value={doctorForm.name} onChange={handleDoctorChange} />
            <input className={styles.input} name="regNo" placeholder="Registration No" value={doctorForm.regNo} onChange={handleDoctorChange} />
            <input className={styles.input} name="specialization" placeholder="Specialization" value={doctorForm.specialization} onChange={handleDoctorChange} />
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




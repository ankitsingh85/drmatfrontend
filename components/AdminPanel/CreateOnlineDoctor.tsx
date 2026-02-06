"use client";

import React, { useState } from "react";
import styles from "@/styles/Dashboard/createonlinedoctor.module.css";

export default function CreateOnlineDoctor() {
  /* ================= AUTO ODUC ================= */
  const [oduc] = useState(`ODUC-${Date.now().toString().slice(-6)}`);

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    doctorName: "",
    clinicName: "",
    serviceType: "",

    headerBannerImages: "",
    profilePicture: "",

    specialization: "",
    experience: "",
    qualifications: "",

    consultationType: "",
    videoCallWindow: false,
    consultationFee: "",
    paymentOptions: "",

    consultationCount: "",
    languagesSpoken: "",
    workingDays: "",
    timingSlot: "",

    bookedSlot: "",
    nextAvailableSlot: "",
    consultationDuration: "",

    patientId: "",
    patientName: "",

    prescriptionForm: "",
    doctorRegistrationNumber: "",
    onlinePrescriptionSupport: false,
    followUpPolicy: "",
    treatmentSpeciality: "",

    bio: "",
    ratings: "",
    patientReviews: "",

    verifiedBadge: false,
    certificatesAwards: "",

    consultNow: true,
    digitalConsentRequired: false,
    recordSharingAllowed: false,

    offerDiscount: "",
    affiliation: "",
  });

  /* ================= HANDLER ================= */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      oduc,
      ...form,
    };

    console.log("✅ ONLINE DOCTOR PAYLOAD", payload);
    alert("Online Doctor saved successfully (check console)");
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Online Doctor</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ================= BASIC INFO ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Doctor Basic Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>Online Doctor Unique Code</label>
            <input className={styles.readonlyInput} value={oduc} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Doctor Name</label>
            <input className={styles.input} name="doctorName" onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Clinic Name</label>
            <input className={styles.input} name="clinicName" onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Service Type</label>
            <input className={styles.input} name="serviceType" onChange={handleChange} />
          </div>
        </div>

        {/* ================= MEDIA ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Media</h3>

          <div className={styles.field}>
            <label className={styles.label}>Header Banner Images</label>
            <input className={styles.input} name="headerBannerImages" placeholder="Upload / URL" onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Profile Picture</label>
            <input className={styles.input} name="profilePicture" placeholder="Upload / URL" onChange={handleChange} />
          </div>
        </div>

        {/* ================= PROFESSIONAL ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Professional Details</h3>

          <input className={styles.input} name="specialization" placeholder="Doctor Specialization" onChange={handleChange} />
          <input className={styles.input} name="experience" placeholder="Doctor Experience" onChange={handleChange} />
          <input className={styles.input} name="qualifications" placeholder="Qualifications" onChange={handleChange} />
          <input className={styles.input} name="doctorRegistrationNumber" placeholder="Doctor Registration Number" onChange={handleChange} />
        </div>

        {/* ================= CONSULTATION ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Consultation Details</h3>

          <input className={styles.input} name="consultationType" placeholder="Consultation Type" onChange={handleChange} />
          <input className={styles.input} name="consultationFee" placeholder="Consultation Fee" onChange={handleChange} />
          <input className={styles.input} name="paymentOptions" placeholder="Payment Options" onChange={handleChange} />
          <input className={styles.input} name="consultationCount" placeholder="Count of Consultation Done" onChange={handleChange} />
          <input className={styles.input} name="consultationDuration" placeholder="Consultation Duration" onChange={handleChange} />
        </div>

        {/* ================= SCHEDULE ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Schedule & Slots</h3>

          <input className={styles.input} name="languagesSpoken" placeholder="Languages Spoken" onChange={handleChange} />
          <input className={styles.input} name="workingDays" placeholder="Working Days" onChange={handleChange} />
          <input className={styles.input} name="timingSlot" placeholder="Timing Slot" onChange={handleChange} />
          <input className={styles.input} name="bookedSlot" placeholder="Booked Slot (Date & Time)" onChange={handleChange} />
          <input className={styles.input} name="nextAvailableSlot" placeholder="Next Available Slot (Date & Time)" onChange={handleChange} />
        </div>

        {/* ================= PATIENT ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Patient Mapping</h3>

          <input className={styles.input} name="patientId" placeholder="Patient ID" onChange={handleChange} />
          <input className={styles.input} name="patientName" placeholder="Patient Name" onChange={handleChange} />
        </div>

        {/* ================= PRESCRIPTION ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Prescription & Policy</h3>

          <textarea className={styles.textarea} name="prescriptionForm" placeholder="Prescription Form (Doctor Details)" onChange={handleChange} />
          <textarea className={styles.textarea} name="followUpPolicy" placeholder="Follow-up Policy" onChange={handleChange} />
          <input className={styles.input} name="treatmentSpeciality" placeholder="Treatment Speciality" onChange={handleChange} />
        </div>

        {/* ================= PROFILE & REVIEWS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Profile & Reviews</h3>

          <textarea className={styles.textarea} name="bio" placeholder="Doctor / Clinic Bio" onChange={handleChange} />
          <input className={styles.input} name="ratings" placeholder="Ratings" onChange={handleChange} />
          <textarea className={styles.textarea} name="patientReviews" placeholder="Patient Reviews" onChange={handleChange} />
          <input className={styles.input} name="certificatesAwards" placeholder="Certificates & Awards" onChange={handleChange} />
        </div>

        {/* ================= ADMIN CONTROLS ================= */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Admin Controls</h3>

          <div className={styles.switchRow}>
            <label>
              <input type="checkbox" name="videoCallWindow" checked={form.videoCallWindow} onChange={handleChange} />
              Chat / Online Video Call Window
            </label>

            <label>
              <input type="checkbox" name="onlinePrescriptionSupport" checked={form.onlinePrescriptionSupport} onChange={handleChange} />
              Online Prescription Support
            </label>

            <label>
              <input type="checkbox" name="verifiedBadge" checked={form.verifiedBadge} onChange={handleChange} />
              Verified Badge
            </label>

            <label>
              <input type="checkbox" name="digitalConsentRequired" checked={form.digitalConsentRequired} onChange={handleChange} />
              Digital Consent Required
            </label>

            <label>
              <input type="checkbox" name="recordSharingAllowed" checked={form.recordSharingAllowed} onChange={handleChange} />
              Record Sharing Allowed
            </label>

            <label>
              <input type="checkbox" name="consultNow" checked={form.consultNow} onChange={handleChange} />
              Consult Now Button
            </label>
          </div>

          <input className={styles.input} name="offerDiscount" placeholder="Offer / Discount %" onChange={handleChange} />
          <input className={styles.input} name="affiliation" placeholder="Affiliation (Platform / Clinic)" onChange={handleChange} />
        </div>

        <button className={styles.submitBtn}>Save Online Doctor</button>
      </form>
    </div>
  );
}

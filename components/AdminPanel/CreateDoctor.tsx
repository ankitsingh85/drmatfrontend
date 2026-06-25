"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/createdoctor.module.css";
import { resolveMediaUrl } from "@/lib/media";

const CreateDoctor = () => {
  const [nextDoctorCode, setNextDoctorCode] = useState("Dr-000000-1");
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    specialist: "",
    email: "",
    phone: "",
    description: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [newSpecialist, setNewSpecialist] = useState("");
  const [specialists, setSpecialists] = useState<string[]>([
    "Dermatologist",
    "Cardiologist",
    "Neurologist",
    "Pediatrician",
    "Orthopedic",
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const titles = ["Dr.", "Prof.", "Mr.", "Ms."];

  const fetchNextDoctorCode = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/doctors/next-code`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.doctorCode) {
        setNextDoctorCode(data.doctorCode);
      }
    } catch {
      setNextDoctorCode("Dr-000000-1");
    }
  };

  useEffect(() => {
    void fetchNextDoctorCode();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });
      if (profileImage) {
        payload.append("profileImage", profileImage);
      }

      const res = await fetch(`${API_URL}/doctors`, {
        method: "POST",
        body: payload,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(
          data?.doctor?.doctorCode
            ? `Doctor created successfully. Code: ${data.doctor.doctorCode}`
            : "Doctor created successfully"
        );
        window.dispatchEvent(new Event("admin-dashboard:create-success"));

        await fetchNextDoctorCode();

        setFormData({
          title: "",
          firstName: "",
          lastName: "",
          specialist: "",
          email: "",
          phone: "",
          description: "",
        });
        setProfileImage(null);
        setProfilePreview("");
      } else {
        setMessage(data.message || "❌ Failed to create doctor");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please upload an image file.");
      return;
    }

    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleAddSpecialist = () => {
    const specialist = newSpecialist.trim();
    if (!specialist) return;

    const alreadyExists = specialists.some(
      (item) => item.toLowerCase() === specialist.toLowerCase()
    );

    if (!alreadyExists) {
      setSpecialists((prev) => [...prev, specialist]);
    }

    setFormData((prev) => ({ ...prev, specialist }));
    setNewSpecialist("");
  };

  const handleNewSpecialistKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSpecialist();
    }
  };

  return (
    <div className={styles.container}>
      {message && <p>{message}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ===== BASIC INFO ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>

          <div className={styles.field}>
            <label className={styles.label}>Doctor Code</label>
            <input
              name="doctorCode"
              value={nextDoctorCode}
              className={styles.input}
              readOnly
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <select
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Select Title</option>
              {titles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>First Name</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Last Name</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Specialist</label>
            <input
              type="text"
              value={newSpecialist}
              onChange={(e) => setNewSpecialist(e.target.value)}
              onKeyDown={handleNewSpecialistKeyDown}
              onBlur={handleAddSpecialist}
              className={styles.input}
              placeholder="Type new specialist and press Enter"
            />
            <select
              name="specialist"
              value={formData.specialist}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Select Specialist</option>
              {specialists.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.profileImageField}>
            <label className={styles.label}>Profile Picture</label>
            <div className={styles.profileImageRow}>
              <div className={styles.profilePreview}>
                {profilePreview ? (
                  <img
                    src={resolveMediaUrl(profilePreview) || profilePreview}
                    alt="Doctor profile preview"
                  />
                ) : (
                  <span>Photo</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className={styles.input}
              />
            </div>
          </div>
        </div>

        {/* ===== CREDENTIALS ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Login Credentials</h2>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        </div>

        {/* ===== DESCRIPTION ===== */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Doctor Description</h2>

          <div className={styles.fullField}>
            <label className={styles.label}>About Doctor</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Write doctor profile, experience, qualifications..."
            />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Doctor"}
        </button>
      </form>
    </div>
  );
};

export default CreateDoctor;
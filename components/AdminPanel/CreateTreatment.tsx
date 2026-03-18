"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/clinicdashboard/clinicservices.module.css";
import "react-quill/dist/quill.snow.css";
import { API_URL } from "@/config/api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface Clinic {
  _id: string;
  clinicName: string;
}

interface ServiceCategory {
  _id: string;
  name: string;
}

export default function CreateTreatmentPlan() {
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );

  const [tuc] = useState(() => {
    const timePart = Date.now().toString().slice(-8);
    const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TUC-${timePart}-${randPart}`;
  });
  const [treatmentName, setTreatmentName] = useState("");
  const [description, setDescription] = useState("");

  const [treatmentImages, setTreatmentImages] = useState<string[]>([]);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [shortReelUrl, setShortReelUrl] = useState("");

  const [serviceCategory, setServiceCategory] = useState("");

  const [mrp, setMrp] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [pricePerSession, setPricePerSession] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  const [sessions, setSessions] = useState("");
  const [duration, setDuration] = useState("");
  const [validity, setValidity] = useState("");
  const [technologyUsed, setTechnologyUsed] = useState("");

  const [gender, setGender] = useState<"Unisex" | "Male" | "Female">("Unisex");
  const [promoCode, setPromoCode] = useState("");

  const [addToCart, setAddToCart] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [notification, setNotification] = useState("");

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await fetch(`${API_URL}/clinics`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setClinics(data);
          if (data.length > 0) {
            setSelectedClinicId((prev) =>
              prev && data.some((clinic) => clinic._id === prev)
                ? prev
                : data[0]._id
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch clinics", error);
      }
    };

    fetchClinics();
  }, []);

  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/service-categories`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setServiceCategories(data);
          setServiceCategory((prev) => prev || data[0]?.name || "");
        }
      } catch (error) {
        console.error("Failed to fetch service categories", error);
      }
    };

    fetchServiceCategories();
  }, []);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Invalid file data"));
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "treatmentImages" | "beforeImages" | "afterImages"
  ) => {
    const files = Array.from(e.target.files || []);
    const base64Images = await Promise.all(files.map(fileToBase64));

    if (type === "treatmentImages") {
      setTreatmentImages(base64Images);
      return;
    }
    if (type === "beforeImages") {
      setBeforeImages(base64Images);
      return;
    }
    setAfterImages(base64Images);
  };

  const quillModules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClinicId) {
      setNotification("Please select a clinic before submitting.");
      return;
    }
    if (!treatmentName.trim()) {
      setNotification("Treatment plan name is required.");
      return;
    }
    if (!serviceCategory.trim()) {
      setNotification("Please select a treatment category.");
      return;
    }

    try {
      const payload = {
        tuc,
        treatmentName: treatmentName.trim(),
        clinic: selectedClinicId,
        description,
        shortReelUrl,
        serviceCategory: serviceCategory.trim(),
        mrp,
        offerPrice,
        pricePerSession,
        discountPercent,
        sessions,
        duration,
        validity,
        technologyUsed,
        gender,
        promoCode,
        addToCart,
        isActive,
        treatmentImages,
        beforeImages,
        afterImages,
        categoryIcons: [],
      };

      const res = await fetch(`${API_URL}/treatment-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNotification("Treatment plan created successfully");
        return;
      }

      let message = "Failed to create treatment plan";
      try {
        const raw = await res.text();
        if (raw) {
          try {
            const data = JSON.parse(raw);
            message = data?.message || data?.error || message;
          } catch {
            message = raw;
          }
        }
      } catch {
        // Keep the fallback message.
      }
      setNotification(message);
    } catch (error) {
      console.error("Create treatment plan request failed", error);
      setNotification("Network error while creating treatment plan");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Treatment Plan</h1>

      {notification && <div className={styles.notification}>{notification}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>

          <div className={styles.field}>
            <label>Treatment Unique Code</label>
            <input value={tuc} disabled className={styles.readonlyInput} />
          </div>

          <div className={styles.field}>
            <label>Treatment Plan Name</label>
            <input
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Select Clinic</label>
            <select
              className={styles.select}
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              required
            >
              <option value="">Select clinic</option>
              {clinics.map((clinic) => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.clinicName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fullField}>
            <label>Plan Description</label>
            <div className={styles.quillWrapper}>
              <ReactQuill
                value={description}
                onChange={setDescription}
                modules={quillModules}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Media & Visuals</h2>

          <div className={styles.field}>
            <label>Treatment Short Reel URL</label>
            <input
              value={shortReelUrl}
              onChange={(e) => setShortReelUrl(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>Treatment Images</label>
            <input
              type="file"
              multiple
              className={styles.fileInput}
              onChange={(e) => handleFileChange(e, "treatmentImages")}
            />
          </div>

          <div className={styles.field}>
            <label>Before Images</label>
            <input
              type="file"
              multiple
              className={styles.fileInput}
              onChange={(e) => handleFileChange(e, "beforeImages")}
            />
          </div>

          <div className={styles.field}>
            <label>After Images</label>
            <input
              type="file"
              multiple
              className={styles.fileInput}
              onChange={(e) => handleFileChange(e, "afterImages")}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Category</h2>

          <div className={styles.field}>
            <label>Treatment Category</label>
            <select
              className={styles.input}
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              required
            >
              <option value="">Select service category</option>
              {serviceCategories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pricing</h2>

          <div className={styles.field}>
            <label>Gross Price (MRP)</label>
            <input
              className={styles.input}
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Offer Price (Incl. Taxes)</label>
            <input
              className={styles.input}
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Price Per Session (Optional)</label>
            <input
              className={styles.input}
              value={pricePerSession}
              onChange={(e) => setPricePerSession(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Discount %</label>
            <input
              className={styles.input}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Treatment Details</h2>

          <div className={styles.field}>
            <label>No. of Sessions</label>
            <input
              className={styles.input}
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Treatment Duration</label>
            <input
              className={styles.input}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Validity Period</label>
            <input
              className={styles.input}
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Technology Used</label>
            <input
              className={styles.input}
              value={technologyUsed}
              onChange={(e) => setTechnologyUsed(e.target.value)}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Meta & Admin</h2>

          <div className={styles.field}>
            <label>Gender Specific</label>
            <select
              className={styles.select}
              value={gender}
              onChange={(e) =>
                setGender(e.target.value as "Unisex" | "Male" | "Female")
              }
            >
              <option value="Unisex">Unisex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Promo Code</label>
            <input
              className={styles.input}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          </div>

          <div className={styles.switchRow}>
            <label>
              <input
                type="checkbox"
                checked={addToCart}
                onChange={() => setAddToCart(!addToCart)}
              />
              Add to Cart
            </label>

            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
              />
              Active
            </label>
          </div>
        </section>

        <button type="submit" className={styles.submitBtn}>
          Create Treatment Plan
        </button>
      </form>
    </div>
  );
}

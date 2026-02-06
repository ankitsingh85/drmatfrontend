"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import styles from "@/styles/clinicdashboard/clinicservices.module.css";
import "react-quill/dist/quill.snow.css";
import { API_URL } from "@/config/api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface JwtPayload {
  id: string;
}

// const API_URL =
  // process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export default function CreateTreatmentPlan() {
  const [clinicId, setClinicId] = useState<string | null>(null);

  /* Core */
  const [tuc] = useState(`TUC-${Date.now().toString().slice(-6)}`);
  const [treatmentName, setTreatmentName] = useState("");
  const [description, setDescription] = useState("");

  /* Media */
  const [treatmentImages, setTreatmentImages] = useState<File[]>([]);
  const [beforeAfterImages, setBeforeAfterImages] = useState<File[]>([]);
  const [shortReelUrl, setShortReelUrl] = useState("");

  /* Category */
  const [serviceCategory, setServiceCategory] = useState("");
  const [categoryIcons, setCategoryIcons] = useState<File[]>([]);

  /* Pricing */
  const [mrp, setMrp] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [pricePerSession, setPricePerSession] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  /* Treatment */
  const [sessions, setSessions] = useState("");
  const [duration, setDuration] = useState("");
  const [validity, setValidity] = useState("");
  const [technologyUsed, setTechnologyUsed] = useState("");

  /* Content */
  const [instructions, setInstructions] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");

  /* Meta */
  const [gender, setGender] = useState("Unisex");
  const [paymentOptions, setPaymentOptions] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState("");

  /* Admin Controls */
  const [addToCart, setAddToCart] = useState(true);
  const [isActive, setIsActive] = useState(true);

  /* Reviews */
  const [rating, setRating] = useState("");
  const [reviews, setReviews] = useState("");
  const [patientFeedback, setPatientFeedback] = useState("");

  const [notification, setNotification] = useState("");

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      setClinicId(decoded.id);
    }
  }, []);

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
    if (!clinicId) return;

    const payload = {
      tuc,
      treatmentName,
      clinic: clinicId,
      description,
      shortReelUrl,
      serviceCategory,
      mrp,
      offerPrice,
      pricePerSession,
      discountPercent,
      sessions,
      duration,
      validity,
      technologyUsed,
      instructions,
      disclaimer,
      inclusions,
      exclusions,
      gender,
      paymentOptions,
      promoCode,
      addToCart,
      isActive,
      rating,
      reviews,
      patientFeedback,
    };

    const res = await fetch(`${API_URL}/treatment-plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setNotification(
      res.ok ? "✅ Treatment Plan Created Successfully" : "❌ Failed to Create"
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Treatment Plan</h1>

      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* BASIC INFO */}
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

          <div className={styles.fullField}>
            <label>Plan Description</label>
            <ReactQuill
              value={description}
              onChange={setDescription}
              modules={quillModules}
            />
          </div>
        </section>

        {/* MEDIA */}
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
            <input type="file" multiple className={styles.fileInput} />
          </div>

          <div className={styles.field}>
            <label>Before / After Images</label>
            <input type="file" multiple className={styles.fileInput} />
          </div>
        </section>

        {/* CATEGORY */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Category</h2>

          <div className={styles.field}>
            <label>Treatment Category</label>
            <input
              className={styles.input}
              onChange={(e) => setServiceCategory(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Category Icon Images</label>
            <input type="file" multiple className={styles.fileInput} />
          </div>
        </section>

        {/* PRICING */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pricing</h2>

          <div className={styles.field}>
            <label>Gross Price (MRP)</label>
            <input className={styles.input} onChange={(e) => setMrp(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Offer Price (Incl. Taxes)</label>
            <input
              className={styles.input}
              onChange={(e) => setOfferPrice(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Price Per Session (Optional)</label>
            <input
              className={styles.input}
              onChange={(e) => setPricePerSession(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Discount %</label>
            <input
              className={styles.input}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
        </section>

        {/* DETAILS */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Treatment Details</h2>

          <div className={styles.field}>
            <label>No. of Sessions</label>
            <input className={styles.input} onChange={(e) => setSessions(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Treatment Duration</label>
            <input className={styles.input} onChange={(e) => setDuration(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Validity Period</label>
            <input className={styles.input} onChange={(e) => setValidity(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Technology Used</label>
            <input
              className={styles.input}
              onChange={(e) => setTechnologyUsed(e.target.value)}
            />
          </div>
        </section>

        {/* META */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Meta & Admin</h2>

          <div className={styles.field}>
            <label>Gender Specific</label>
            <select className={styles.select} onChange={(e) => setGender(e.target.value)}>
              <option>Unisex</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Payment Options</label>
            <select
              multiple
              className={styles.select}
              onChange={(e) =>
                setPaymentOptions(
                  Array.from(e.target.selectedOptions, (o) => o.value)
                )
              }
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>EMI</option>
            </select>
          </div>

          <div className={styles.switchRow}>
            <label>
              <input type="checkbox" checked={addToCart} onChange={() => setAddToCart(!addToCart)} />
              Add to Cart
            </label>

            <label>
              <input type="checkbox" checked={isActive} onChange={() => setIsActive(!isActive)} />
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

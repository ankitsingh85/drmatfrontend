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

interface Clinic {
  _id: string;
  clinicName: string;
}

interface ServiceCategory {
  _id: string;
  name: string;
}

export default function CreateTreatmentPlan() {
  const [defaultClinicId, setDefaultClinicId] = useState<string | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );

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
  const [paymentOption, setPaymentOption] = useState("Cash");
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
      setDefaultClinicId(decoded.id);
      setSelectedClinicId(decoded.id);
    }
  }, []);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await fetch(`${API_URL}/clinics`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setClinics(data);
          if (data.length > 0) {
            setSelectedClinicId((prev) => prev || data[0]._id);
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "treatmentImages" | "beforeAfterImages" | "categoryIcons"
  ) => {
    const files = Array.from(e.target.files || []);
    if (type === "treatmentImages") {
      setTreatmentImages(files);
      return;
    }
    if (type === "beforeAfterImages") {
      setBeforeAfterImages(files);
      return;
    }
    setCategoryIcons(files);
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
    const finalClinicId = selectedClinicId || defaultClinicId;
    if (!finalClinicId) {
      setNotification("Please select a clinic before submitting.");
      return;
    }

    const formData = new FormData();

    formData.append("tuc", tuc);
    formData.append("treatmentName", treatmentName);
    formData.append("clinic", finalClinicId);
    formData.append("description", description);
    formData.append("shortReelUrl", shortReelUrl);
    formData.append("serviceCategory", serviceCategory);
    formData.append("mrp", mrp);
    formData.append("offerPrice", offerPrice);
    formData.append("pricePerSession", pricePerSession);
    formData.append("discountPercent", discountPercent);
    formData.append("sessions", sessions);
    formData.append("duration", duration);
    formData.append("validity", validity);
    formData.append("technologyUsed", technologyUsed);
    formData.append("instructions", instructions);
    formData.append("disclaimer", disclaimer);
    formData.append("inclusions", inclusions);
    formData.append("exclusions", exclusions);
    formData.append("gender", gender);
    formData.append("paymentOption", paymentOption);
    formData.append("promoCode", promoCode);
    formData.append("addToCart", String(addToCart));
    formData.append("isActive", String(isActive));
    formData.append("rating", rating);
    formData.append("reviews", reviews);
    formData.append("patientFeedback", patientFeedback);

    treatmentImages.forEach((file) => formData.append("treatmentImages", file));
    beforeAfterImages.forEach((file) => formData.append("beforeAfterImages", file));
    categoryIcons.forEach((file) => formData.append("categoryIcons", file));

    const res = await fetch(`${API_URL}/treatment-plans`, {
      method: "POST",
      body: formData,
    });

    setNotification(
      res.ok ? "Treatment plan created successfully" : "Failed to create treatment plan"
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
            <input
              type="file"
              multiple
              className={styles.fileInput}
              onChange={(e) => handleFileChange(e, "treatmentImages")}
            />
          </div>

          <div className={styles.field}>
            <label>Before / After Images</label>
            <input
              type="file"
              multiple
              className={styles.fileInput}
              onChange={(e) => handleFileChange(e, "beforeAfterImages")}
            />
          </div>
        </section>

        {/* CATEGORY */}
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

          <div className={styles.field}>
            <label>Category Icon Images</label>
            <input
              type="file"
              multiple
              className={styles.fileInput}
              onChange={(e) => handleFileChange(e, "categoryIcons")}
            />
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
              className={styles.select}
              value={paymentOption}
              onChange={(e) => setPaymentOption(e.target.value)}
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>EMI</option>
              <option>Net Banking</option>
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

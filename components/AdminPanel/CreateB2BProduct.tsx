"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Dashboard/createb2bproduct.module.css";

// const API_URL =
//   process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

/* ================= CATEGORY TYPE ================= */
interface B2BCategory {
  _id: string;
  name: string;
}

export default function CreateB2BProduct() {
  const [sku] = useState(`B2B-${Date.now().toString().slice(-6)}`);

  /* ================= CATEGORY STATE ================= */
  const [categories, setCategories] = useState<B2BCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [form, setForm] = useState({
    productName: "",
    category: "",
    hsnCode: "",
    brandName: "",
    packSize: "",
    pricePerUnit: "",
    bulkPriceTier: "",
    moq: "",
    stockAvailable: "",
    expiryDate: "",

    description: "",
    ingredients: "",
    usageInstructions: "",
    treatmentIndications: "",
    certifications: "",

    manufacturerName: "",
    licenseNumber: "",
    mrp: "",
    discountedPrice: "",
    gst: "",
    taxIncluded: true,

    countryOfOrigin: "",
    shippingWeight: "",
    dispatchTime: "",
    returnPolicy: "",
    howToUseVideo: "",

    productImages: "",
    msds: "",
    customerReviews: "",
    relatedProducts: "",
    promotionalTags: "",

    addToCart: true,
    inAppChat: true,
    chooseFromList: "",
    issueDescription: "",

    chatOption: true,
    tollFreeNumber: "",
    email: "",
  });

  /* ================= FETCH B2B CATEGORIES ================= */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch(`${API_URL}/b2b-categories`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch B2B categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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

  /* ================= UPDATED SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      /* ❌ LOGISTICS (READ ONLY) */
      countryOfOrigin,
      shippingWeight,
      dispatchTime,
      returnPolicy,
      howToUseVideo,

      /* ❌ ACTIONS & CONTACT (READ ONLY) */
      addToCart,
      inAppChat,
      chooseFromList,
      issueDescription,
      chatOption,
      tollFreeNumber,
      email,

      ...dbFields
    } = form;

    const payload = {
      sku,
      ...dbFields,
    };

    console.log("✅ B2B PRODUCT PAYLOAD", payload);

    await fetch(`${API_URL}/b2b-products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert("B2B Product saved successfully");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create B2B Product</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* BASIC INFO */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>SKU / Product Code</label>
            <input className={styles.readonlyInput} value={sku} disabled />
          </div>

          <input
            className={styles.input}
            name="productName"
            placeholder="Product Name"
            onChange={handleChange}
          />

          {/* ✅ DYNAMIC CATEGORY */}
          <select
            className={styles.select}
            name="category"
            value={form.category}
            onChange={handleChange}
            disabled={loadingCategories}
          >
            <option value="">
              {loadingCategories
                ? "Loading categories..."
                : "Select B2B Category"}
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            className={styles.input}
            name="hsnCode"
            placeholder="HSN Code"
            onChange={handleChange}
          />
          <input
            className={styles.input}
            name="brandName"
            placeholder="Brand Name"
            onChange={handleChange}
          />
        </div>

        {/* PRICING */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Pricing & Quantity</h3>

          <input className={styles.input} name="packSize" placeholder="Pack Size / Quantity" onChange={handleChange} />
          <input className={styles.input} name="pricePerUnit" placeholder="Price per Unit" onChange={handleChange} />
          <input className={styles.input} name="bulkPriceTier" placeholder="Bulk Price Tier" onChange={handleChange} />
          <input className={styles.input} name="moq" placeholder="MOQ" onChange={handleChange} />
          <input className={styles.input} name="stockAvailable" placeholder="Stock Available" onChange={handleChange} />
          <input type="date" className={styles.input} name="expiryDate" onChange={handleChange} />
        </div>

        {/* DESCRIPTION */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Product Details</h3>

          <textarea className={styles.textarea} name="description" placeholder="Product Description" onChange={handleChange} />
          <textarea className={styles.textarea} name="ingredients" placeholder="Key Ingredients / Components" onChange={handleChange} />
          <textarea className={styles.textarea} name="usageInstructions" placeholder="Usage Instructions" onChange={handleChange} />
          <textarea className={styles.textarea} name="treatmentIndications" placeholder="Treatment Indications" onChange={handleChange} />
          <input className={styles.input} name="certifications" placeholder="Certifications" onChange={handleChange} />
        </div>

        {/* MANUFACTURER */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Manufacturer & Tax</h3>

          <input className={styles.input} name="manufacturerName" placeholder="Manufacturer Name" onChange={handleChange} />
          <input className={styles.input} name="licenseNumber" placeholder="License Number" onChange={handleChange} />
          <input className={styles.input} name="mrp" placeholder="MRP (if applicable)" onChange={handleChange} />
          <input className={styles.input} name="discountedPrice" placeholder="Discounted Price (B2B)" onChange={handleChange} />
          <input className={styles.input} name="gst" placeholder="GST %" onChange={handleChange} />

          <select className={styles.select} name="taxIncluded" onChange={handleChange}>
            <option value="true">Tax Included</option>
            <option value="false">Tax Excluded</option>
          </select>
        </div>

        {/* LOGISTICS (READ ONLY) */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Logistics</h3>

          <input className={styles.input} disabled placeholder="Country of Origin" />
          <input className={styles.input} disabled placeholder="Shipping Weight" />
          <input className={styles.input} disabled placeholder="Dispatch Time" />
          <input className={styles.input} disabled placeholder="Return Policy" />
          <input className={styles.input} disabled placeholder="How to Use Video / Manual" />
        </div>

        {/* MEDIA & SUPPORT */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Media & Support</h3>

          <input className={styles.input} name="productImages" placeholder="Product Images (Upload / URL)" onChange={handleChange} />
          <input className={styles.input} name="msds" placeholder="MSDS / Product Datasheet" onChange={handleChange} />
          <textarea className={styles.textarea} name="customerReviews" placeholder="Customer Ratings / Reviews" onChange={handleChange} />
          <input className={styles.input} name="relatedProducts" placeholder="Related Products / Add-ons" onChange={handleChange} />
          <input className={styles.input} name="promotionalTags" placeholder="Promotional Tags" onChange={handleChange} />
        </div>

        {/* ACTIONS & CONTACT (READ ONLY) */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Actions & Contact</h3>

          <div className={styles.switchRow}>
            <label><input type="checkbox" disabled checked /> Add to Cart</label>
            <label><input type="checkbox" disabled checked /> In-App Chat with Supplier</label>
            <label><input type="checkbox" disabled checked /> Chat Option</label>
          </div>

          <input className={styles.input} disabled placeholder="Choose from list" />
          <textarea className={styles.textarea} disabled placeholder="Describe your issue in detail" />
          <input className={styles.input} disabled placeholder="Toll Free Number" />
          <input className={styles.input} disabled placeholder="Write an Email" />
        </div>

        <button className={styles.submitBtn}>Submit B2B Product</button>
      </form>
    </div>
  );
}

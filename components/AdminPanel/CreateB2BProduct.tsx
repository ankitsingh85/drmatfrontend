"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Dashboard/createb2bproduct.module.css";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

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
    gst: "5",
    taxIncluded: true,

    countryOfOrigin: "",
    shippingWeight: "",
    dispatchTime: "",
    returnPolicy: "",

    productImages: [] as string[],
    productVideoUrl: "",
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

  const numericFields = new Set([
    "packSize",
    "pricePerUnit",
    "bulkPriceTier",
    "moq",
    "stockAvailable",
    "mrp",
    "discountedPrice",
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    let nextValue: string | boolean = value;

    if (numericFields.has(name)) {
      nextValue = value.replace(/\D/g, "");
    }

    if (name === "taxIncluded") {
      nextValue = value === "true";
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : nextValue,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({
          ...prev,
          productImages: [...prev.productImages, reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
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

  /* ================= UPDATED SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      /* ❌ LOGISTICS (READ ONLY) */
      countryOfOrigin,
      shippingWeight,
      dispatchTime,
      returnPolicy,

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

          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="packSize"
            value={form.packSize}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Pack Size / Quantity"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="pricePerUnit"
            value={form.pricePerUnit}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Price per Unit"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="bulkPriceTier"
            value={form.bulkPriceTier}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Bulk Price Tier"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="moq"
            value={form.moq}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="MOQ"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="stockAvailable"
            value={form.stockAvailable}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Stock Available"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input type="date" className={styles.input} name="expiryDate" onChange={handleChange} />
        </div>

        {/* DESCRIPTION */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Product Details</h3>

          <div className={styles.field}>
            <label className={styles.label}>Product Description</label>
            <ReactQuill
              className={styles.quill}
              value={form.description}
              onChange={(v) => setForm((prev) => ({ ...prev, description: v }))}
              modules={quillModules}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Key Ingredients / Components</label>
            <ReactQuill
              className={styles.quill}
              value={form.ingredients}
              onChange={(v) => setForm((prev) => ({ ...prev, ingredients: v }))}
              modules={quillModules}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Usage Instructions</label>
            <ReactQuill
              className={styles.quill}
              value={form.usageInstructions}
              onChange={(v) => setForm((prev) => ({ ...prev, usageInstructions: v }))}
              modules={quillModules}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Treatment Indications</label>
            <ReactQuill
              className={styles.quill}
              value={form.treatmentIndications}
              onChange={(v) => setForm((prev) => ({ ...prev, treatmentIndications: v }))}
              modules={quillModules}
            />
          </div>
          <input className={styles.input} name="certifications" placeholder="Certifications" onChange={handleChange} />
        </div>

        {/* MANUFACTURER */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Manufacturer & Tax</h3>

          <input className={styles.input} name="manufacturerName" placeholder="Manufacturer Name" onChange={handleChange} />
          <input className={styles.input} name="licenseNumber" placeholder="License Number" onChange={handleChange} />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="mrp"
            value={form.mrp}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="MRP (if applicable)"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="discountedPrice"
            value={form.discountedPrice}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Discounted Price (B2B)"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <select className={styles.select} name="gst" value={form.gst} onChange={handleChange}>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>

          <select className={styles.select} name="taxIncluded" value={String(form.taxIncluded)} onChange={handleChange}>
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
        </div>

        {/* MEDIA & SUPPORT */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Media & Support</h3>

          <input
            type="file"
            multiple
            accept="image/*"
            className={styles.input}
            onChange={handleImageUpload}
          />
          <input className={styles.input} name="productVideoUrl" placeholder="Product Video URL" onChange={handleChange} />
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

"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Dashboard/createproduct.module.css";
import "react-quill/dist/quill.snow.css";
import { API_URL } from "@/config/api";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

/* ================= CATEGORY TYPE ================= */
interface Category {
  id: string;
  name: string;
}

/* ================= API BASE ================= */
// const API_URL =
  // process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

export default function CreateProduct() {
  /* ================= AUTO SKU ================= */
  const [productSKU] = useState(`SKU-${Date.now().toString().slice(-6)}`);

  /* ================= CATEGORY STATE ================= */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    productName: "",
    category: "",
    // subCategory: "", // ❌ not used anymore (intentionally kept)
    brandName: "",

    description: "",
    ingredients: "",
    targetConcerns: "",
    usageInstructions: "",
    netQuantity: "",
    mrpPrice: "",
    discountedPrice: "",
    discountPercent: "",
    taxPercent: "",

    expiryDate: "",
    manufacturerName: "",
    licenseNumber: "",
    packagingType: "",

    productImages: [] as string[],
    productShortVideo: "",

    benefits: "",
    rating: "", // read-only
    shippingTime: "", // read-only
    returnPolicy: "", // read-only
    certifications: "",

    gender: "Unisex",
    skinHairType: "",
    barcode: "",

    availabilityStatus: "Available", // read-only
    stockStatus: "In Stock", // read-only
    reviews: "", // read-only

    dermatologistRecommended: false, // read-only
    activeStatus: true, // read-only
  });

  /* ================= FETCH CATEGORIES ================= */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch(`${API_URL}/categories`);
        const data = await res.json();

        const normalized = data
          .map((cat: any) => ({
            id: cat.id || cat._id,
            name: cat.name,
          }))
          .filter((cat: Category) => cat.id && cat.name);

        setCategories(normalized);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  /* ================= HANDLERS ================= */
  const numericFields = new Set([
    "netQuantity",
    "mrpPrice",
    "discountedPrice",
    "discountPercent",
    "taxPercent",
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

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : nextValue,
    }));
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) return;
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

  const quillModules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      productSKU,
      productName: form.productName,
      category: form.category,
      // subCategory: form.subCategory, ❌ intentionally not sent
      brandName: form.brandName,

      description: form.description,
      ingredients: form.ingredients,
      targetConcerns: form.targetConcerns,
      usageInstructions: form.usageInstructions,
      benefits: form.benefits,
      certifications: form.certifications,

      netQuantity: form.netQuantity,
      mrpPrice: Number(form.mrpPrice),
      discountedPrice: Number(form.discountedPrice),
      discountPercent: Number(form.discountPercent),
      taxPercent: Number(form.taxPercent),

      expiryDate: form.expiryDate,
      manufacturerName: form.manufacturerName,
      licenseNumber: form.licenseNumber,
      packagingType: form.packagingType,

      productImages: form.productImages,
      productShortVideo: form.productShortVideo,

      gender: form.gender,
      skinHairType: form.skinHairType,
      barcode: form.barcode,
      stockStatus: form.stockStatus,
      activeStatus: form.activeStatus,
      dermatologistRecommended: form.dermatologistRecommended,
    };

    console.log("✅ FINAL PRODUCT PAYLOAD", payload);

    await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert("Product saved successfully (check console)");
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Create Product</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ===== BASIC INFO ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>Product SKU (Auto)</label>
            <input className={styles.readonlyInput} value={productSKU} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Product Name</label>
            <input className={styles.input} name="productName" onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Product Category</label>
            <select
              className={styles.select}
              name="category"
              value={form.category}
              onChange={handleChange}
              disabled={loadingCategories}
            >
              <option value="">
                {loadingCategories ? "Loading categories..." : "Select Category"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Brand Name</label>
            <input className={styles.input} name="brandName" onChange={handleChange} />
          </div>
        </div>

        {/* ===== DESCRIPTION ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>

          <div className={styles.fullField}>
            <label className={styles.label}>Product Description</label>
            <ReactQuill
              className={styles.quillLarge}
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              modules={quillModules}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Ingredients</label>
            <ReactQuill
              className={styles.quillCompact}
              value={form.ingredients}
              onChange={(v) => setForm({ ...form, ingredients: v })}
              modules={quillModules}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Target Concerns</label>
            <ReactQuill
              className={styles.quillCompact}
              value={form.targetConcerns}
              onChange={(v) => setForm({ ...form, targetConcerns: v })}
              modules={quillModules}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Usage Instructions</label>
            <ReactQuill
              className={styles.quillCompact}
              value={form.usageInstructions}
              onChange={(v) => setForm({ ...form, usageInstructions: v })}
              modules={quillModules}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Benefits</label>
            <ReactQuill
              className={styles.quillCompact}
              value={form.benefits}
              onChange={(v) => setForm({ ...form, benefits: v })}
              modules={quillModules}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Certifications</label>
            <input className={styles.input} name="certifications" onChange={handleChange} />
          </div>
        </div>

        {/* ===== PRICING ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Pricing</h3>

          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="netQuantity"
            value={form.netQuantity}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Net Quantity"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="mrpPrice"
            value={form.mrpPrice}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="MRP Price"
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
            placeholder="Discounted Price"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <input
            type="number"
            min="0"
            step="1"
            className={styles.input}
            name="discountPercent"
            value={form.discountPercent}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Discount (%)"
            onKeyDown={handleNumberKeyDown}
            onChange={handleChange}
          />
          <select
            className={styles.select}
            name="taxPercent"
            value={form.taxPercent}
            onChange={handleChange}
          >
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
          </select>
        </div>

        {/* ===== COMPLIANCE ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Compliance & Packaging</h3>

          <input type="date" className={styles.input} name="expiryDate" onChange={handleChange} />
          <input className={styles.input} name="manufacturerName" placeholder="Manufacturer Name" onChange={handleChange} />
          <input className={styles.input} name="licenseNumber" placeholder="License / FSSAI No." onChange={handleChange} />
          <input className={styles.input} name="packagingType" placeholder="Packaging Type" onChange={handleChange} />
        </div>

        {/* ===== MEDIA ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Media</h3>

          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,image/jpeg,image/png,image/webp"
            className={styles.fileInput}
            onChange={handleImageUpload}
          />
          <input className={styles.input} name="productShortVideo" placeholder="Product Short Video URL" onChange={handleChange} />
        </div>

        {/* ===== META ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Product Meta</h3>

          <select className={styles.select} name="gender" value={form.gender} onChange={handleChange}>
            <option>Unisex</option>
            <option>Male</option>
            <option>Female</option>
          </select>

          <input className={styles.input} name="skinHairType" placeholder="Skin / Hair Type" onChange={handleChange} />
          <input className={styles.input} name="barcode" placeholder="Barcode / SKU" onChange={handleChange} />
        </div>

        {/* ===== PRODUCT STATUS ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Product Status</h3>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.stockStatus === "In Stock"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stockStatus: e.target.checked ? "In Stock" : "Out of Stock",
                }))
              }
            />
            In Stock
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="activeStatus"
              checked={form.activeStatus}
              onChange={handleChange}
            />
            Active
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="dermatologistRecommended"
              checked={form.dermatologistRecommended}
              onChange={handleChange}
            />
            Dermatologist Recommended
          </label>
        </div>

        <button className={styles.submitBtn}>Save Product</button>
      </form>
    </div>
  );
}

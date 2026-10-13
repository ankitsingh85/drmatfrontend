"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/Dashboard/createproduct.module.css";
import "react-quill/dist/quill.snow.css";
import { API_URL } from "@/config/api";
import { useToast } from "@/context/ToastContext";

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
  const toast = useToast();
  /* ================= AUTO SKU ================= */
  // const [productSKU] = useState(`SKU-${Date.now().toString().slice(-6)}`);
  const [productSKU] = useState("Auto Generated");

  /* ================= CATEGORY STATE ================= */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  /* ================= CUSTOM QUANTITY UNIT ================= */
  const [customUnitMode, setCustomUnitMode] = useState(false);

  /* ================= CUSTOM TAX % / GENDER ================= */
  const [customTaxMode, setCustomTaxMode] = useState(false);
  const [customGenderMode, setCustomGenderMode] = useState(false);

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    productName: "",
category: [] as string[],

  // subCategory: "", // ❌ not used anymore (intentionally kept)
    brandName: "",

    description: "",
    ingredients: "",
    targetConcerns: "",
    usageInstructions: "",
    netQuantity: "",
    quantityUnit: "Nos",
    mrpPrice: "",
    discountedPrice: "",
    discountPercent: "",
    taxPercent: "",

    expiryDate: "",
    manufacturerName: "",
 licenseNumber: "",
hsnCode:"",
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
    let nextValue: string | boolean | string[] = value;

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

    if (
      !form.productName.trim() ||
      !form.category.length ||
      !form.discountedPrice.trim()
    ) {
      toast.error("Please fill Product Name, Category and Discounted Price before creating the product.");
      return;
    }

    const payload = {
      
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
      quantityUnit: form.quantityUnit,
      mrpPrice: Number(form.mrpPrice),
      discountedPrice: Number(form.discountedPrice),
      discountPercent: Number(form.discountPercent),
      taxPercent: Number(form.taxPercent),

      expiryDate: form.expiryDate,
      manufacturerName: form.manufacturerName,
     licenseNumber: form.licenseNumber,

hsnCode: form.hsnCode,

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

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create product");

      toast.success("Product saved successfully");
      window.dispatchEvent(new Event("admin-dashboard:create-success"));
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    }
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      {/* <h1 className={styles.heading}>Create Product</h1> */}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ===== BASIC INFO ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={styles.field}>
            <label className={styles.label}>Product SKU (Auto)</label>
            <input className={styles.readonlyInput} value={productSKU} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Product Name<span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              name="productName"
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>

<label className={styles.label}>
Product Categories<span className={styles.required}>*</span>
</label>

<select

multiple

className={styles.select}

name="category"

value={form.category}

disabled={loadingCategories}


onChange={(e)=>{


const selected =
Array.from(

e.target.selectedOptions,

(option)=>option.value

);


setForm((prev)=>({

...prev,

category:selected

}));


}}

required

>


{categories.map((cat)=>(

<option

key={cat.id}

value={cat.name}

>

{cat.name}

</option>

))}


</select>
</div>
          <div className={styles.field}>
            <label className={styles.label}>Brand Name</label>
            <input
              className={styles.input}
              name="brandName"
              onChange={handleChange}
              pattern="[A-Za-z ]+"
              title="Use letters and spaces only"
            />
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

  <h3 className={styles.sectionTitle}>
    Pricing
  </h3>


  {/* NET QUANTITY */}
 <div className={styles.field}>


<label className={styles.label}>

Net Quantity

</label>



<div className={styles.quantityBox}>


<input

type="number"

className={styles.input}

name="netQuantity"

value={form.netQuantity}

onChange={handleChange}

onKeyDown={handleNumberKeyDown}

/>




<select

className={styles.select}

name="quantityUnit"

value={customUnitMode ? "Custom" : form.quantityUnit}

onChange={(e) => {
  if (e.target.value === "Custom") {
    setCustomUnitMode(true);
    setForm((prev) => ({ ...prev, quantityUnit: "" }));
  } else {
    setCustomUnitMode(false);
    handleChange(e);
  }
}}

>

<option value="Nos">Nos</option>

<option value="Qty">Qty</option>

<option value="ML">ML</option>

<option value="Grams">Grams</option>

<option value="KG">KG</option>

<option value="Litre">Litre</option>

<option value="Custom">Custom</option>


</select>

{customUnitMode && (
  <input
    type="text"
    className={styles.input}
    name="quantityUnit"
    value={form.quantityUnit}
    onChange={handleChange}
    placeholder="Enter custom unit"
  />
)}

</div>


</div>


  {/* MRP PRICE */}
  <div className={styles.field}>

    <label className={styles.label}>
      MRP Price
    </label>

    <input
      type="number"
      min="0"
      step="1"
      className={styles.input}
      name="mrpPrice"
      value={form.mrpPrice}
      inputMode="numeric"
      pattern="[0-9]*"
      onKeyDown={handleNumberKeyDown}
      onChange={handleChange}
    />

  </div>




  {/* DISCOUNTED PRICE */}
  <div className={styles.field}>

    <label className={styles.label}>
      Discounted Price<span className={styles.required}>*</span>
    </label>

    <input
      type="number"
      min="0"
      step="1"
      className={styles.input}
      name="discountedPrice"
      value={form.discountedPrice}
      inputMode="numeric"
      pattern="[0-9]*"
      onKeyDown={handleNumberKeyDown}
      onChange={handleChange}
      required
    />

  </div>




  {/* DISCOUNT */}
  <div className={styles.field}>

    <label className={styles.label}>
      Discount (%)
    </label>

    <input
      type="number"
      min="0"
      step="1"
      className={styles.input}
      name="discountPercent"
      value={form.discountPercent}
      inputMode="numeric"
      pattern="[0-9]*"
      onKeyDown={handleNumberKeyDown}
      onChange={handleChange}
    />

  </div>




  {/* TAX */}
  <div className={styles.field}>

    <label className={styles.label}>
      GST / Tax (%)
    </label>


    <select
      className={styles.select}
      name="taxPercent"
      value={customTaxMode ? "Custom" : form.taxPercent}
      onChange={(e) => {
        if (e.target.value === "Custom") {
          setCustomTaxMode(true);
          setForm((prev) => ({ ...prev, taxPercent: "" }));
        } else {
          setCustomTaxMode(false);
          handleChange(e);
        }
      }}
    >

      <option value="5">
        5%
      </option>

      <option value="12">
        12%
      </option>

      <option value="18">
        18%
      </option>

      <option value="28">
        28%
      </option>

      <option value="Custom">
        Custom
      </option>

    </select>

    {customTaxMode && (
      <input
        type="text"
        className={styles.input}
        name="taxPercent"
        value={form.taxPercent}
        onChange={handleChange}
        inputMode="numeric"
        placeholder="Enter custom GST / Tax %"
      />
    )}

  </div>

<div className={styles.field}>

<label className={styles.label}>
HSN Code
</label>

<input
className={styles.input}
type="text"
name="hsnCode"
value={form.hsnCode}
onChange={handleChange}
placeholder="Enter HSN Code"
/>

</div>


</div>
        {/* ===== COMPLIANCE ===== */}
        {/* ===== COMPLIANCE ===== */}

<div className={styles.section}>

<h3 className={styles.sectionTitle}>
Compliance & Packaging
</h3>



{/* EXPIRY DATE */}

<div className={styles.field}>

<label className={styles.label}>
Expiry Date
</label>

<input

type="date"

className={styles.input}

name="expiryDate"

value={form.expiryDate}

onChange={handleChange}

/>

</div>





{/* MANUFACTURER */}

<div className={styles.field}>

<label className={styles.label}>
Manufacturer Name
</label>


<input

className={styles.input}

name="manufacturerName"

value={form.manufacturerName}

onChange={handleChange}

pattern="[A-Za-z ]+"

title="Use letters and spaces only"

/>

</div>






{/* LICENSE */}

<div className={styles.field}>

<label className={styles.label}>
License / FSSAI No.
</label>


<input

className={styles.input}

name="licenseNumber"

value={form.licenseNumber}

onChange={handleChange}




/>

</div>




{/* PACKAGING */}

<div className={styles.field}>

<label className={styles.label}>
Packaging Type
</label>


<input

className={styles.input}

name="packagingType"

value={form.packagingType}

onChange={handleChange}

pattern="[A-Za-z ]+"

title="Use letters and spaces only"

/>


</div>


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
          <input
            className={styles.input}
            type="url"
            name="productShortVideo"
            placeholder="Product Short Video URL"
            onChange={handleChange}
          />
        </div>

        {/* ===== META ===== */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Product Meta</h3>

          <select
            className={styles.select}
            name="gender"
            value={customGenderMode ? "Custom" : form.gender}
            onChange={(e) => {
              if (e.target.value === "Custom") {
                setCustomGenderMode(true);
                setForm((prev) => ({ ...prev, gender: "" }));
              } else {
                setCustomGenderMode(false);
                handleChange(e);
              }
            }}
          >
            <option>Unisex</option>
            <option>Male</option>
            <option>Female</option>
            <option value="Custom">Custom</option>
          </select>
          {customGenderMode && (
            <input
              type="text"
              className={styles.input}
              name="gender"
              value={form.gender}
              onChange={handleChange}
              placeholder="Enter custom gender / audience"
            />
          )}

          <input
            className={styles.input}
            name="skinHairType"
            placeholder="Skin / Hair Type"
            onChange={handleChange}
          />
          <input
            className={styles.input}
            name="barcode"
            placeholder="Barcode / SKU"
            onChange={handleChange}
          />
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
